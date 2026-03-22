import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';

// 提交任务
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionUser = await getSessionUser();
    
    if (!sessionUser) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { type, completeTaskAttachments, remarks } = body;

    const client = getSupabaseClient();
    const submitTable = type === 'individual' ? 'submit_tasks' : 'submit_task_teams';
    const registrationTable = type === 'individual' ? 'task_registrations' : 'task_enrollment_teams';

    // 获取报名信息
    const userIdField = type === 'individual' ? 'student_users' : 'team_leader_user';
    const { data: registration, error: regError } = await client
      .from(registrationTable)
      .select('*')
      .eq(userIdField, sessionUser.id)
      .eq('id', id)
      .single();

    if (regError || !registration) {
      return NextResponse.json({ error: '未找到报名记录' }, { status: 404 });
    }

    if (registration.examine_state !== '已通过') {
      return NextResponse.json({ error: '报名未审核通过' }, { status: 400 });
    }

    // 检查是否已提交
    const { data: existingSubmit } = await client
      .from(submitTable)
      .select('id')
      .eq('enrollment_number', registration.enrollment_number)
      .single();

    if (existingSubmit) {
      return NextResponse.json({ error: '您已提交此任务' }, { status: 400 });
    }

    // 创建提交记录
    const submitData: Record<string, unknown> = {
      enrollment_number: registration.enrollment_number,
      task_number: registration.task_number,
      course_name: registration.course_name,
      task_type: registration.task_type,
      deadline: registration.deadline,
      complete_task_attachments: completeTaskAttachments || '',
      date_of_submission: new Date().toISOString().split('T')[0],
      remarks: remarks || '',
      examine_state: '待审核',
      create_by: sessionUser.id,
    };

    if (type === 'individual') {
      submitData.student_users = sessionUser.id;
      submitData.student_number = registration.student_number;
      submitData.student_name = registration.student_name;
      submitData.contact_number = registration.contact_number;
    } else {
      submitData.team_leader_user = sessionUser.id;
      submitData.team_member_user = registration.team_member_user;
      submitData.student_number = registration.team_leader_student_number;
      submitData.student_name = registration.name_of_team_leader;
      submitData.contact_number = registration.team_leader_mobile_phone;
    }

    const { error: submitError } = await client
      .from(submitTable)
      .insert(submitData);

    if (submitError) {
      console.error('Error creating submit:', submitError);
      return NextResponse.json({ error: '提交失败' }, { status: 500 });
    }

    // 更新报名状态
    await client
      .from(registrationTable)
      .update({ task_progress: '已提交' })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      message: '任务提交成功，等待审核',
    });
  } catch (error) {
    console.error('Submit error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
