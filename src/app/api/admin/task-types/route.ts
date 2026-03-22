import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';

// 获取任务类型列表
export async function GET() {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('task_types')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching task types:', error);
      return NextResponse.json({ error: '获取任务类型失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Task types fetch error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建任务类型
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser || sessionUser.userGroup !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { typeName } = body;

    if (!typeName) {
      return NextResponse.json({ error: '类型名称不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('task_types')
      .insert({ task_type: typeName })
      .select()
      .single();

    if (error) {
      console.error('Error creating task type:', error);
      return NextResponse.json({ error: '创建任务类型失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Create task type error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
