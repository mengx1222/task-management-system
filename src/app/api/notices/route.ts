import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';

// 获取通知公告列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const client = getSupabaseClient();

    const { data, error, count } = await client
      .from('notices')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Error fetching notices:', error);
      return NextResponse.json({ error: '获取通知公告失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Notices fetch error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建通知公告（管理员）
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser || sessionUser.userGroup !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('notices')
      .insert({ title, content: content || '' })
      .select()
      .single();

    if (error) {
      console.error('Error creating notice:', error);
      return NextResponse.json({ error: '创建通知公告失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Create notice error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
