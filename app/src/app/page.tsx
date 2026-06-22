/*
  Task Zero 占位首页：仅验证设计令牌工具类编译与渲染。
  真实「发现/注册表」页（PAGE-002）在阶段 11 实现，替换本占位。
*/
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-card border border-border bg-surface p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-primary text-lg font-bold text-white">
            K
          </span>
          <span className="text-xl font-semibold text-primary">Know-share</span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-text">工程骨架就绪</h1>
        <p className="mt-2 text-sm text-text-muted">
          隐私优先的个人 agent 知识模块交换与撮合平台。Task Zero 绿色基线 ——
          业务界面将在阶段 11 按页面/组件规格逐模块实现。
        </p>
        <div className="mt-6 flex gap-3">
          <button className="rounded-control bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover">
            提交模块
          </button>
          <button className="rounded-control border border-border px-4 py-2 text-sm font-medium text-text">
            发现注册表
          </button>
        </div>
      </div>
    </main>
  );
}
