import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DatabaseSync } from 'node:sqlite'
import { clearPassageAudioCache } from './passageAudioCache.js'
import { loadDashscopeApiKey } from './loadDashscopeApiKey.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHAT_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const DEFAULT_MODEL = process.env.DASHSCOPE_CHAT_MODEL?.trim() || 'qwen-plus'

const TIER_LABELS: Record<string, string> = {
  beginner: '初级',
  intermediate: '中级',
  advanced: '高级',
}

const HIGH_FREQ_FILES: Record<string, string> = {
  beginner: '中考高频词-初级组.md',
  intermediate: '中考高频词-中级组.md',
  advanced: '中考高频词-高级组.md',
}

/** 已人工校对的「学习」场景短文 */
const CURATED_PASSAGES: Record<string, { passageEn: string; passageZh: string }> = {
  '学习1-教室': {
    passageEn:
      'We put a book and a pencil case on the desk. I join a club after school and learn a fact every day. Do not cheat on the test.',
    passageZh:
      '我们把书和铅笔盒放在课桌上。我放学后参加社团，每天学一个知识点。考试不要作弊。',
  },
  '学习2-课程': {
    passageEn:
      'We read the news and fill in a form at the start of class. I have some doubt about math at this level. Our group can help each other after class.',
    passageZh:
      '我们上课先读新闻并填表。我对这个水平的数学有点疑问。下课后我们小组可以互相帮助。',
  },
  '学习3-考试': {
    passageEn:
      'For the exam, you need the key idea and your role. Keep your mind on the paper. There is a time limit, so do not wait too long.',
    passageZh:
      '考试时你要知道关键想法和自己在小组里的角色。把注意力放在试卷上。有时间限制，不要等太久。',
  },
  '学习4-老师': {
    passageEn:
      'The teacher wants us to be quiet. This part of the paper feels real hard. Follow the rule and you may get a good score.',
    passageZh:
      '老师要我们保持安静。试卷这部分真的很难。遵守规则，你可能会得高分。',
  },
  '学习5-同学': {
    passageEn:
      'My friend got a prize for a good mark this term. She can print the proof on paper. The shape of her work looks nice.',
    passageZh:
      '我朋友这学期因分数好得了奖。她可以把证明打印在纸上。她作业的形状很好看。',
  },
  '学习6-作业': {
    passageEn:
      'Our task is about a new topic this week. I use a ruler and write a note in my book. The title of our work should be fair to all.',
    passageZh:
      '我们本周的任务是一个新话题。我用尺子并在书里做笔记。我们作业的标题应对所有人公平。',
  },
  '学习7-图书馆': {
    passageEn:
      'I ask the teacher to help me use the new word. I add a note once a day. The library is open in June.',
    passageZh:
      '我请老师帮我用这个新词。我每天加一条笔记。图书馆六月开放。',
  },
  '学习8-课堂': {
    passageEn:
      'We meet in class and keep a new list of names. Our plan is to learn five words each day. I write my name on the list first.',
    passageZh:
      '我们在课堂见面，保存一份新的姓名名单。我们计划每天学五个单词。我先在名单上写下自己的名字。',
  },
  '学习9-教室': {
    passageEn:
      'Let me help you pick the right book. I know you can pass the test. Do not be afraid to ask if you need help.',
    passageZh:
      '让我帮你选对本的书。我知道你能通过考试。需要帮助就大胆提问。',
  },
  '学习10-课程': {
    passageEn:
      'Do not miss class today. Look at the book and say the word out loud. Tell me when you need help.',
    passageZh:
      '今天别缺课。看书，大声说出单词。需要帮助就告诉我。',
  },
  '家庭2-三餐': {
    passageEn:
      'My dad and I eat dinner in our house. A boy and a kid sit on a chair at the table. The meal is at the end of the day.',
    passageZh:
      '我和爸爸在我们家的房子里吃晚饭。一个男孩和一个小孩坐在餐桌旁的椅子上。这顿饭是一天的末尾。',
  },
  '时间1-点子面段': {
    passageEn:
      'The art show opens at three on Sunday in the city hall. Many students come in the afternoon to see the work.',
    passageZh: '美术展周日下午三点在市政厅开幕。许多学生下午来看作品。',
  },
  '时间2-持续与起点': {
    passageEn:
      'We waited for an hour at the station. Mom has cooked here since June. The game stopped during the rain, but fans stayed through the last minute.',
    passageZh:
      '我们在车站等了一小时。妈妈从六月起在这里做饭。比赛因雨中止，但球迷坚持到最后一分钟。',
  },
  '时间3-先后与截止': {
    passageEn:
      'Brush your teeth before bed. The bus runs from seven to ten, and the library stays open until eight. After class, send the photo by five.',
    passageZh: '睡前刷牙。公交车从七点到十点运行，图书馆开到八点。下课后五点前把照片发给我。',
  },
  '时间4-钟点与其他': {
    passageEn:
      'The bell rings at ten past nine. It is a quarter to ten now. Dinner is around seven. We visit grandma over the weekend, and nap between one and two.',
    passageZh:
      '铃声响，现在九点十分，差一刻十点。晚饭大约七点。我们整个周末去看奶奶，一点到两点之间小睡。',
  },
  '时间5-易混非介词': {
    passageEn:
      'Grandpa left the town long ago. Text me later today. She drinks milk every morning, and each ticket costs ten yuan.',
    passageZh:
      '爷爷很久以前离开了这座小镇。今天晚些时候给我发短信。她每天早上喝牛奶，每张票十元。',
  },
}

