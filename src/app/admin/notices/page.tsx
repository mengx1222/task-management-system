'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bell, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Notice {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notices?pageSize=50');
      const data = await res.json();

      if (data.success) {
        setNotices(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notices:', error);
      toast.error('获取通知公告失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotice = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入标题');
      return;
    }

    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '创建失败');
        return;
      }

      toast.success('通知公告发布成功');
      setDialogOpen(false);
      setFormData({ title: '', content: '' });
      fetchNotices();
    } catch (error) {
      console.error('Create notice error:', error);
      toast.error('创建失败');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-8">
        <Bell className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">通知公告管理</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>通知公告列表</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  发布通知
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>发布通知公告</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>标题</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="请输入通知标题"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>内容</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="请输入通知内容"
                      rows={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleCreateNotice}>发布</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">ID</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>内容预览</TableHead>
                  <TableHead>发布时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((notice) => (
                  <TableRow key={notice.id}>
                    <TableCell>{notice.id}</TableCell>
                    <TableCell className="font-medium">{notice.title}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {notice.content || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(notice.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
                {notices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      暂无通知公告
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
