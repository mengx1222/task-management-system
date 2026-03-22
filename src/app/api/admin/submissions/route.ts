import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';

// 获取提交列表
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser || sessionUser.userGroup !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'individual';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const examineState = searchParams.get('examineState');

    const client = getSupabaseClient();
    const tableName = type === 'individual' ? 'submit_tasks' : 'submit_task_teams';

    let query = client
      .from(tableName)
      .select('*', { count: 'exact' });

    if (examineState) {
      query = query.eq('examine_state', examineState);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: '获取提交列表失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
