import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { missionRecommendation } = body;

    const client = getSupabaseClient();

    // 根据用户类型更新不同的表
    const table = sessionUser.userGroup === 'team_leader' ? 'team_leader_users' : 'student_users';

    const { error } = await client
      .from(table)
      .update({ mission_recommendation: missionRecommendation || '' })
      .eq('user_id', sessionUser.id);

    if (error) {
      console.error('Error updating tags:', error);
      return NextResponse.json({ error: '保存失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '标签保存成功' });
  } catch (error) {
    console.error('Update tags error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
