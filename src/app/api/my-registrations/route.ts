import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('task_registrations')
      .select('*')
      .eq('student_users', sessionUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching registrations:', error);
      return NextResponse.json({ error: '获取报名记录失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('My registrations fetch error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
