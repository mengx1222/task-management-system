import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { hashPassword, createUserSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, nickname, userGroup, studentNumber, studentName, studentGender, contactNumber } = body;

    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少6位' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 检查用户名是否已存在
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

    // 如果是学生注册，检查学号
    if (userGroup === 'student' && studentNumber) {
      const { data: existingStudent } = await client
        .from('student_users')
        .select('id')
        .eq('student_number', studentNumber)
        .single();

      if (existingStudent) {
        return NextResponse.json({ error: '该学号已被注册' }, { status: 400 });
      }
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const { data: newUser, error: userError } = await client
      .from('users')
      .insert({
        username,
        password: hashedPassword,
        nickname: nickname || username,
        user_group: userGroup || 'student',
        state: 1,
      })
      .select()
      .single();

    if (userError || !newUser) {
      console.error('Error creating user:', userError);
      return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
    }

    // 创建学生/组长信息
    if (userGroup === 'student') {
      await client.from('student_users').insert({
        user_id: newUser.id,
        student_number: studentNumber || username,
        student_name: studentName || nickname || username,
        student_gender: studentGender || '男',
        contact_number: contactNumber || '',
        examine_state: '已通过',
      });
    } else if (userGroup === 'team_leader') {
      await client.from('team_leader_users').insert({
        user_id: newUser.id,
        team_leader_student_number: studentNumber || username,
        name_of_team_leader: studentName || nickname || username,
        group_leader_gender: studentGender || '男',
        team_leader_mobile_phone: contactNumber || '',
        examine_state: '已通过',
      });
    }

    // 创建会话
    await createUserSession(newUser);

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: newUser.id,
        username: newUser.username,
        nickname: newUser.nickname,
        userGroup: newUser.user_group,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
