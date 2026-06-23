# 图标映射（Material Symbols Outlined → lucide-react）

落地 `DEC-012` / `UI-002` / `FRONTEND_SPEC §5`：全站单一图标族。

- **规范参照**：Material Symbols Outlined（设计/文档用规范名）。
- **实现**：`lucide-react`（shadcn 默认）作 1:1 等价替换。
- **入口**：组件 props 传「规范名」（Material 名）→ `src/lib/icon-map.ts` 的 `ICON_MAP` 映射到 lucide 组件 → `<Icon name="...">` 渲染。
- **禁止**：第二图标族 / filled 变体 / emoji。
- **唯一例外**：GitHub Octocat（`src/components/shared/octocat.tsx`），仅用于身份/登录。

> 本表为人类可读文档，须与 `src/lib/icon-map.ts` 的 `ICON_MAP` 保持同步。新增图标两处一起改。

| Material 名 | lucide 组件 | 典型用途 |
| --- | --- | --- |
| `search` | `Search` | 全局搜索 |
| `verified` | `BadgeCheck` | GitHub Verified / 徽章 |
| `check_circle` | `CheckCircle2` | 完成 / 通过 |
| `swap_horiz` | `ArrowLeftRight` | 交换 |
| `hourglass_empty` | `Hourglass` | 等待 / 已请求 |
| `notifications` | `Bell` | 通知 |
| `shield` | `Shield` | 信任（中） |
| `verified_user` | `ShieldCheck` | 信任（高） |
| `gpp_maybe` | `ShieldAlert` | 信任（低） |
| `warning` | `AlertTriangle` | 警告（隐私门 warn） |
| `error` | `AlertCircle` | 错误 / 阻止（隐私门 block） |
| `info` | `Info` | 信息 / 解释入口 / 图标兜底 |
| `star` | `Star` | 星标 |
| `group` | `Users` | 用户数 |
| `inventory_2` | `Boxes` | 模块数 |
| `trending_up` | `TrendingUp` | 趋势上升 |
| `trending_down` | `TrendingDown` | 趋势下降 |
| `trending_flat` | `Minus` | 趋势持平 |
| `chevron_right` | `ChevronRight` | 下一页 / 展开 |
| `chevron_left` | `ChevronLeft` | 上一页 |
| `expand_more` | `ChevronDown` | 展开 / 降序 |
| `expand_less` | `ChevronUp` | 收起 / 升序 |
| `content_copy` | `Copy` | 复制 |
| `check` | `Check` | 勾选 / 已复制 |
| `close` | `X` | 关闭 / 移除 / 终止 |
| `add` | `Plus` | 新建 / 提交 |
| `settings` | `Settings` | 设置 |
| `person` | `User` | 个人中心 / 新用户 |
| `logout` | `LogOut` | 退出 |
| `open_in_new` | `ExternalLink` | 外链 |
| `lock` | `Lock` | 私密 / 锁定 |
| `lock_open` | `Unlock` | 解锁 |
| `visibility` | `Eye` | 公开 |
| `visibility_off` | `EyeOff` | 隐藏 |
| `description` | `FileText` | 清单 / 文档 |
| `folder` | `Folder` | 文件夹 |
| `inbox` | `Inbox` | 收件箱 / 空状态 |
| `forum` | `MessageSquare` | 反馈 / 讨论 |
| `thumb_up` | `ThumbsUp` | 认可 |
| `flag` | `Flag` | 举报 / 标记 |
| `fact_check` | `ClipboardList` | 审核 / 审核中 |
| `monitoring` | `Activity` | 统计 / 活动 |
| `label` | `Tag` | 主题标签 |
| `code` | `Code2` | 代码 / API |
| `auto_awesome` | `Sparkles` | Agent 技能 |
| `delete` | `Trash2` | 删除 |
| `edit` | `Pencil` | 编辑 |
| `send` | `Send` | 交付 / 提交 |
| `schedule` | `Clock` | 时间 / 准备中 |
| `favorite` | `Heart` | 收藏 |
| `priority_high` | `AlertOctagon` | 高风险标记 |
| `smart_toy` | `Bot` | 系统 / 自动化主体 |
| `search_off` | `SearchX` | 搜索无结果 / 未找到 |
| `refresh` | `RefreshCw` | 重试 / 刷新 |
| `gavel` | `Gavel` | 裁决 / 处置 |
| `undo` | `Undo2` | 撤销 |
| `block` | `Ban` | 阻断 / 拒绝 |
| `done_all` | `CheckCheck` | 全部完成 / 批量通过 |
| `task_alt` | `CircleCheckBig` | 任务完成 / 通过 |
| `history` | `History` | 历史 / 审计记录 |
| `tune` | `SlidersHorizontal` | 筛选 / 调节 |
| `north_east` | `ArrowUpRight` | 发起（出向交换） |
| `south_west` | `ArrowDownLeft` | 收到（入向交换） |
| `rate_review` | `MessageSquareText` | 评审 / 反馈 |
