'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  FileText,
  Users,
  Brain,
  BarChart3,
  ArrowRight,
  Calendar,
  Tag,
} from 'lucide-react';

interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

interface Task {
  id: number;
  task_number: string;
  task_name: string;
  course_name: string;
  task_type: string;
  task_description: string;
  deadline: string;
  task_status: string;
  hits: number;
}

export default function HomePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [recommendedTasks, setRecommendedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [noticesRes, tasksRes] = await Promise.all([
        fetch('/api/notices?pageSize=5'),
        fetch('/api/tasks?type=individual&recommend=true&pageSize=6'),
      ]);

      const noticesData = await noticesRes.json();
      const tasksData = await tasksRes.json();

      if (noticesData.success) {
        setNotices(noticesData.data || []);
      }
      if (tasksData.success) {
        setRecommendedTasks(tasksData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const features = [
    {
      icon: Brain,
      title: '智能推荐',
      description: '基于标签推荐算法，精准匹配学生兴趣与任务需求',
    },
    {
      icon: FileText,
      title: '任务管理',
      description: '支持个人任务与团队任务的全生命周期管理',
    },
    {
      icon: Users,
      title: '团队协作',
      description: '组长管理团队，分配任务，跟踪进度',
    },
    {
      icon: BarChart3,
      title: '多维评价',
      description: '过程性评价与结果评价相结合，全面评估学习效果',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container">
          <div className="flex flex-col items-center text-center space-y-6">
            <Badge variant="outline" className="px-4 py-1">
              基于标签推荐算法
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              实践课程任务智能管理与评价系统
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              为高校实践课程提供任务智能分发、过程跟踪与多维评价的一体化解决方案
            </p>
            <div className="flex gap-4 mt-4">
              <Button size="lg" asChild>
                <Link href="/tasks">
                  浏览任务 <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/register">立即注册</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center">
                  <CardHeader>
                    <div className="mx-auto p-3 bg-primary/10 rounded-full w-fit mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Notices Section */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">通知公告</h2>
            <Link href="/notices" className="text-primary hover:underline text-sm">
              查看全部
            </Link>
          </div>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((notice) => (
                <Card key={notice.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">公告</Badge>
                      <span className="font-medium">{notice.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(notice.created_at)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无通知公告
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Recommended Tasks Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">推荐任务</h2>
            <Link href="/tasks?recommend=true" className="text-primary hover:underline text-sm">
              查看全部
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : recommendedTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge>{task.task_type || '未分类'}</Badge>
                      <span className="text-xs text-muted-foreground">
                        浏览 {task.hits}
                      </span>
                    </div>
                    <CardTitle className="text-lg line-clamp-1">{task.task_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {task.task_description || '暂无描述'}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>截止：{formatDate(task.deadline)}</span>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/tasks/${task.id}?type=individual`}>
                          查看详情
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无推荐任务，请先登录并设置您的兴趣标签
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="py-12 text-center">
              <h2 className="text-3xl font-bold mb-4">开始您的实践课程之旅</h2>
              <p className="text-lg opacity-90 mb-8">
                注册账号，设置您的兴趣标签，系统将为您推荐最合适的实践任务
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">立即注册</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