export interface ThemePassageWord {
  word: string
  pos: string
  posLabel: string
  meaningZh: string
  exampleEn: string
  exampleZh: string
}

export interface ThemePassageResult {
  passageEn: string
  passageZh: string
  source: 'curated' | 'llm' | 'fallback'
}

interface GeneratedPassagePayload {
  passage_en: string
  passage_zh: string
}

function loadHighFreqPool(tierId: string, limit = 80): string {
  const filename = HIGH_FREQ_FILES[tierId] ?? HIGH_FREQ_FILES.beginner
  const filePath = path.resolve(__dirname, '../data', filename)
  if (!fs.existsSync(filePath)) return ''
  const text = fs.readFileSync(filePath, 'utf8').trim().replace(/;$/, '')
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
    .join(', ')
}


function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function countSentences(text: string): number {
  return text.split(/[.!?]+/).map((part) => part.trim()).filter(Boolean).length
}

export function missingWordsInPassage(passageEn: string, words: ThemePassageWord[]): string[] {
  const lower = passageEn.toLowerCase()
  return words
    .map((item) => item.word.trim())
    .filter((word) => {
      if (!word) return false
      const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i')
      return !pattern.test(lower)
    })
}

function tierSentenceRules(tierId: string): string {
  switch (tierId) {
    case 'intermediate':
      return '允许 1 个介词短语或 1 个并列结构；仍避免 which/that 定语从句'
    case 'advanced':
      return '允许中考阅读/完形常见句型；句中生词不超过 1 个'
    default:
      return '主谓宾/主系表，一般现在时为主；禁止从句、被动语态、虚拟语气'
  }
}

function buildPrompt(
  tierId: string,
  title: string,
  words: ThemePassageWord[],
  highFreq: string,
): string {
  const tierLabel = TIER_LABELS[tierId] ?? tierId
  const wordLines = words
    .map(
      (item) =>
        `- ${item.word}（${item.posLabel || item.pos}，${item.meaningZh || '暂无释义'}）例句：${item.exampleEn || '无'}`,
    )
    .join('\n')

  return `你是初中英语词汇编写专家，面向英语弱基础学生（北京中考）。

请为主题「${title}」编写一篇英汉对照短文，把下列单词自然串联进语境。

## 年级
${tierLabel}

## 本主题单词（必须全部出现在英文短文中，拼写与原形一致）
${wordLines}

## 短文规则
1. 英文不超过 3 个句子（以 . ! ? 分句）
2. ${tierSentenceRules(tierId)}
3. 除目标词外，其余词优先使用熟词池中的词
4. 禁止语法错误、学术化套话（如 plays an important role）
5. 短文要有统一场景，读起来像一个小故事或日常片段
6. passage_zh 为 passage_en 的自然中文，简洁易懂

## 熟词池
${highFreq || '（暂无熟词池，请使用初中常见词）'}

## 输出格式
只输出 JSON，不要 markdown 代码块：
{"passage_en":"...","passage_zh":"..."}`
}

async function callQwen(prompt: string): Promise<GeneratedPassagePayload> {
  const apiKey = loadDashscopeApiKey()
  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.35,
      response_format: { type: 'json_object' },
    }),
  })

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
    error?: { message?: string }
  }

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `百炼 API 请求失败 (${response.status})`)
  }

  const content = payload.choices?.[0]?.message?.content
  if (!content) throw new Error('百炼 API 未返回内容')
  return JSON.parse(content) as GeneratedPassagePayload
}

function validatePassage(passageEn: string, passageZh: string, words: ThemePassageWord[]): void {
  if (!passageEn.trim()) throw new Error('生成结果缺少英文短文')
  if (!passageZh.trim()) throw new Error('生成结果缺少中文短文')
  if (countSentences(passageEn) > 3) {
    throw new Error(`短文超过 3 句（当前 ${countSentences(passageEn)} 句）`)
  }
  const missing = missingWordsInPassage(passageEn, words)
  if (missing.length > 0) {
    throw new Error(`短文未覆盖单词：${missing.join(', ')}`)
  }
}

