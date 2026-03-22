import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';

// 任务报名
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
    const { type, registrationRemarks, teamMemberIds } = body;

    const client = getSupabaseClient();
    const taskTable = type === 'individual' ? 'individual_tasks' : 'team_tasks';
    const registrationTable = type === 'individual' ? 'task_registrations' : 'task_enrollment_teams';

    // 获取任务信息
    const { data: task, error: taskError } = await client
      .from(taskTable)
      .select('*')
      .eq('id', id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 });
    }

    // 检查是否已报名
    const userIdField = type === 'individual' ? 'student_users' : 'team_leader_user';
    const { data: existingReg } = await client
      .from(registrationTable)
      .select('id')
      .eq(userIdField, sessionUser.id)
      .eq('task_number', task.task_number)
      .single();

    if (existingReg) {
      return NextResponse.json({ error: '您已报名此任务' }, { status: 400 });
    }

    // 生成报名编号
    const enrollmentNumber = `REG${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // 创建报名记录
    const registrationData: Record<string, unknown> = {
      enrollment_number: enrollmentNumber,
      task_number: task.task_number,
      course_name: task.course_name,
      task_type: task.task_type,
      task_description: task.task_description,
      task_attachments: task.task_attachments,
      deadline: task.deadline,
      registration_date: new Date().toISOString().split('T')[0],
      registration_remarks: registrationRemarks || '',
      task_progress: '未开始',
      examine_state: '待审核',
      create_by: sessionUser.id,
    };

    if (type === 'individual') {
      registrationData.student_users = sessionUser.id;
      const studentInfo = sessionUser.studentUser;
      registrationData.student_number = studentInfo?.studentNumber || sessionUser.username;
      registrationData.student_name = studentInfo?.studentName || sessionUser.nickname;
      registrationData.contact_number = studentInfo?.contactNumber || '';
    } else {
      registrationData.team_leader_user = sessionUser.id;
      const leaderInfo = sessionUser.teamLeaderUser;
      registrationData.team_leader_student_number = leaderInfo?.teamLeaderNumber || sessionUser.username;
      registrationData.name_of_team_leader = leaderInfo?.teamLeaderName || sessionUser.nickname;
      registrationData.team_leader_mobile_phone = leaderInfo?.teamLeaderPhone || '';
      registrationData.team_member_user = teamMemberIds ? JSON.stringify(teamMemberIds) : '[]';
      registrationData.number_of_enrolment = teamMemberIds ? teamMemberIds.length + 1 : 1;
    }

    const { error: regError } = await client
      .from(registrationTable)
      .insert(registrationData);

    if (regError) {
      console.error('Error creating registration:', regError);
      return NextResponse.json({ error: '报名失败' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '报名成功，等待审核',
      enrollmentNumber,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
