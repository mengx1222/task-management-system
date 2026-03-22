import { getSupabaseClient } from '../src/storage/database/supabase-client';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function seed() {
  const client = getSupabaseClient();
  console.log('开始初始化数据...');

  try {
    // 1. 创建管理员账号
    const adminPassword = await hashPassword('admin123');
    const { data: admin, error: adminError } = await client
      .from('users')
      .upsert({
        username: 'admin',
        password: adminPassword,
        nickname: '管理员',
        user_group: 'admin',
        state: 1,
      }, { onConflict: 'username' })
      .select()
      .single();

    if (adminError) {
      console.log('管理员账号已存在或创建失败:', adminError.message);
    } else {
      console.log('管理员账号创建成功:', admin?.username);
    }

    // 2. 创建演示学生账号
    const studentPassword = await hashPassword('123456');
    const { data: student, error: studentError } = await client
      .from('users')
      .upsert({
        username: 'student',
        password: studentPassword,
        nickname: '张三',
        user_group: 'student',
        state: 1,
      }, { onConflict: 'username' })
      .select()
      .single();

    if (studentError) {
      console.log('学生账号已存在或创建失败:', studentError.message);
    } else {
      // 创建学生扩展信息
      await client
        .from('student_users')
        .upsert({
          user_id: student?.id,
          student_number: '202501001',
          student_name: '张三',
          student_gender: '男',
          contact_number: '13800138000',
          mission_recommendation: 'Python开发,Web开发,数据分析',
          examine_state: '已通过',
        }, { onConflict: 'student_number' });
      console.log('学生账号创建成功:', student?.username);
    }

    // 3. 创建任务类型
    const taskTypes = [
      '软件开发',
      '数据分析',
      '文档编写',
      '系统设计',
      '测试验证',
      '项目管理',
    ];

    for (const type of taskTypes) {
      await client
        .from('task_types')
        .upsert({ task_type: type }, { onConflict: 'task_type' });
    }
    console.log('任务类型创建成功');

    // 4. 创建示例任务
    const sampleTasks = [
      {
        task_number: 'T2026001',
        task_name: 'Web应用开发实践',
        course_name: '软件工程实践',
        task_type: '软件开发',
        task_description: '使用现代Web技术栈开发一个完整的前后端分离应用，要求实现用户认证、数据管理和报表功能。',
        deadline: '2026-06-30',
        task_status: '未完成',
      },
      {
        task_number: 'T2026002',
        task_name: '数据分析报告撰写',
        course_name: '数据分析实践',
        task_type: '数据分析',
        task_description: '对给定的业务数据进行清洗、分析和可视化，撰写完整的数据分析报告。',
        deadline: '2026-05-15',
        task_status: '未完成',
      },
      {
        task_number: 'T2026003',
        task_name: '系统设计文档编写',
        course_name: '系统分析与设计',
        task_type: '系统设计',
        task_description: '根据需求文档，完成系统架构设计、数据库设计和接口设计文档。',
        deadline: '2026-04-30',
        task_status: '未完成',
      },
    ];

    for (const task of sampleTasks) {
      await client
        .from('individual_tasks')
        .upsert(task, { onConflict: 'task_number' });
    }
    console.log('示例任务创建成功');

    // 5. 创建团队任务
    const teamTasks = [
      {
        task_number: 'TT2026001',
        task_name: '团队项目协作开发',
        course_name: '团队协作实践',
        task_type: '软件开发',
        task_description: '组建3-5人团队，共同完成一个中型软件项目的开发，要求有明确的分工和协作流程。',
        deadline: '2026-07-15',
        task_status: '未完成',
        number_of_people_required: 5,
      },
    ];

    for (const task of teamTasks) {
      await client
        .from('team_tasks')
        .upsert(task, { onConflict: 'task_number' });
    }
    console.log('团队任务创建成功');

    // 6. 创建示例通知公告
    await client.from('notices').upsert({
      title: '系统正式上线通知',
      content: '实践课程任务智能管理与评价系统已正式上线，欢迎各位同学使用。如有问题请联系管理员。',
    }, { onConflict: 'title' });
    console.log('通知公告创建成功');

    console.log('\n数据初始化完成！');
    console.log('演示账号：');
    console.log('  管理员：admin / admin123');
    console.log('  学生：student / 123456');
  } catch (error) {
    console.error('数据初始化失败:', error);
    process.exit(1);
  }
}

seed();
