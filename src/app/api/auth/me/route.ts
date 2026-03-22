import { NextResponse } from 'next/server';
import { getSessionUser, getUserWithProfile } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser) {
      return NextResponse.json({ error: '未登录', user: null }, { status: 401 });
    }

    // 获取完整的用户信息
    const fullUser = await getUserWithProfile(sessionUser.id, sessionUser.userGroup);
    
    return NextResponse.json({ user: fullUser });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
