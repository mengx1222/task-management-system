import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getSessionUser } from '@/lib/auth';
import { hashPassword } from '@/lib/auth';

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser || sessionUser.userGroup !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const userGroup = searchParams.get('userGroup');
    const search = searchParams.get('search');

    const client = getSupabaseClient();

    let query = client
      .from('users')
      .select('*', { count: 'exact' });

    if (userGroup) {
      query = query.eq('user_group', userGroup);
    }

    if (search) {
      query = query.or(`username.ilike.%${search}%,nickname.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 });
    }

    // 获取用户扩展信息
    const usersWithProfile = await Promise.all(
      (data || []).map(async (user) => {
        if (user.user_group === 'student') {
          const { data: studentUser } = await client
            .from('student_users')
            .select('*')
            .eq('user_id', user.id)
            .single();
          return { ...user, studentUser };
        } else if (user.user_group === 'team_leader') {
          const { data: teamLeaderUser } = await client
            .from('team_leader_users')
            .select('*')
            .eq('user_id', user.id)
            .single();
          return { ...user, teamLeaderUser };
        }
        return user;
      })
    );

    return NextResponse.json({
      success: true,
      data: usersWithProfile,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

// 创建用户（管理员）
export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser || sessionUser.userGroup !== 'admin') {
      return NextResponse.json({ error: '需要管理员权限' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, nickname, userGroup, studentNumber, studentName, contactNumber } = body;

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 检查用户名
    const { data: existingUser } = await client
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
    }

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
      return NextResponse.json({ error: '创建用户失败' }, { status: 500 });
    }

    // 创建扩展信息
    if (userGroup === 'student') {
      await client.from('student_users').insert({
        user_id: newUser.id,
        student_number: studentNumber || username,
        student_name: studentName || nickname || username,
        contact_number: contactNumber || '',
        examine_state: '已通过',
      });
    } else if (userGroup === 'team_leader') {
      await client.from('team_leader_users').insert({
        user_id: newUser.id,
        team_leader_student_number: studentNumber || username,
        name_of_team_leader: studentName || nickname || username,
        team_leader_mobile_phone: contactNumber || '',
        examine_state: '已通过',
      });
    }

    return NextResponse.json({
      success: true,
      message: '用户创建成功',
      data: newUser,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
