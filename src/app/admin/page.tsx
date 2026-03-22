'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  BarChart3,
} from 'lucide-react';

interface Stats {
  users: number;
  tasks: number;
  pendingRegistrations: number;
  pendingSubmissions: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    users: 0,
    tasks: 0,
    pendingRegistrations: 0,
    pendingSubmissions: 0,
  });

  useEffect(() => {
    checkAdmin();
    fetchStats();
  }, []);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.user || data.user.userGroup !== 'admin') {
        router.push('/');
      }
    } catch {
      router.push('/');
    }
  };

  const fetchStats = async () => {
    try {
      // 并行获取统计数据
      const [usersRes, tasksRes, regRes, subRes] = await Promise.all([
        fetch('/api/admin/users?pageSize=1'),
        fetch('/api/tasks?pageSize=1'),
        fetch('/api/admin/registrations?examineState=待审核&pageSize=1'),
        fetch('/api/admin/submissions?examineState=待审核&pageSize=1'),
      ]);

      const usersData = await usersRes.json();
      const tasksData = await tasksRes.json();
      const regData = await regRes.json();
      const subData = await subRes.json();

      setStats({
        users: usersData.total || 0,
        tasks: (tasksData.total || 0),
        pendingRegistrations: regData.total || 0,
        pendingSubmissions: subData.total || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      title: '用户管理',
      description: '管理系统用户账号',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-500',
    },
    {
      title: '任务管理',
      description: '管理个人任务和团队任务',
      icon: FileText,
      href: '/admin/tasks',
      color: 'text-green-500',
    },
    {
      title: '报名审核',
      description: '审核用户报名申请',
      icon: CheckCircle,
      href: '/admin/registrations',
      color: 'text-yellow-500',
    },
    {
      title: '提交审核',
      description: '审核任务提交成果',
      icon: Clock,
      href: '/admin/submissions',
      color: 'text-purple-500',
    },
    {
      title: '通知公告',
      description: '发布和管理通知公告',
      icon: Bell,
      href: '/admin/notices',
      color: 'text-red-500',
    },
    {
      title: '任务类型',
      description: '管理任务类型标签',
      icon: Settings,
      href: '/admin/task-types',
      color: 'text-gray-500',
    },
  ];

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">管理后台</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">用户总数</p>
                  <p className="text-3xl font-bold">{stats.users}</p>
                </div>
                <Users className="h-10 w-10 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">任务总数</p>
                  <p className="text-3xl font-bold">{stats.tasks}</p>
                </div>
                <FileText className="h-10 w-10 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">待审核报名</p>
                  <p className="text-3xl font-bold text-yellow-500">
                    {stats.pendingRegistrations}
                  </p>
                </div>
                <Clock className="h-10 w-10 text-yellow-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm text-muted-foreground">待审核提交</p>
                  <p className="text-3xl font-bold text-purple-500">
                    {stats.pendingSubmissions}
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-purple-500" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-8 w-8 ${item.color}`} />
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
