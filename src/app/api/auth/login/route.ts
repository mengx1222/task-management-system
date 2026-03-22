import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword, createUserSession, getUserWithProfile } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 查找用户
    const { data: user, error } = await client
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 验证密码
    const hashedPassword = await hashPassword(password);
    if (user.password !== hashedPassword) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 检查账户状态
    if (user.state !== 1) {
      return NextResponse.json({ error: '账户已被禁用' }, { status: 403 });
    }

    // 更新登录时间
    await client
      .from('users')
      .update({ login_time: new Date().toISOString() })
      .eq('id', user.id);

    // 创建会话
    await createUserSession(user);

    // 获取完整用户信息
    const sessionUser = await getUserWithProfile(user.id, (user as Record<string, unknown>).user_group as string || 'student');

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: sessionUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
