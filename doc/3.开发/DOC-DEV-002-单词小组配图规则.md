# DOC-DEV-002 主题学习卡片配图规则

> **术语**：见 [DOC-PROD-002 术语表](../2.产品设计/DOC-PROD-002-术语表.md)。本文「学习卡片」= 主题级场景配图；「示意图」= 卡片内各单词的标签与指向物体。  
> 提示词构建：`server/src/lib/groupCoverPrompt.ts`（`buildGroupCoverPrompt()`）  
> 前端展示：`src/modules/vocab-training/groupCover.ts`  
> 出图方式：**Cursor Skills（GenerateImage）**（推荐）· 提示词脚本：`scripts/build-group-cover-prompt.mjs` · 备选 Gemini：`scripts/generate-group-cover-gemini.mjs`

## 1. 目的

为每个**主题**生成一张**学习卡片**（场景配图），把主题内 5～6 个**单词**串进同一幅画面，帮助学生在管理后台与用户端快速建立「主题情境 → 单词」联想。各单词在图中的视觉锚点即该词的**示意图**。

## 2. 适用范围

| 项目 | 说明 |
|------|------|
| 年级 | 当前仅 **初级年级**（`beginner`，488 词，约 85 个主题） |
| 主题来源 | 管理后台「按场景生成主题」结果（`game_tier_groups` / `game_word_assignments`） |
| 试点 | 已完成第 1～3 个主题配图；其余待批量生成 |

## 3. 文件命名与存放

```text
public/images/vocab-groups/{tierId}/{groupIndex}.png
```

| 字段 | 规则 | 示例 |
|------|------|------|
| `tierId` | 与**年级** ID 一致 | `beginner` |
| `groupIndex` | 与数据库 `group_index`（**主题**序号）一致，从 1 起 | `1` → `1.png` |
| 格式 | PNG，横版 16:9 为宜 | — |

**注意：** 重新「按场景生成主题」后，主题序号与单词列表可能变化，需**按新分组重新生成或校验**对应学习卡片。

## 4. 画面内容规则

### 4.1 场景与主题焦点

- **主题焦点**取自主题标题中 `-` 后的部分，如 `学习3-考试` → 考试/考场画面。
- **场景**（去掉序号后的左侧名称）决定大情境基调，如 `学习`、`家庭`、`运动`（见术语表 §2.2）。
- 主题内所有单词必须在**同一幅图、同一时刻、同一空间**里出现，构成一条可理解的视觉故事。
- **禁止**分格拼贴：不得使用网格、分镜、漫画条、独立卡片等「一词一格」布局；标签应嵌入场景内，而非每个单词单独成画。

### 4.2 单词标签（示意图的核心）

用户已确认：**标签要比场景元素更醒目**，是整张学习卡片里最抢眼的视觉元素。标签 + 引导线 + 所指物体 = 该单词的**示意图**。

| 属性 | 要求 |
|------|------|
| 文字 | 英文原形，与单词卡片上显示的 `baseWord` 一致（如 `bed`，不是 `Bedroom`） |
| 样式 | 白底圆角胶囊 / 气泡 + 深蓝粗体无衬线字 + 轻阴影 |
| 引导 | 细黑引导线 + 末端圆点，指向对应物体 |
| 大小 | 全图最醒目的元素之一，缩略到 64px 高度仍可辨认 |
| 数量 | 主题内每个单词**恰好出现一次**，不多不少 |
| 位置 | 标签嵌入统一场景内，紧贴对应物品；距离远时用引导线连接 |
| 禁止 | 中文标签、额外未在主题内的单词、分格/拼贴式布局 |

### 4.3 画风与光线

- **风格**：2D 扁平卡通插画，线条清晰，略带轻阴影，简洁明亮，适合初中生。
- **画幅**：横版 16:9，便于学习卡片顶部 `object-fit: cover` 裁剪。
- **配色**：按主题焦点选用柔和配色（见 `groupCoverPrompt.ts` 中 `SCENE_PALETTE`）。
- **光线**：自然光、温暖不压抑（如窗外阳光、明亮室内），避免暗色或写实照片风。

### 4.4 场景锚点

先搭建 2～3 个**场景锚点**（固定家具/空间结构），再把单词示意图挂上去，画面更稳、不松散。

| 主题焦点 | 推荐锚点 |
|----------|----------|
| 房间 | 床、床头柜、窗户、小桌 |
| 三餐 | 餐桌、餐椅、厨房/餐厅背景 |
| 家人 | 客厅沙发、家庭合照墙、门厅 |
| 教室 | 课桌、黑板、窗户 |
| 考试 | 排列表格、时钟、监考台 |
| 图书馆 | 书架、阅读桌、借阅台 |

