# 🧪 Workflow Task Suite – Test Case Matrix

本文件列出 **全部单元 / 组件测试用例**，覆盖公共 Store、Hook、组件的核心行为。  
所有测试均针对特定功能点，不做冗余验证。

---

## 1. Hook Tests

| 编号 | Hook | 用例标题 | 核心断言 |
|-----|------|---------|---------|
| **H1** | `useWorkflowTaskCreate` | 成功创建后写入 store | 1. `isCreating` 先 `true` 再 `false`<br>2. `store.tasks` 含新 `task_id` & `status === 'running'` |
| **H2** | `useWorkflowTaskCreate` | 后端报错时返回 error 且不写 store | 1. `error` 捕获<br>2. `store.tasks` 数量不变 |
| **H3** | `useWorkflowTaskList` | 初始渲染读取持久化任务 | 预置 `localStorage` 两条任务 → 返回数组长度为 2 |
| **H4** | `useWorkflowTaskList` | 自动为运行中任务启动流 | 插入 `running` 任务 → `streamingManager.subscribe` 被调用一次 |
| **H5** | `useWorkflowTaskList` | `clearCompleted` 仅移除 complete/error | 三状态任务集合 → 调用后仅剩 `running` |
| **H6** | `useWorkflowTask` | 挂载即订阅事件且累积 events | 模拟两条事件 → `events.length === 2` |
| **H7** | `useWorkflowTask` | `clearEvents` 将 events 清空 | 追加事件后 `clearEvents` → `events.length === 0` |
| **H8** | `useWorkflowTask` | `stopStreaming` 结束流并更新 isStreaming | 调用后 `streamingManager.isStreamActive` 为 `false` |
| **H9** | `useWorkflowProgress` | 正确计算 current / total / status | 2 complete + 1 running → `{current:2,total:3,status:'running'}` |

---

## 2. Store Tests (`taskStore`)

| 编号 | 用例标题 | 核心断言 |
|-----|---------|---------|
| **S1** | `setTask` 插入 & 覆盖 | 覆盖同 `task_id` 后 `status` 更新 |
| **S2** | `appendEvent` 追加而不覆盖 | 连续两次追加 → 事件数组长度为 2 |
| **S3** | `clearCompleted` 过滤状态 | 仅保留非 `complete/error` 任务 |
| **S4** | `persist` 读写 localStorage | 重建 store 后任务数据保持一致 |

---

## 3. Component Tests

| 编号 | 组件 | 用例标题 | 核心断言 |
|-----|------|---------|---------|
| **C1** | `WorkflowTaskList` | 正确渲染任务行 & Clear Completed 按钮生效 | 初始行数 3 → 点击按钮后行数 2 |
| **C2** | `WorkflowTaskDetail` | 自动开始流并展示事件 | 3 条事件渲染于 DOM |
| **C3** | `WorkflowProgressBar` | 百分比与图标随状态变化 | 依次验证 running / complete / error 下：<br>• 进度比例<br>• 对应图标 |
| **C4** | `WorkflowTrigger` | 点击触发 createTask 且按钮禁用状态切换 | `createTask` 被调用；创建期间按钮 `disabled` |

---

### 覆盖摘要
- **Hook 行为**：H1–H9 **100% 覆盖**  
- **Store API**：S1–S4 **完全验证**  
- **组件交互**：C1–C4 **涵盖核心 UI 功能**

> 视觉风格、布局等细节可通过 Storybook 或快照测试补充，不在本表范围。