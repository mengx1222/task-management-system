'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Calendar, Eye, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

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
  created_at: string;
}

interface TaskType {
  id: number;
  task_type: string;
}

function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [taskMode, setTaskMode] = useState<'individual' | 'team'>('individual');
  const [selectedType, setSelectedType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecommend, setIsRecommend] = useState(false);

  useEffect(() => {
    const recommend = searchParams.get('recommend');
    setIsRecommend(recommend === 'true');
  }, [searchParams]);

  useEffect(() => {
    fetchTaskTypes();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [taskMode, selectedType, page, isRecommend]);

  const fetchTaskTypes = async () => {
    try {
      const res = await fetch('/api/admin/task-types');
      const data = await res.json();
      if (data.success) {
        setTaskTypes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch task types:', error);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: taskMode,
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (isRecommend) {
        params.set('recommend', 'true');
      } else {
        if (selectedType) params.set('taskType', selectedType);
        if (searchQuery) params.set('search', searchQuery);
      }

      const res = await fetch(`/api/tasks?${params}`);
      const data = await res.json();

      if (data.success) {
        setTasks(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchTasks();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">任务中心</h1>
          <p className="text-muted-foreground">
            {isRecommend ? '根据您的兴趣标签为您推荐的任务' : '浏览所有可报名的实践任务'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isRecommend ? 'default' : 'outline'}
            onClick={() => setIsRecommend(!isRecommend)}
          >
            智能推荐
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Tabs value={taskMode} onValueChange={(v) => setTaskMode(v as 'individual' | 'team')}>
          <TabsList>
            <TabsTrigger value="individual">个人任务</TabsTrigger>
            <TabsTrigger value="team">团队任务</TabsTrigger>
          </TabsList>
        </Tabs>

        {!isRecommend && (
          <>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="任务类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">全部类型</SelectItem>
                {taskTypes.map((type) => (
                  <SelectItem key={type.id} value={type.task_type}>
                    {type.task_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 flex-1 max-w-md">
              <Input
                placeholder="搜索任务名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Tasks Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{task.task_type || '未分类'}</Badge>
                  <Badge variant={task.task_status === '未完成' ? 'default' : 'secondary'}>
                    {task.task_status}
                  </Badge>
                </div>
                <CardTitle className="text-lg line-clamp-1">{task.task_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {task.task_description || '暂无描述'}
                </p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>截止日期：{formatDate(task.deadline)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>浏览量：{task.hits}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button size="sm" asChild>
                    <Link href={`/tasks/${task.id}?type=${taskMode}`}>
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
          <CardContent className="py-12 text-center text-muted-foreground">
            {isRecommend
              ? '暂无推荐任务，请在个人中心设置您的兴趣标签'
              : '暂无任务'}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            上一页
          </Button>
          <span className="flex items-center px-4">
            第 {page} / {totalPages} 页
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}

function TasksLoading() {
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <Skeleton className="h-9 w-32 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 flex-1 max-w-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<TasksLoading />}>
      <TasksContent />
    </Suspense>
  );
}
