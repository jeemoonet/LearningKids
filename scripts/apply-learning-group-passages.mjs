/**
 * 为「学习」场景各小组写入场景短文（passage_en / passage_zh）
 * 规则见 doc/2.产品设计/DOC-PROD-001-单词生成规则.md
 *
 * 用法：node scripts/apply-learning-group-passages.mjs
 */
import { DatabaseSync } from 'node:sqlite'

const PASSAGES = [
  {
    groupIndex: 1,
    title: '学习1-教室',
    passageEn:
      'We put a book and a pencil case on the desk. I join a club after school and learn a fact every day. Do not cheat on the test. My teacher can send an email to my mom if I am late.',
    passageZh:
      '我们把书和铅笔盒放在课桌上。我放学后参加社团，每天学一个知识点。考试不要作弊。如果我迟到，老师会给妈妈发邮件。',
  },
  {
    groupIndex: 2,
    title: '学习2-课程',
    passageEn:
      'We read the news and fill in a form at the start of class. I have some doubt about math at this level. Our group can help each other after class.',
    passageZh:
      '我们上课先读新闻并填表。我对这个水平的数学有点疑问。下课后我们小组可以互相帮助。',
  },
  {
    groupIndex: 3,
    title: '学习3-考试',
    passageEn:
      'For the exam, you need the key idea and your role. Keep your mind on the paper. There is a time limit, so do not wait too long.',
    passageZh:
      '考试时你要知道关键想法和自己在小组里的角色。把注意力放在试卷上。有时间限制，不要等太久。',
  },
  {
    groupIndex: 4,
    title: '学习4-老师',
    passageEn:
      'The teacher wants us to be quiet. This part of the paper feels real hard. Follow the rule and you may get a good score.',
    passageZh:
      '老师要我们保持安静。试卷这部分真的很难。遵守规则，你可能会得高分。',
  },
  {
    groupIndex: 5,
    title: '学习5-同学',
    passageEn:
      'My friend got a prize for a good mark this term. She can print the proof on paper. The shape of her work looks nice.',
    passageZh:
      '我朋友这学期因分数好得了奖。她可以把证明打印在纸上。她作业的形状很好看。',
  },
  {
    groupIndex: 6,
    title: '学习6-作业',
    passageEn:
      'Our task is about a new topic this week. I use a ruler and write a note in my book. The title of our work should be fair to all.',
    passageZh:
      '我们本周的任务是一个新话题。我用尺子并在书里做笔记。我们作业的标题应对所有人公平。',
  },
  {
    groupIndex: 7,
    title: '学习7-图书馆',
    passageEn:
      'I ask the teacher to help me use the new word. I add a note once a day. The library is open in June.',
    passageZh:
      '我请老师帮我用这个新词。我每天加一条笔记。图书馆六月开放。',
  },
  {
    groupIndex: 8,
    title: '学习8-课堂',
    passageEn:
      'We meet in class and keep a new list of names. Our plan is to learn five words each day. I write my name on the list first.',
    passageZh:
      '我们在课堂见面，保存一份新的姓名名单。我们计划每天学五个单词。我先在名单上写下自己的名字。',
  },
  {
    groupIndex: 9,
    title: '学习9-教室',
    passageEn:
      'Let me help you pick the right book. I know you can pass the test. Do not be afraid to ask if you need help.',
    passageZh:
      '让我帮你选对本的书。我知道你能通过考试。需要帮助就大胆提问。',
  },
  {
    groupIndex: 10,
    title: '学习10-课程',
    passageEn:
      'Do not miss class today. Look at the book and say the word out. Try again if you make a mistake. Tell me when you need help.',
    passageZh:
      '今天别缺课。看书，大声说出单词。说错了就再试一次。需要帮助就告诉我。',
  },
]

const db = new DatabaseSync('server/data/app.db')

const columns = db.prepare('PRAGMA table_info(game_tier_groups)').all()
if (!columns.some((c) => c.name === 'passage_en')) {
  db.exec(`
    ALTER TABLE game_tier_groups ADD COLUMN passage_en TEXT NOT NULL DEFAULT '';
    ALTER TABLE game_tier_groups ADD COLUMN passage_zh TEXT NOT NULL DEFAULT '';
  `)
  console.log('Added passage_en / passage_zh columns')
}

const update = db.prepare(`
  UPDATE game_tier_groups
  SET passage_en = ?, passage_zh = ?
  WHERE tier_id = 'beginner' AND group_index = ? AND title = ?
`)

const verify = db.prepare(`
  SELECT g.group_index, g.title, g.passage_en, g.passage_zh,
         GROUP_CONCAT(w.word, ', ') AS words
  FROM game_tier_groups g
  JOIN game_word_assignments a ON a.tier_id = g.tier_id AND a.group_index = g.group_index
  JOIN words w ON w.id = a.word_id
  WHERE g.tier_id = 'beginner' AND g.title LIKE '学习%'
  GROUP BY g.group_index
  ORDER BY g.group_index
`)

let updated = 0
for (const item of PASSAGES) {
  const result = update.run(item.passageEn, item.passageZh, item.groupIndex, item.title)
  if (result.changes === 0) {
    console.warn(`WARN: no row updated for ${item.title} (index ${item.groupIndex})`)
  } else {
    updated += 1
    console.log(`OK ${item.title}`)
  }
}

console.log(`\nUpdated ${updated}/${PASSAGES.length} groups\n`)

const rows = verify.all()
for (const row of rows) {
  const words = row.words.split(', ').map((w) => w.replace(/\s+\[.*$/, ''))
  const missing = words.filter((w) => !row.passage_en.toLowerCase().includes(w.toLowerCase()))
  const status = missing.length === 0 ? '✓' : `✗ missing: ${missing.join(', ')}`
  console.log(`${row.group_index}\t${row.title}\t${status}`)
}
