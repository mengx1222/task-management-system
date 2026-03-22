# 实践课程任务智能管理与评价系统

基于标签推荐算法的实践课程任务智能管理与评价系统，实现任务智能分发、过程跟踪与多维评价功能。

## 项目简介

本系统是一个面向高校实践课程的任务管理平台，支持管理员、学生、组长三种角色，提供基于标签的任务推荐算法，帮助学生快速找到适合的任务。

### 主要功能

- **用户管理**：支持管理员、学生、组长三种角色，实现精细化权限控制
- **任务管理**：任务的发布、编辑、删除、查询，支持多条件筛选
- **智能推荐**：基于标签匹配的任务推荐算法，支持精准匹配与补全策略
- **报名管理**：学生报名任务、组长审核报名
- **提交评价**：任务提交、多维度评价（完成度、创新性、规范性等）
- **数据统计**：任务统计、用户统计、评价分析

### 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Next.js | 16.1.1 | 全栈框架 (App Router) |
| React | 19 | 前端UI库 |
| TypeScript | 5.x | 类型安全 |
| Supabase | - | PostgreSQL 数据库 |
| shadcn/ui | - | UI组件库 (Radix UI) |
| Tailwind CSS | 4.x | 样式框架 |

## 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 接口
│   │   ├── auth/                 # 认证相关
│   │   │   ├── login/            # 登录
│   │   │   ├── register/         # 注册
│   │   │   ├── logout/           # 登出
│   │   │   └── me/               # 当前用户
│   │   ├── tasks/                # 任务相关
│   │   │   ├── [id]/             # 任务详情/报名/提交
│   │   │   └── route.ts          # 任务列表
│   │   ├── admin/                # 管理员接口
│   │   ├── my-registrations/     # 我的报名
│   │   └── my-submissions/       # 我的提交
│   ├── admin/                    # 管理后台页面
│   ├── profile/                  # 个人中心页面
│   ├── tasks/                    # 任务中心页面
│   └── page.tsx                  # 首页
├── components/                   # React 组件
│   └── ui/                       # shadcn/ui 基础组件
├── lib/                          # 工具库
│   ├── auth.ts                   # 认证与授权
│   ├── recommendation.ts         # 推荐算法
│   └── supabase.ts               # 数据库客户端
└── storage/                      # 数据存储
    └── database/                 # 数据库 Schema
```

## 数据库设计

### 核心数据表

| 表名 | 说明 |
|------|------|
| users | 用户基础信息表 |
| student_users | 学生详细信息表 |
| team_leader_users | 组长详细信息表 |
| tasks | 任务表 |
| task_types | 任务类型表 |
| task_tags | 任务标签表 |
| registrations | 报名记录表 |
| submissions | 提交记录表 |
| evaluations | 评价记录表 |

### ER 关系

```
users (1) <---> (1) student_users
users (1) <---> (1) team_leader_users
tasks (N) <---> (1) task_types
tasks (N) <---> (N) tags (via task_tags)
registrations (N) <---> (1) users
registrations (N) <---> (1) tasks
submissions (N) <---> (1) registrations
evaluations (N) <---> (1) submissions
```

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 9+

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env.local` 文件：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 初始化数据库

```bash
# 运行数据库初始化脚本
pnpm run seed
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5000 查看应用。

## 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 系统管理员，拥有所有权限 |
| 学生 | student1 | student123 | 普通学生账号 |
| 组长 | leader1 | leader123 | 组长账号，可审核报名 |

## API 接口

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/logout | 用户登出 |
| GET | /api/auth/me | 获取当前用户信息 |

### 任务接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 获取任务列表 |
| GET | /api/tasks/:id | 获取任务详情 |
| POST | /api/tasks/:id/register | 报名任务 |
| POST | /api/tasks/:id/submit | 提交任务 |

### 管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/users | 获取用户列表 |
| GET | /api/admin/registrations | 获取报名列表 |
| GET | /api/admin/submissions | 获取提交列表 |
| GET | /api/admin/evaluations | 获取评价列表 |

## 推荐算法

系统实现了基于标签匹配的任务推荐算法：

1. **标签匹配**：根据用户兴趣标签与任务标签的交集进行匹配
2. **精准推荐**：优先推荐标签完全匹配的任务
3. **补全策略**：当精准匹配不足时，推荐相关标签的任务
4. **热度排序**：结合任务点击量、点赞数、收藏数进行综合排序

```typescript
// 推荐算法核心逻辑
export function calculateRecommendationScore(
  task: Task,
  userTags: string[]
): number {
  const taskTags = task.tags || [];
  const matchCount = taskTags.filter(t => userTags.includes(t)).length;
  const matchRatio = matchCount / Math.max(taskTags.length, 1);
  
  // 综合热度因子
  const hotScore = task.hits * 0.3 + task.praiseLen * 0.5 + task.collectLen * 0.2;
  
  return matchRatio * 70 + Math.min(hotScore / 100, 30);
}
```

## 部署

### 构建生产版本

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 5000
CMD ["pnpm", "start"]
```

## 开发规范

### 代码风格

- 使用 TypeScript 进行类型安全开发
- 使用 `@/` 路径别名导入模块
- 优先使用 shadcn/ui 组件
- 遵循 Next.js App Router 规范

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**GitHub**: https://github.com/mengx1222/task-management-system
