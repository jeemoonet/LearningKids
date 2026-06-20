# DOC-DEV-001 技术方案

## 1. 技术栈

| 层级 | 选型 | 版本 |
|------|------|------|
| 框架 | React | 19 |
| 语言 | TypeScript | 6 |
| 构建 | Vite | 8 |
| 数学计算 | mathjs | 15 |
| 代码检查 | ESLint | 10 |

## 2. 目录结构

```text
src/
├── index.html      # Vite 入口
├── public/         # 静态资源（favicon 等）
├── app/            # 应用级类型定义
├── components/     # 通用 UI 组件
├── hooks/          # 自定义 Hooks
├── lib/            # 纯逻辑（表达式解析、图像计算、题库生成）
├── modules/        # 功能模块
│   ├── graph/      # 函数图像
│   └── sign-training/  # 正负训练营
├── pages/          # 页面级组件
├── App.tsx         # 根组件与路由切换
├── constants.ts    # 全局常量
└── main.tsx        # 入口
```

根目录仅保留构建配置（`vite.config.ts`、`tsconfig.*`、`eslint.config.js`）与项目元数据。

## 3. 模块设计

### 3.1 函数图像（`modules/graph`）

- `GraphModule`：模块容器，管理函数输入列表与画布
- `lib/graph.ts`：坐标变换、采样、渐近线处理
- `lib/expression.ts`：表达式解析（一次/二次/反比例）
- `lib/quizGenerator.ts`：测验题自动生成

### 3.2 正负训练营（`modules/sign-training`）

- `SignTrainingModule`：模块容器，切换练习/测试模式
- `signGenerator.ts` / `advancedSignGenerator.ts`：题目生成
- `SignCard`：闪卡 UI
- `SignTestMode`：限时测试

## 4. 状态管理

当前采用 React `useState` 本地状态，无全局状态库。视图切换通过 `AppView` 类型在 `App.tsx` 中管理。

## 5. 构建与输出

- 开发：`npm run dev`（Vite HMR）
- 生产：`npm run build` → `dist/` 静态文件
- 预览：`npm run preview`