export function buildPassageFallback(words: ThemePassageWord[]): ThemePassageResult {
  const picked = words
    .filter((item) => item.exampleEn.trim())
    .slice(0, 3)
    .map((item) => ({
      en: item.exampleEn.trim().replace(/\s+/g, ' '),
      zh: item.exampleZh.trim(),
    }))

  if (picked.length === 0) {
    const names = words.map((item) => item.word).join(', ')
    return {
      passageEn: `Today we learn these words: ${names}.`,
      passageZh: `今天我们学习这些单词：${words.map((item) => item.meaningZh || item.word).join('、')}。`,
      source: 'fallback',
    }
  }

  return {
    passageEn: picked.map((item) => item.en).join(' '),
    passageZh: picked.map((item) => item.zh).filter(Boolean).join(' '),
    source: 'fallback',
  }
}

export function loadGroupWords(
  db: DatabaseSync,
  tierId: string,
  groupIndex: number,
): { title: string; words: ThemePassageWord[] } {
  const group = db
    .prepare('SELECT title FROM game_tier_groups WHERE tier_id = ? AND group_index = ?')
    .get(tierId, groupIndex) as { title: string } | undefined
  if (!group) throw new Error('主题不存在')

  const rows = db
    .prepare(
      `
      SELECT w.word, w.pos, w.pos_label, w.meaning_zh, w.example_en, w.example_zh
      FROM game_word_assignments a
      INNER JOIN words w ON w.id = a.word_id
      WHERE a.tier_id = ? AND a.group_index = ?
      ORDER BY w.sort_order, w.id
      `,
    )
    .all(tierId, groupIndex) as Array<{
    word: string
    pos: string
    pos_label: string
    meaning_zh: string
    example_en: string
    example_zh: string
  }>

  return {
    title: group.title,
    words: rows.map((row) => ({
      word: row.word,
      pos: row.pos,
      posLabel: row.pos_label,
      meaningZh: row.meaning_zh,
      exampleEn: row.example_en,
      exampleZh: row.example_zh,
    })),
  }
}

export function saveGroupPassage(
  db: DatabaseSync,
  tierId: string,
  groupIndex: number,
  passageEn: string,
  passageZh: string,
): void {
  const result = db
    .prepare(
      `
      UPDATE game_tier_groups
      SET passage_en = ?, passage_zh = ?
      WHERE tier_id = ? AND group_index = ?
      `,
    )
    .run(passageEn.trim(), passageZh.trim(), tierId, groupIndex)

  if (result.changes === 0) throw new Error('主题不存在')
  clearPassageAudioCache(tierId, groupIndex)
}

export async function generateThemePassage(
  db: DatabaseSync,
  tierId: string,
  groupIndex: number,
  options?: { force?: boolean; preferLlm?: boolean },
): Promise<ThemePassageResult> {
  const { title, words } = loadGroupWords(db, tierId, groupIndex)
  if (words.length === 0) throw new Error('主题暂无单词')

  const existing = db
    .prepare('SELECT passage_en FROM game_tier_groups WHERE tier_id = ? AND group_index = ?')
    .get(tierId, groupIndex) as { passage_en: string } | undefined

  if (!options?.force && existing?.passage_en?.trim()) {
    const row = db
      .prepare('SELECT passage_en, passage_zh FROM game_tier_groups WHERE tier_id = ? AND group_index = ?')
      .get(tierId, groupIndex) as { passage_en: string; passage_zh: string }
    return {
      passageEn: row.passage_en,
      passageZh: row.passage_zh,
      source: 'curated',
    }
  }

  const curated = CURATED_PASSAGES[title]
  if (curated && !options?.preferLlm) {
    saveGroupPassage(db, tierId, groupIndex, curated.passageEn, curated.passageZh)
    return { ...curated, source: 'curated' }
  }

  try {
    const prompt = buildPrompt(tierId, title, words, loadHighFreqPool(tierId))
    const generated = await callQwen(prompt)
    const passageEn = generated.passage_en.trim()
    const passageZh = generated.passage_zh.trim()
    validatePassage(passageEn, passageZh, words)
    saveGroupPassage(db, tierId, groupIndex, passageEn, passageZh)
    return { passageEn, passageZh, source: 'llm' }
  } catch {
    const fallback = buildPassageFallback(words)
    saveGroupPassage(db, tierId, groupIndex, fallback.passageEn, fallback.passageZh)
    return fallback
  }
}

export async function generateAllThemePassages(
  db: DatabaseSync,
  tierId: string,
  options?: { force?: boolean; delayMs?: number },
): Promise<Array<{ groupIndex: number; title: string; source: string }>> {
  const groups = db
    .prepare('SELECT group_index, title FROM game_tier_groups WHERE tier_id = ? ORDER BY group_index')
    .all(tierId) as Array<{ group_index: number; title: string }>

  const results: Array<{ groupIndex: number; title: string; source: string }> = []
  for (const group of groups) {
    const result = await generateThemePassage(db, tierId, group.group_index, {
      force: options?.force,
    })
    results.push({
      groupIndex: group.group_index,
      title: group.title,
      source: result.source,
    })
    if (options?.delayMs && options.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs))
    }
  }
  return results
}
