'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Search, Edit, Trash2 } from 'lucide-react';
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

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [taskMode, setTaskMode] = useState<'individual' | 'team'>('individual');
  const [dialogOpen, setDialogOpen] = useState(false);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    taskNumber: '',
    taskName: '',
    courseName: '',
    taskType: '',
    taskDescription: '',
    deadline: '',
    numberOfPeopleRequired: 1,
  });

  useEffect(() => {
    fetchTaskTypes();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [taskMode, page]);

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

  const handleCreateTask = async () => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, type: taskMode }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '创建失败');
        return;
      }

      toast.success('任务创建成功');
      setDialogOpen(false);
      setFormData({
        taskNumber: '',
        taskName: '',
        courseName: '',
        taskType: '',
        taskDescription: '',
        deadline: '',
        numberOfPeopleRequired: 1,
      });
      fetchTasks();
    } catch (error) {
      console.error('Create task error:', error);
      toast.error('创建失败');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm('确定要删除此任务吗？')) return;

    try {
      const res = await fetch(`/api/tasks/${id}?type=${taskMode}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '删除失败');
        return;
      }

      toast.success('任务已删除');
      fetchTasks();
    } catch (error) {
      console.error('Delete task error:', error);
      toast.error('删除失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-8">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">任务管理</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>任务列表</CardTitle>
            <div className="flex items-center gap-4">
              <Tabs value={taskMode} onValueChange={(v) => setTaskMode(v as 'individual' | 'team')}>
                <TabsList>
                  <TabsTrigger value="individual">个人任务</TabsTrigger>
                  <TabsTrigger value="team">团队任务</TabsTrigger>
                </TabsList>
              </Tabs>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    添加任务
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      添加{taskMode === 'individual' ? '个人' : '团队'}任务
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>任务编号 *</Label>
                        <Input
                          value={formData.taskNumber}
                          onChange={(e) => setFormData({ ...formData, taskNumber: e.target.value })}
                          placeholder="例如：T2026001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>任务名称 *</Label>
                        <Input
                          value={formData.taskName}
                          onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>课程名称</Label>
                        <Input
                          value={formData.courseName}
                          onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>任务类型</Label>
                        <Select
                          value={formData.taskType}
                          onValueChange={(v) => setFormData({ ...formData, taskType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择类型" />
                          </SelectTrigger>
                          <SelectContent>
                            {taskTypes.map((type) => (
                              <SelectItem key={type.id} value={type.task_type}>
                                {type.task_type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>截止日期</Label>
                        <Input
                          type="date"
                          value={formData.deadline}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        />
                      </div>
                      {taskMode === 'team' && (
                        <div className="space-y-2">
                          <Label>所需人数</Label>
                          <Input
                            type="number"
                            value={formData.numberOfPeopleRequired}
                            onChange={(e) => setFormData({ ...formData, numberOfPeopleRequired: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>任务描述</Label>
                      <Textarea
                        value={formData.taskDescription}
                        onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreateTask}>创建</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>编号</TableHead>
                    <TableHead>名称</TableHead>
                    <TableHead>课程</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>截止日期</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>浏览</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono text-sm">{task.task_number}</TableCell>
                      <TableCell>{task.task_name}</TableCell>
                      <TableCell>{task.course_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{task.task_type || '未分类'}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(task.deadline)}</TableCell>
                      <TableCell>
                        <Badge variant={task.task_status === '未完成' ? 'default' : 'secondary'}>
                          {task.task_status}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.hits}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
