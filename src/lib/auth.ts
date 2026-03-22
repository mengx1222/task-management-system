import { cookies } from 'next/headers';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { User, StudentUser, TeamLeaderUser } from '@/storage/database/shared/schema';

export interface SessionUser {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  userGroup: string;
  studentUser?: StudentUser;
  teamLeaderUser?: TeamLeaderUser;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === hashedPassword;
}

export async function createUserSession(user: User): Promise<void> {
  const cookieStore = await cookies();
  // 处理数据库返回的 snake_case 字段
  const userGroup = (user as Record<string, unknown>).user_group || user.userGroup || 'student';
  const sessionData = {
    id: user.id,
    username: user.username,
    nickname: user.nickname || user.username,
    avatar: user.avatar,
    userGroup: userGroup as string,
  };
  cookieStore.set('session', JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie?.value) return null;

    const sessionData = JSON.parse(sessionCookie.value) as SessionUser;
    return sessionData;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getUserWithProfile(userId: number, userGroup: string): Promise<SessionUser | null> {
  const client = getSupabaseClient();

  const { data: user } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    username: user.username,
    nickname: user.nickname || user.username,
    avatar: user.avatar,
    userGroup: (user as Record<string, unknown>).user_group as string || user.userGroup || 'student',
  };

  if (userGroup === 'student') {
    const { data: studentUser } = await client
      .from('student_users')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (studentUser) {
      sessionUser.studentUser = studentUser as StudentUser;
    }
  } else if (userGroup === 'team_leader') {
    const { data: teamLeaderUser } = await client
      .from('team_leader_users')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (teamLeaderUser) {
      sessionUser.teamLeaderUser = teamLeaderUser as TeamLeaderUser;
    }
  }

  return sessionUser;
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.userGroup === 'admin';
}

export function isStudent(user: SessionUser | null): boolean {
  return user?.userGroup === 'student';
}

export function isTeamLeader(user: SessionUser | null): boolean {
  return user?.userGroup === 'team_leader';
}

export function requireAuth(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new Error('请先登录');
  }
  return user;
}

export function requireAdmin(user: SessionUser | null): SessionUser {
  const u = requireAuth(user);
  if (!isAdmin(u)) {
    throw new Error('需要管理员权限');
  }
  return u;
}
