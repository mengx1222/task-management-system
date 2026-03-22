import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';

// 获取评价列表
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

    const client = getSupabaseClient();
    const tableName = type === 'individual' ? 'task_evaluations' : 'task_evaluation_teams';

    const { data, error, count } = await client
      .from(tableName)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Error fetching evaluations:', error);
      return NextResponse.json({ error: '获取评价列表失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Evaluations fetch error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建评价
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser || sessionUser.userGroup !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const {
      type,
      enrollmentNumber,
      taskNumber,
      studentId,
      teamLeaderId,
      evaluationScore,
      evaluationGrade,
      taskEvaluation,
    } = body;

    const client = getSupabaseClient();
    const evaluationTable = type === 'individual' ? 'task_evaluations' : 'task_evaluation_teams';
    const submitTable = type === 'individual' ? 'submit_tasks' : 'submit_task_teams';

    // 获取提交信息
    const { data: submit } = await client
      .from(submitTable)
      .select('*')
      .eq('enrollment_number', enrollmentNumber)
      .single();

    // 创建评价
    const evaluationData: Record<string, unknown> = {
      enrollment_number: enrollmentNumber,
      task_number: taskNumber,
      course_name: submit?.course_name || '',
      task_type: submit?.task_type || '',
      evaluation_score: evaluationScore,
      evaluation_grade: evaluationGrade,
      task_evaluation: taskEvaluation,
      complete_task_attachments: submit?.complete_task_attachments || '',
      student_number: submit?.student_number || '',
      student_name: submit?.student_name || '',
      contact_number: submit?.contact_number || '',
      create_by: sessionUser.id,
    };

    if (type === 'individual') {
      evaluationData.student_users = studentId;
    } else {
      evaluationData.team_leader_user = teamLeaderId;
      evaluationData.team_member_user = submit?.team_member_user || '';
    }

    const { error } = await client
      .from(evaluationTable)
      .insert(evaluationData);

    if (error) {
      console.error('Error creating evaluation:', error);
      return NextResponse.json({ error: '创建评价失败' }, { status: 500 });
    }

    // 更新提交状态
    await client
      .from(submitTable)
      .update({
        examine_state: '已通过',
        examine_reply: `评价完成：${evaluationGrade}（${evaluationScore}分）`,
      })
      .eq('enrollment_number', enrollmentNumber);

    return NextResponse.json({ success: true, message: '评价提交成功' });
  } catch (error) {
    console.error('Create evaluation error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
