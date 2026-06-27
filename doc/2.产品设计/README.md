# 产品设计文档目录

放置 `DOC-PROD-*`、`DOC-USER-*`、`DOC-DES-*` 等文档。

## 文档列表

| 编号 | 文档 | 说明 |
|------|------|------|
| DOC-PROD-001 | [单词生成规则](DOC-PROD-001-单词生成规则.md) | 例句、关联词、释义的内容规范（弱基础初中生） |
| DOC-PROD-002 | [术语表](DOC-PROD-002-术语表.md) | **年级 / 场景 / 主题 / 学习卡片 / 单词** 统一专有术语 |
| DOC-PROD-003 | [产品设计规范](DOC-PROD-003-产品设计规范.md) | **UI 与交互原则**（PC 宽屏优先、布局与验收自检） |
| DOC-PROD-004 | [学习闭环系统设计](DOC-PROD-004-学习闭环系统设计.md) | 学员-centered 单词学习闭环（我的库 / 学习集 / 小节 / 测评） |
| DOC-PROD-005 | [征服星球玩法设计](DOC-PROD-005-征服星球玩法设计文档.md) | **扩展游戏**：词性军团养成，Word Hunter 战略层升级（`/conquer`） |
| DOC-PROD-006 | [征服星球过关游戏插件设计](DOC-PROD-006-征服星球过关游戏插件设计.md) | 地图关卡内可插拔过关游戏（GamePlugin / GameRunner / settleLevel） |

**熟词池**（纯单词，供例句/短文生成）：`server/data/中考高频词-初级组.md` · 中级组 · 高级组  
重新导出：`python scripts/export_high_freq_words.py`

## 子目录

- `sop/` — 标准操作流程
- `knowledge-base/` — 知识库
- `demo/` — 原型与演示
