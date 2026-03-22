'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Settings,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentUser {
  id: number;
  student_number: string;
  student_name: string;
  student_gender: string;
  contact_number: string;
  mission_recommendation: string;
}

interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  userGroup: string;
  studentUser?: StudentUser;
}

interface Registration {
  id: number;
  enrollment_number: string;
  task_number: string;
  course_name: string;
  task_type: string;
  registration_date: string;
  examine_state: string;
  task_progress: string;
}

interface SubmitTask {
  id: number;
  enrollment_number: string;
  task_number: string;
  course_name: string;
  date_of_submission: string;
  examine_state: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [submissions, setSubmissions] = useState<SubmitTask[]>([]);
  const [missionTags, setMissionTags] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!data.user) {
        router.push('/login');
        return;
      }

      setUser(data.user);
      setMissionTags(data.user.studentUser?.missionRecommendation || '');

      // 获取用户的报名记录
      if (data.user.userGroup === 'student') {
        fetchRegistrations(data.user.id);
        fetchSubmissions(data.user.id);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (userId: number) => {
    try {
      const res = await fetch('/api/my-registrations');
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    }
  };

  const fetchSubmissions = async (userId: number) => {
    try {
      const res = await fetch('/api/my-submissions');
      const data = await res.json();
      if (data.success) {
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleSaveTags = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionRecommendation: missionTags }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '保存失败');
        return;
      }

      toast.success('标签保存成功');
      fetchUser();
    } catch (error) {
      console.error('Save tags error:', error);
      toast.error('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case '已通过':
        return <Badge className="bg-green-500">{state}</Badge>;
      case '待审核':
        return <Badge variant="secondary">{state}</Badge>;
      case '未通过':
        return <Badge variant="destructive">{state}</Badge>;
      default:
        return <Badge variant="outline">{state}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-8">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">个人中心</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user.nickname?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="text-center mb-4">
                <p className="text-lg font-semibold">{user.nickname}</p>
                <Badge variant="outline">
                  {user.userGroup === 'admin' ? '管理员' :
                   user.userGroup === 'team_leader' ? '组长' : '学生'}
                </Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">用户名</span>
                  <span>{user.username}</span>
                </div>
                {user.studentUser && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">学号</span>
                      <span>{user.studentUser.student_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">姓名</span>
                      <span>{user.studentUser.student_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">性别</span>
                      <span>{user.studentUser.student_gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">联系电话</span>
                      <span>{user.studentUser.contact_number || '-'}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="tags" className="space-y-6">
            <TabsList>
              <TabsTrigger value="tags">
                <Settings className="h-4 w-4 mr-2" />
                推荐设置
              </TabsTrigger>
              <TabsTrigger value="registrations">
                <FileText className="h-4 w-4 mr-2" />
                我的报名
              </TabsTrigger>
              <TabsTrigger value="submissions">
                <CheckCircle className="h-4 w-4 mr-2" />
                我的提交
              </TabsTrigger>
            </TabsList>

            {/* Tags Settings */}
            <TabsContent value="tags">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">任务推荐标签</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      设置您感兴趣的标签，系统将根据标签为您推荐匹配的任务。
                      多个标签请用英文逗号分隔。
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label>推荐标签</Label>
                    <Textarea
                      placeholder="例如：Python开发, Web开发, 数据分析, 机器学习"
                      value={missionTags}
                      onChange={(e) => setMissionTags(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveTags} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? '保存中...' : '保存设置'}
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/tasks?recommend=true')}>
                      查看推荐任务
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Registrations */}
            <TabsContent value="registrations">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">我的报名记录</CardTitle>
                </CardHeader>
                <CardContent>
                  {registrations.length > 0 ? (
                    <div className="space-y-4">
                      {registrations.map((reg) => (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{reg.course_name}</p>
                            <p className="text-sm text-muted-foreground">
                              任务编号：{reg.task_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              报名时间：{formatDate(reg.registration_date)}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStateBadge(reg.examine_state)}
                            <p className="text-sm text-muted-foreground mt-1">
                              进度：{reg.task_progress}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      暂无报名记录
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Submissions */}
            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">我的提交记录</CardTitle>
                </CardHeader>
                <CardContent>
                  {submissions.length > 0 ? (
                    <div className="space-y-4">
                      {submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{sub.course_name}</p>
                            <p className="text-sm text-muted-foreground">
                              任务编号：{sub.task_number}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              提交时间：{formatDate(sub.date_of_submission)}
                            </p>
                          </div>
                          <div className="text-right">
                            {getStateBadge(sub.examine_state)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      暂无提交记录
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
