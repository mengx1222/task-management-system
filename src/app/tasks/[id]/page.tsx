'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  Eye,
  FileText,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: number;
  task_number: string;
  task_name: string;
  course_name: string;
  task_type: string;
  task_description: string;
  task_attachments: string;
  cover_chart: string;
  deadline: string;
  task_status: string;
  hits: number;
  praise_len: number;
  collect_len: number;
  created_at: string;
}

interface User {
  id: number;
  username: string;
  nickname: string;
  userGroup: string;
}

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [task, setTask] = useState<Task | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registrationRemarks, setRegistrationRemarks] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const taskType = searchParams.get('type') || 'individual';

  useEffect(() => {
    fetchUser();
    fetchTask();
  }, [resolvedParams.id]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchTask = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${resolvedParams.id}?type=${taskType}`);
      const data = await res.json();

      if (data.success) {
        setTask(data.data);
      } else {
        toast.error('任务不存在');
        router.push('/tasks');
      }
    } catch (error) {
      console.error('Failed to fetch task:', error);
      toast.error('获取任务详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('请先登录');
      router.push('/login');
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch(`/api/tasks/${resolvedParams.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: taskType,
          registrationRemarks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '报名失败');
        return;
      }

      toast.success('报名成功，等待审核');
      setDialogOpen(false);
      setRegistrationRemarks('');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('报名失败，请稍后重试');
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const isExpired = task?.deadline && new Date(task.deadline) < new Date();

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container py-8 text-center">
        <p className="text-muted-foreground">任务不存在</p>
        <Button className="mt-4" asChild>
          <Link href="/tasks">返回任务列表</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/tasks">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回任务列表
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{task.task_type || '未分类'}</Badge>
                  <Badge variant={task.task_status === '未完成' ? 'default' : 'secondary'}>
                    {task.task_status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {task.hits}
                  </span>
                </div>
              </div>
              <CardTitle className="text-2xl">{task.task_name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Task Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>课程：{task.course_name || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>截止：{formatDate(task.deadline)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>类型：{taskType === 'individual' ? '个人任务' : '团队任务'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>发布：{formatDate(task.created_at)}</span>
                </div>
              </div>

              {/* Deadline Warning */}
              {isExpired && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    该任务已截止，无法报名
                  </AlertDescription>
                </Alert>
              )}

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">任务描述</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {task.task_description || '暂无描述'}
                </p>
              </div>

              {/* Attachments */}
              {task.task_attachments && (
                <div>
                  <h3 className="font-semibold mb-2">任务附件</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">{task.task_attachments}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={isExpired || task.task_status !== '未完成'}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      报名任务
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>确认报名</DialogTitle>
                      <DialogDescription>
                        您即将报名「{task.task_name}」，请在下方填写报名备注
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>报名备注</Label>
                        <Textarea
                          placeholder="请简要说明您的相关经验或技能..."
                          value={registrationRemarks}
                          onChange={(e) => setRegistrationRemarks(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        取消
                      </Button>
                      <Button onClick={handleRegister} disabled={registering}>
                        {registering ? '报名中...' : '确认报名'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button className="w-full" asChild>
                  <Link href="/login">登录后报名</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">任务信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">任务编号</span>
                <span className="font-mono">{task.task_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">任务状态</span>
                <Badge variant="secondary">{task.task_status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">截止日期</span>
                <span>{formatDate(task.deadline)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
