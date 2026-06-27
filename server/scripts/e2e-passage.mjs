/** 端到端验证编译后的 generateBattlePassage（真实调用 Qwen + 重试 + 校验） */
import { generateBattlePassage, checkPassageVocabulary } from '../dist/lib/learning/wordHunterPassage.js'

const words = [
  { word: 'note', meaning: '笔记', pos: 'noun', squad: 'recent' },
  { word: 'sky', meaning: '天空', pos: 'noun', squad: 'recent' },
  { word: 'metal', meaning: '金属', pos: 'noun', squad: 'recent' },
  { word: 'tray', meaning: '托盘', pos: 'noun', squad: 'recent' },
  { word: 'until', meaning: '直到', pos: 'prep', squad: 'recent' },
  { word: 'activity', meaning: '活动', pos: 'noun', squad: 'recommended' },
  { word: 'skill', meaning: '技能', pos: 'noun', squad: 'recommended' },
  { word: 'human', meaning: '人类', pos: 'noun', squad: 'recommended' },
  { word: 'picture', meaning: '图片', pos: 'noun', squad: 'recommended' },
  { word: 'school', meaning: '学校', pos: 'noun', squad: 'recommended' },
]
// ~150 个常见 KET/中考词，模拟"已学词库较大"的真实场景
const allowed = ['ruler', 'book', 'blue', 'today', 'like', 'store', 'open', 'friend', 'important',
  'story', 'class', 'english', 'talk', 'meaning', 'student', 'know', 'write', 'use', 'carry',
  'food', 'plastic', 'play', 'role', 'learn', 'find', 'teacher', 'show', 'early', 'weather',
  'water', 'drink', 'hot', 'cold', 'field', 'camp', 'join', 'star', 'watch', 'night', 'dark',
  'morning', 'day', 'time', 'people', 'work', 'help', 'good', 'new', 'old', 'every', 'paper',
  'sunny', 'rain', 'cloud', 'tree', 'flower', 'grass', 'park', 'garden', 'home', 'house',
  'room', 'door', 'window', 'wall', 'table', 'chair', 'desk', 'bag', 'pen', 'pencil',
  'box', 'tool', 'busy', 'happy', 'sad', 'tired', 'fun', 'nice', 'great', 'bright',
  'clean', 'dirty', 'fast', 'slow', 'easy', 'hard', 'big', 'small', 'long', 'short',
  'walk', 'run', 'jump', 'sit', 'stand', 'eat', 'sleep', 'talk', 'listen', 'speak',
  'read', 'draw', 'paint', 'color', 'cut', 'fix', 'build', 'clean', 'wash', 'cook',
  'buy', 'sell', 'give', 'take', 'bring', 'keep', 'put', 'make', 'do', 'go',
  'come', 'see', 'look', 'hear', 'feel', 'think', 'remember', 'forget', 'try', 'start',
  'finish', 'task', 'job', 'idea', 'problem', 'answer', 'question', 'word', 'name', 'number',
  'week', 'month', 'year', 'hour', 'minute', 'family', 'mother', 'father', 'sister', 'brother',
  'animal', 'bird', 'fish', 'dog', 'cat', 'box', 'group', 'team', 'game', 'fun']

const RUNS = 3
for (let i = 1; i <= RUNS; i += 1) {
  const t0 = Date.now()
  try {
    const r = await generateBattlePassage(words, allowed)
    const ms = Date.now() - t0
    const blanks = r.passageEn.split('___').length - 1
    console.log(`\n#${i} 成功 ${(ms / 1000).toFixed(1)}s  空位${blanks} 答案${r.answers.length}`)
    console.log('  ', r.passageEn)
    console.log('   答案:', r.answers.join(', '))
  } catch (e) {
    console.log(`\n#${i} 失败 ${((Date.now() - t0) / 1000).toFixed(1)}s  ${e.message}`)
  }
}