原则：锚点占画面主体，单词物体作为锚点上的自然细节出现，而非孤立漂浮。

### 4.5 抽象词具象化

抽象或虚词必须找到**具体视觉载体**（作为该词的示意图），让学生「一看就懂」：

| 类型 | 示例映射 |
|------|----------|
| 时间/频率 | daily → 挂墙日历；day → 窗外阳光/晴天 |
| 事件/概念 | birth → 生日蛋糕+蜡烛；need → 举手求助 |
| 状态/品质 | quiet → 安静标识；real → 真实物品（如苹果） |
| 动作 | help → 帮同学；pick → 挑选物品的手 |

原则：每个词对应**一个**主要物体或动作，避免同类重复（如只放一个 clock）。

### 4.6 参考标准（主题：家庭1-房间）

以 `beginner/11.png`（家庭1-房间）为标杆：

| 单词 | 示意图载体 |
|------|------------|
| bed | 木床 + 枕头 + 被子 |
| daily | 挂墙日历（带勾选） |
| clock | 床头柜上的闹钟 |
| day | 窗外阳光/晴天 |
| dish | 桌上的碗 |
| birth | 带蜡烛的生日蛋糕 |

整体特征：同一间卧室、米色墙 + 木色家具 + 淡绿床品、标签白底圆角+引导线、6 词自然串联。

### 4.7 单词与画面映射（更多示例）

| 主题 | 单词 | 画面串联思路 |
|------|------|--------------|
| 家庭1-房间 | bed, daily, clock, dish, day, birth | 卧室：床、日历、闹钟、碗、窗外阳光、生日蛋糕 |
| 学习1-教室 | cheat, case, club, book, email, fact | 教室：笔盒、书、社团海报、邮件、知识点、禁作弊标识 |
| 学习2-课程 | level, form, doubt, math, news, group | 围桌上课：等级表、表格、疑问、数学式、新闻板、分组 |
| 学习3-考试 | idea, mind, need, role, limit, key | 安静考场：灵感、思考、求助、角色、限时、答案 |

> 当前初级年级分组为 **每个主题 5～6 词**；出图前以数据库 `game_word_assignments` 为准。

## 5. 前端展示规则

| 位置 | 行为 |
|------|------|
| 管理后台 `VocabGameSettings` | 主题卡片标题下展示学习卡片，类名 `.admin-group-cover`，高度 **64px** |
| 用户端 `VocabTrainingModule` | 主题列表卡片顶部展示学习卡片，类名 `.vocab-group-cover`，高度 **72px** |
| 加载 | `loading="lazy"`；无图片时不占位 |

启用逻辑（代码）：

```typescript
import { groupCoverUrl, hasGroupCover } from '../modules/vocab-training/groupCover'
import { GroupCoverImage } from '../components/GroupCoverImage'
```

新增配图后执行 `node scripts/sync-group-cover-manifest.mjs`，无需改代码。

## 6. AI 出图流程

### 6.1 出图工具（推荐）

**默认使用 Cursor Agent 内置 Skill：`GenerateImage`（文生图）生成学习卡片。**

| 项目 | 说明 |
|------|------|
| 工具 | Cursor Skills → **GenerateImage** |
| 调用方 | Cursor Agent 对话中，按本规则生成并保存图片 |
| 适用 | 单主题试画、按场景批量补图、主题变更后重绘 |
| 优势 | 无需外接 API Key；prompt 与 §4、§6.5 规则一致；便于对照参考图迭代 |

**备选：** Google Gemini（Nano Banana），见 §6.6。仅在需要 API 自动化批量流水线时使用。

### 6.2 生成单主题提示词

```bash
node scripts/build-group-cover-prompt.mjs beginner 1
node scripts/build-group-cover-prompt.mjs beginner --all
node scripts/build-group-cover-prompt.mjs beginner 11 --json
```

输出英文 prompt（由 `buildGroupCoverPrompt()` 组装），供 Cursor **GenerateImage** 或备选 Gemini 使用。

### 6.3 使用 Cursor GenerateImage 出图

**Agent 操作步骤：**

1. 从 `app.db` 读取目标主题的 `group_index`、标题与单词列表  
2. 运行 `build-group-cover-prompt.mjs` 获取 prompt（或直接调用 `buildGroupCoverPrompt()`）  
3. 调用 **GenerateImage**，`description` 填入完整英文 prompt，`filename` 建议 `{groupIndex}.png`  
4. 将生成结果复制到：

   ```text
   src/public/images/vocab-groups/{tierId}/{groupIndex}.png
   ```

