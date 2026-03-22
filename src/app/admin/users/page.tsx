'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Label } from '@/components/ui/label';
import { Search, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  phone: string;
  user_group: string;
  state: number;
  created_at: string;
  studentUser?: {
    student_number: string;
    student_name: string;
  };
  teamLeaderUser?: {
    team_leader_student_number: string;
    name_of_team_leader: string;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [userGroup, setUserGroup] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nickname: '',
    userGroup: 'student',
    studentNumber: '',
    studentName: '',
    contactNumber: '',
  });

  useEffect(() => {
    fetchUsers();
  }, [page, userGroup]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (userGroup) params.set('userGroup', userGroup);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleCreateUser = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '创建失败');
        return;
      }

      toast.success('用户创建成功');
      setDialogOpen(false);
      setFormData({
        username: '',
        password: '',
        nickname: '',
        userGroup: 'student',
        studentNumber: '',
        studentName: '',
        contactNumber: '',
      });
      fetchUsers();
    } catch (error) {
      console.error('Create user error:', error);
      toast.error('创建失败');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">管理员</Badge>;
      case 'team_leader':
        return <Badge className="bg-blue-500">组长</Badge>;
      default:
        return <Badge variant="secondary">学生</Badge>;
    }
  };

  const getStateBadge = (state: number) => {
    return state === 1 ? (
      <Badge className="bg-green-500">正常</Badge>
    ) : (
      <Badge variant="destructive">禁用</Badge>
    );
  };

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-8">
        <Users className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">用户管理</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>用户列表</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={userGroup} onValueChange={setUserGroup}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="用户类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value="student">学生</SelectItem>
                  <SelectItem value="team_leader">组长</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  placeholder="搜索用户..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-[200px]"
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    添加用户
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加用户</DialogTitle>
                    <DialogDescription>
                      创建新的用户账号
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>用户名 *</Label>
                        <Input
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>密码 *</Label>
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>昵称</Label>
                        <Input
                          value={formData.nickname}
                          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>身份类型</Label>
                        <Select
                          value={formData.userGroup}
                          onValueChange={(v) => setFormData({ ...formData, userGroup: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">学生</SelectItem>
                            <SelectItem value="team_leader">组长</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>学号</Label>
                        <Input
                          value={formData.studentNumber}
                          onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>姓名</Label>
                        <Input
                          value={formData.studentName}
                          onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>联系电话</Label>
                      <Input
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleCreateUser}>创建</Button>
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
                    <TableHead>ID</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>昵称/姓名</TableHead>
                    <TableHead>学号</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>注册时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        {user.nickname || user.studentUser?.student_name || user.teamLeaderUser?.name_of_team_leader || '-'}
                      </TableCell>
                      <TableCell>
                        {user.studentUser?.student_number || user.teamLeaderUser?.team_leader_student_number || '-'}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.user_group)}</TableCell>
                      <TableCell>{getStateBadge(user.state)}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
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
