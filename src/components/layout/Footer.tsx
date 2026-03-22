export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © 2026 实践课程任务智能管理与评价系统. 基于标签推荐算法.
        </p>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>技术支持：Next.js + Supabase</span>
        </div>
      </div>
    </footer>
  );
}