5. 运行 `node scripts/sync-group-cover-manifest.mjs` 同步清单  
6. 刷新管理后台 / 用户端，核对学习卡片与 §7 质量清单

**Agent 对话示例：**

```text
按 DOC-DEV-002 规则，用 GenerateImage 为 beginner 主题第 11 组（家庭1-房间）生成学习卡片并入库。
```

**注意：**

- GenerateImage 产出为横版插画；保存路径必须与 `group_index` 一致  
- 主题重新分组后，对受影响序号重新出图并再次同步清单  
- 一次生成一个主题为宜，便于对照 §4.6 参考标准验收

### 6.4 生成后入库

1. 将图片保存为 `src/public/images/vocab-groups/beginner/{groupIndex}.png`（`groupIndex` 与数据库一致）
2. 运行 `node scripts/sync-group-cover-manifest.mjs` 同步配图清单
3. 刷新管理后台 / 用户端，对应主题卡片自动显示学习卡片
4. 主题变更后，对受影响 `groupIndex` 重新出图并再次同步清单

### 6.5 学习卡片与主题匹配

| 机制 | 说明 |
|------|------|
| 文件命名 | `{groupIndex}.png` ↔ 主题 `group_index` 一一对应 |
| 清单 | `src/data/vocabGroupCovers.json` + `src/public/images/vocab-groups/covers.json` |
| 前端 | `groupCoverUrl()` 查清单；`GroupCoverImage` 组件渲染，加载失败自动隐藏 |
| 展示位置 | 管理后台主题列表、用户端单词记忆主题列表 |

### 6.6 提示词结构（固定模板）

`buildGroupCoverPrompt()` 按以下顺序组装英文 prompt：

1. 画风 + 16:9 画幅 + 主题标题  
2. 场景 / 主题焦点 / 配色 / 自然光  
3. 场景锚点 + 主题焦点串联描述（`SCENE_ANCHORS` + `SCENE_STORY_HINTS`）  
4. **LAYOUT — CRITICAL**：单一连续场景，禁止分格拼贴  
5. 主题内单词完整枚举 + 抽象词具象化要求  
6. **标签样式**：白底圆角胶囊、粗体深蓝字、细引导线+圆点、每词恰好一次  
7. 禁止项（中文、多余单词、网格/分镜/拼贴）

实现：`buildGroupCoverPrompt()` in `server/src/lib/groupCoverPrompt.ts`。  
**GenerateImage 的 `description` 参数应直接使用上述完整 prompt，勿自行缩写。**

### 6.7 备选：Gemini（Nano Banana）API 出图

仅在需要脚本自动化、不经过 Cursor Agent 时使用：

```bash
# 需 HTTPS 代理时可设：$env:HTTPS_PROXY='http://127.0.0.1:7897'
node scripts/generate-group-cover-gemini.mjs beginner 11 --sync
```

需 Google AI Studio 开通图像模型计费；prompt 同样来自 `buildGroupCoverPrompt()`。

## 7. 质量检查清单

- [ ] **单一连续场景**，不是网格/分镜/拼贴
- [ ] 主题内每个单词都有清晰英文标签（白底圆角 + 引导线），即示意图完整
- [ ] 标签与单词拼写一致（原形）
- [ ] 无遗漏、无多余单词
- [ ] 画面与主题标题一致（场景 + 主题焦点 + 场景锚点合理）
- [ ] 抽象词已具象化为可辨认物体/动作
- [ ] 缩略图高度 64px 下标签仍可辨认
- [ ] 文件路径与 `groupIndex` 对应

## 8. 后续扩展

| 项 | 说明 |
|----|------|
| 批量生成 | Cursor Agent 循环调用 **GenerateImage** + 同步清单；或 Gemini 脚本自动化 |
| 管理端按钮 | 「生成学习卡片」触发 Agent / 本地脚本 |
| 中级/高级年级 | 扩展 `GROUP_COVER_TIERS` 与目录 |
| 缺失回退 | 无 png 时隐藏图片区，不影响单词列表 |

## 9. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.1 | 2026-06-20 | 对齐 [DOC-PROD-002](../2.产品设计/DOC-PROD-002-术语表.md)：小组→主题，配图→学习卡片，补充示意图 |
| v1.0 | 2026-06-19 | 初稿：单词小组配图规则 |
