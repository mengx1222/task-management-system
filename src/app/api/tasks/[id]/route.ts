import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';

// 获取任务详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'individual';

    const client = getSupabaseClient();
    const tableName = type === 'individual' ? 'individual_tasks' : 'team_tasks';

    const { data, error } = await client
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // 增加点击量
    await client
      .from(tableName)
      .update({ hits: (data.hits || 0) + 1 })
      .eq('id', id);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 更新任务
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    
    if (!sessionUser || sessionUser.userGroup !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { type, ...updateData } = body;

    const client = getSupabaseClient();
    const tableName = type === 'individual' ? 'individual_tasks' : 'team_tasks';

    // 转换字段名为snake_case
    const snakeCaseData: Record<string, unknown> = {};
    const fieldMapping: Record<string, string> = {
      taskName: 'task_name',
      courseName: 'course_name',
      taskType: 'task_type',
      taskDescription: 'task_description',
      taskAttachments: 'task_attachments',
      coverChart: 'cover_chart',
      deadline: 'deadline',
      taskStatus: 'task_status',
      numberOfPeopleRequired: 'number_of_people_required',
    };

    for (const [key, value] of Object.entries(updateData)) {
      const snakeKey = fieldMapping[key] || key;
      snakeCaseData[snakeKey] = value;
    }

    snakeCaseData.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from(tableName)
      .update(snakeCaseData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: '更新任务失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 删除任务
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    
    if (!sessionUser || sessionUser.userGroup !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'individual';

    const client = getSupabaseClient();
    const tableName = type === 'individual' ? 'individual_tasks' : 'team_tasks';

    const { error } = await client
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: '删除任务失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '任务已删除' });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
