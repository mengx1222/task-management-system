import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';
import { getRecommendedTasks } from '@/lib/recommendation';

// 获取任务列表（支持推荐）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'individual'; // individual 或 team
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const taskType = searchParams.get('taskType');
    const search = searchParams.get('search');
    const recommend = searchParams.get('recommend') === 'true';

    const client = getSupabaseClient();
    const tableName = type === 'individual' ? 'individual_tasks' : 'team_tasks';

    // 如果是推荐模式，使用推荐算法
    if (recommend) {
      const sessionUser = await getSessionUser();
      const missionTags = sessionUser?.studentUser?.missionRecommendation || 
                          sessionUser?.teamLeaderUser?.missionRecommendation || null;
      
      const tasks = await getRecommendedTasks(missionTags, type as 'individual' | 'team', pageSize);
      
      return NextResponse.json({
        success: true,
        data: tasks,
        total: tasks.length,
        page,
        pageSize,
      });
    }

    // 普通查询
    let query = client
      .from(tableName)
      .select('*', { count: 'exact' })
      .eq('task_status', '未完成');

    if (taskType) {
      query = query.eq('task_type', taskType);
    }

    if (search) {
      query = query.or(`task_name.ilike.%${search}%,task_description.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: '获取任务列表失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建新任务（管理员）
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser || sessionUser.userGroup !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const {
      type, // individual 或 team
      taskNumber,
      taskName,
      courseName,
      taskType,
      taskDescription,
      taskAttachments,
      coverChart,
      deadline,
      numberOfPeopleRequired,
    } = body;

    if (!taskNumber || !taskName) {
      return NextResponse.json({ error: '任务编号和名称不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const tableName = type === 'individual' ? 'individual_tasks' : 'team_tasks';

    const taskData: Record<string, unknown> = {
      task_number: taskNumber,
      task_name: taskName,
      course_name: courseName || '',
      task_type: taskType || '',
      task_description: taskDescription || '',
      task_attachments: taskAttachments || '',
      cover_chart: coverChart || '',
      deadline: deadline || null,
      task_status: '未完成',
      create_by: sessionUser.id,
    };

    if (type === 'team') {
      (taskData as Record<string, unknown>).number_of_people_required = numberOfPeopleRequired || 1;
    }

    const { data, error } = await client
      .from(tableName)
      .insert(taskData)
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: '创建任务失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '任务创建成功',
      data,
    });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
