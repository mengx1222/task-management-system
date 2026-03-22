'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Settings, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface TaskType {
  id: number;
  task_type: string;
  created_at: string;
}

export default function AdminTaskTypesPage() {
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  useEffect(() => {
    fetchTaskTypes();
  }, []);

  const fetchTaskTypes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/task-types');
      const data = await res.json();

      if (data.success) {
        setTaskTypes(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch task types:', error);
      toast.error('获取任务类型失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) {
      toast.error('请输入类型名称');
      return;
    }

    try {
      const res = await fetch('/api/admin/task-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ typeName: newTypeName }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '创建失败');
        return;
      }

      toast.success('任务类型创建成功');
      setDialogOpen(false);
      setNewTypeName('');
      fetchTaskTypes();
    } catch (error) {
      console.error('Create task type error:', error);
      toast.error('创建失败');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">任务类型管理</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>任务类型列表</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  添加类型
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加任务类型</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label>类型名称</Label>
                  <Input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="例如：软件开发、数据分析、文档编写"
                    className="mt-2"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateType}>创建</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>类型名称</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>{type.id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{type.task_type}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(type.created_at)}</TableCell>
                  </TableRow>
                ))}
                {taskTypes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      暂无任务类型
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
