import type { SentenceRole } from './sentenceTemplates.js'

export interface StructureSegment {
  id: string
  text: string
  textZh: string
  role: SentenceRole
}

export interface StructurePuzzleTemplate {
  sentence: string
  sentenceZh: string
  segments: Array<{ text: string; textZh: string; role: SentenceRole }>
  hint: string
}

export interface StructureLevelTemplates {
  levelId: string
  puzzles: StructurePuzzleTemplate[]
}

export const STRUCTURE_LEVEL_TEMPLATES: StructureLevelTemplates[] = [
  {
    levelId: 'struct-1',
    puzzles: [
      {
        sentence: 'Tom plays football.',
        sentenceZh: '汤姆踢足球。',
        segments: [
          { text: 'Tom', textZh: '汤姆', role: 'subject' },
          { text: 'plays', textZh: '踢', role: 'predicate' },
          { text: 'football', textZh: '足球', role: 'object' },
        ],
        hint: 'Tom 是主语（谁），plays 是谓语（做什么），football 是宾语（什么）。',
      },
      {
        sentence: 'My sister bought a bike.',
        sentenceZh: '我姐姐买了一辆自行车。',
        segments: [
          { text: 'My sister', textZh: '我姐姐', role: 'subject' },
          { text: 'bought', textZh: '买了', role: 'predicate' },
          { text: 'a bike', textZh: '一辆自行车', role: 'object' },
        ],
        hint: 'My sister 是主语，bought 是谓语，a bike 是宾语。',
      },
      {
        sentence: 'We study English.',
        sentenceZh: '我们学英语。',
        segments: [
          { text: 'We', textZh: '我们', role: 'subject' },
          { text: 'study', textZh: '学', role: 'predicate' },
          { text: 'English', textZh: '英语', role: 'object' },
        ],
        hint: 'We 是主语，study 是谓语，English 是宾语。',
      },
      {
        sentence: 'The cat drank milk.',
        sentenceZh: '猫喝了牛奶。',
        segments: [
          { text: 'The cat', textZh: '猫', role: 'subject' },
          { text: 'drank', textZh: '喝了', role: 'predicate' },
          { text: 'milk', textZh: '牛奶', role: 'object' },
        ],
        hint: 'The cat 是主语，drank 是谓语，milk 是宾语。',
      },
      {
        sentence: 'I do homework.',
        sentenceZh: '我做作业。',
        segments: [
          { text: 'I', textZh: '我', role: 'subject' },
          { text: 'do', textZh: '做', role: 'predicate' },
          { text: 'homework', textZh: '作业', role: 'object' },
        ],
        hint: 'I 是主语，do 是谓语，homework 是宾语。',
      },
      {
        sentence: 'She wrote a letter.',
        sentenceZh: '她写了一封信。',
        segments: [
          { text: 'She', textZh: '她', role: 'subject' },
          { text: 'wrote', textZh: '写了', role: 'predicate' },
          { text: 'a letter', textZh: '一封信', role: 'object' },
        ],
        hint: 'She 是主语，wrote 是谓语，a letter 是宾语。',
      },
      {
        sentence: 'The dog eats meat.',
        sentenceZh: '狗吃肉。',
        segments: [
          { text: 'The dog', textZh: '狗', role: 'subject' },
          { text: 'eats', textZh: '吃', role: 'predicate' },
          { text: 'meat', textZh: '肉', role: 'object' },
        ],
        hint: 'The dog 是主语，eats 是谓语，meat 是宾语。',
      },
      {
        sentence: 'They like music.',
        sentenceZh: '他们喜欢音乐。',
        segments: [
          { text: 'They', textZh: '他们', role: 'subject' },
          { text: 'like', textZh: '喜欢', role: 'predicate' },
          { text: 'music', textZh: '音乐', role: 'object' },
        ],
        hint: 'They 是主语，like 是谓语，music 是宾语。',
      },
      {
        sentence: 'Anna reads books.',
        sentenceZh: '安娜读书。',
        segments: [
          { text: 'Anna', textZh: '安娜', role: 'subject' },
          { text: 'reads', textZh: '读', role: 'predicate' },
          { text: 'books', textZh: '书', role: 'object' },
        ],
        hint: 'Anna 是主语，reads 是谓语，books 是宾语。',
      },
      {
        sentence: 'My father drives a car.',
        sentenceZh: '我父亲开车。',
        segments: [
          { text: 'My father', textZh: '我父亲', role: 'subject' },
          { text: 'drives', textZh: '开', role: 'predicate' },
          { text: 'a car', textZh: '一辆车', role: 'object' },
        ],
        hint: 'My father 是主语，drives 是谓语，a car 是宾语。',
      },
      {
        sentence: 'The kids play games.',
        sentenceZh: '孩子们玩游戏。',
        segments: [
          { text: 'The kids', textZh: '孩子们', role: 'subject' },
          { text: 'play', textZh: '玩', role: 'predicate' },
          { text: 'games', textZh: '游戏', role: 'object' },
        ],
        hint: 'The kids 是主语，play 是谓语，games 是宾语。',
      },
      {
        sentence: 'He likes pizza.',
        sentenceZh: '他喜欢披萨。',
        segments: [
          { text: 'He', textZh: '他', role: 'subject' },
          { text: 'likes', textZh: '喜欢', role: 'predicate' },
          { text: 'pizza', textZh: '披萨', role: 'object' },
        ],
        hint: 'He 是主语，likes 是谓语，pizza 是宾语。',
      },
    ],
  },
  {
    levelId: 'struct-2',
    puzzles: [
      {
        sentence: 'A sunny day is wonderful.',
        sentenceZh: '晴朗的一天很棒。',
        segments: [
          { text: 'sunny', textZh: '晴朗的', role: 'attributive' },
          { text: 'day', textZh: '一天', role: 'subject' },
          { text: 'is', textZh: '是', role: 'predicate' },
          { text: 'wonderful', textZh: '棒的', role: 'complement' },
        ],
        hint: 'sunny 修饰 day，是定语；day 是主语；is 是系动词谓语；wonderful 是表语补语。',
      },
      {
        sentence: 'The tall boy runs.',
        sentenceZh: '那个高个男孩在跑。',
        segments: [
          { text: 'tall', textZh: '高的', role: 'attributive' },
          { text: 'boy', textZh: '男孩', role: 'subject' },
          { text: 'runs', textZh: '跑', role: 'predicate' },
        ],
        hint: 'tall 修饰 boy，是定语；boy 是主语；runs 是谓语。',
      },
      {
        sentence: 'She wore a beautiful dress.',
        sentenceZh: '她穿了一条漂亮的裙子。',
        segments: [
          { text: 'She', textZh: '她', role: 'subject' },
          { text: 'wore', textZh: '穿了', role: 'predicate' },
          { text: 'beautiful', textZh: '漂亮的', role: 'attributive' },
          { text: 'dress', textZh: '裙子', role: 'object' },
        ],
        hint: 'beautiful 修饰 dress，是定语，放在名词前。',
      },
      {
        sentence: 'We live in a quiet house.',
        sentenceZh: '我们住在一座安静的房子里。',
        segments: [
          { text: 'We', textZh: '我们', role: 'subject' },
          { text: 'live', textZh: '住', role: 'predicate' },
          { text: 'quiet', textZh: '安静的', role: 'attributive' },
          { text: 'house', textZh: '房子', role: 'object' },
        ],
        hint: 'quiet 修饰 house，是定语。',
      },
      {
        sentence: 'He bought three red apples.',
        sentenceZh: '他买了三个红苹果。',
        segments: [
          { text: 'He', textZh: '他', role: 'subject' },
          { text: 'bought', textZh: '买了', role: 'predicate' },
          { text: 'red', textZh: '红的', role: 'attributive' },
          { text: 'apples', textZh: '苹果', role: 'object' },
        ],
        hint: 'red 修饰 apples，是定语。',
      },
      {
        sentence: 'This is an interesting story.',
        sentenceZh: '这是一个有趣的故事。',
        segments: [
          { text: 'This', textZh: '这', role: 'subject' },
          { text: 'is', textZh: '是', role: 'predicate' },
          { text: 'interesting', textZh: '有趣的', role: 'attributive' },
          { text: 'story', textZh: '故事', role: 'complement' },
        ],
        hint: 'interesting 修饰 story，是定语。',
      },
      {
        sentence: 'She has a small cat.',
        sentenceZh: '她有一只小猫。',
        segments: [
          { text: 'She', textZh: '她', role: 'subject' },
          { text: 'has', textZh: '有', role: 'predicate' },
          { text: 'small', textZh: '小的', role: 'attributive' },
          { text: 'cat', textZh: '猫', role: 'object' },
        ],
        hint: 'small 修饰 cat，是定语。',
      },
      {
        sentence: 'We found an old map.',
        sentenceZh: '我们发现了一张旧地图。',
        segments: [
          { text: 'We', textZh: '我们', role: 'subject' },
          { text: 'found', textZh: '发现了', role: 'predicate' },
          { text: 'old', textZh: '旧的', role: 'attributive' },
          { text: 'map', textZh: '地图', role: 'object' },
        ],
        hint: 'old 修饰 map，是定语。',
      },
      {
        sentence: 'They saw a big tree.',
        sentenceZh: '他们看见了一棵大树。',
        segments: [
          { text: 'They', textZh: '他们', role: 'subject' },
          { text: 'saw', textZh: '看见', role: 'predicate' },
          { text: 'big', textZh: '大的', role: 'attributive' },
          { text: 'tree', textZh: '树', role: 'object' },
        ],
        hint: 'big 修饰 tree，是定语。',
      },
      {
        sentence: 'They bought fresh bread.',
        sentenceZh: '他们买了新鲜的面包。',
        segments: [
          { text: 'They', textZh: '他们', role: 'subject' },
          { text: 'bought', textZh: '买了', role: 'predicate' },
          { text: 'fresh', textZh: '新鲜的', role: 'attributive' },
          { text: 'bread', textZh: '面包', role: 'object' },
        ],
        hint: 'fresh 修饰 bread，是定语。',
      },
      {
        sentence: 'The kind teacher smiled.',
        sentenceZh: '那位和善的老师微笑了。',
        segments: [
          { text: 'kind', textZh: '和善的', role: 'attributive' },
          { text: 'teacher', textZh: '老师', role: 'subject' },
          { text: 'smiled', textZh: '微笑', role: 'predicate' },
        ],
        hint: 'kind 修饰 teacher，是定语。',
      },
      {
        sentence: 'He picked a yellow flower.',
        sentenceZh: '他摘了一朵黄色的花。',
        segments: [
          { text: 'He', textZh: '他', role: 'subject' },
          { text: 'picked', textZh: '摘', role: 'predicate' },
          { text: 'yellow', textZh: '黄色的', role: 'attributive' },
          { text: 'flower', textZh: '花', role: 'object' },
        ],
        hint: 'yellow 修饰 flower，是定语。',
      },
    ],
  },
  {
    levelId: 'struct-3',
    puzzles: [
      {
        sentence: 'She speaks English fluently.',
        sentenceZh: '她英语说得很流利。',
        segments: [
          { text: 'She', textZh: '她', role: 'subject' },
          { text: 'speaks', textZh: '说', role: 'predicate' },
          { text: 'English', textZh: '英语', role: 'object' },
          { text: 'fluently', textZh: '流利地', role: 'adverbial' },
        ],
        hint: 'fluently 修饰 speaks，说明「怎么样说」，是状语。',
      },
      {
        sentence: 'Tom runs fast in the race.',
        sentenceZh: '汤姆在比赛中跑得很快。',
        segments: [
          { text: 'Tom', textZh: '汤姆', role: 'subject' },
          { text: 'runs', textZh: '跑', role: 'predicate' },
          { text: 'fast', textZh: '快', role: 'adverbial' },
          { text: 'in the race', textZh: '在比赛中', role: 'adverbial' },
        ],
        hint: 'fast 修饰 runs；in the race 表地点，也是状语。',
      },
      {
        sentence: 'We worked hard yesterday.',
        sentenceZh: '我们昨天努力工作。',
        segments: [
          { text: 'We', textZh: '我们', role: 'subject' },
          { text: 'worked', textZh: '工作', role: 'predicate' },
          { text: 'hard', textZh: '努力地', role: 'adverbial' },
          { text: 'yesterday', textZh: '昨天', role: 'adverbial' },
        ],
        hint: 'hard 表方式，yesterday 表时间，都是状语。',
      },
      {
        sentence: 'Please walk quietly in the library.',
        sentenceZh: '请在图书馆里安静地走。',
        segments: [
          { text: 'walk', textZh: '走', role: 'predicate' },
          { text: 'quietly', textZh: '安静地', role: 'adverbial' },
          { text: 'in the library', textZh: '在图书馆里', role: 'adverbial' },
        ],
        hint: '祈使句省略主语 you；quietly 和 in the library 都是状语。',
      },
      {
        sentence: 'He answered correctly at once.',
        sentenceZh: '他立刻正确地回答了。',
        segments: [
          { text: 'He', textZh: '他', role: 'subject' },
          { text: 'answered', textZh: '回答', role: 'predicate' },
          { text: 'correctly', textZh: '正确地', role: 'adverbial' },
          { text: 'at once', textZh: '立刻', role: 'adverbial' },
        ],
        hint: 'correctly 表方式，at once 表时间。',
      },
      {
        sentence: 'The baby slept soundly all night.',
        sentenceZh: '宝宝整夜睡得很安稳。',
        segments: [
          { text: 'The baby', textZh: '宝宝', role: 'subject' },
          { text: 'slept', textZh: '睡', role: 'predicate' },
          { text: 'soundly', textZh: '安稳地', role: 'adverbial' },
          { text: 'all night', textZh: '整夜', role: 'adverbial' },
        ],
        hint: 'soundly 修饰 slept；all night 表时间。',
      },
      {
        sentence: 'Birds sing happily every morning.',
        sentenceZh: '鸟儿每天早上快乐地歌唱。',
        segments: [
          { text: 'Birds', textZh: '鸟儿', role: 'subject' },
          { text: 'sing', textZh: '歌唱', role: 'predicate' },
          { text: 'happily', textZh: '快乐地', role: 'adverbial' },
          { text: 'every morning', textZh: '每天早上', role: 'adverbial' },
        ],
        hint: 'happily 表方式，every morning 表时间，都是状语。',
      },
      {
        sentence: 'She waited patiently at the door.',
        sentenceZh: '她在门口耐心地等待。',
        segments: [
          { text: 'She', textZh: '她', role: 'subject' },
          { text: 'waited', textZh: '等待', role: 'predicate' },
          { text: 'patiently', textZh: '耐心地', role: 'adverbial' },
          { text: 'at the door', textZh: '在门口', role: 'adverbial' },
        ],
        hint: 'patiently 表方式，at the door 表地点，都是状语。',
      },
      {
        sentence: 'The team played well last weekend.',
        sentenceZh: '球队上周末踢得很好。',
        segments: [
          { text: 'The team', textZh: '球队', role: 'subject' },
          { text: 'played', textZh: '踢', role: 'predicate' },
          { text: 'well', textZh: '好', role: 'adverbial' },
          { text: 'last weekend', textZh: '上周末', role: 'adverbial' },
        ],
        hint: 'well 修饰 played；last weekend 表时间。',
      },
      {
        sentence: 'He drives carefully on rainy days.',
        sentenceZh: '他在雨天小心地开车。',
        segments: [
          { text: 'He', textZh: '他', role: 'subject' },
          { text: 'drives', textZh: '开', role: 'predicate' },
          { text: 'carefully', textZh: '小心地', role: 'adverbial' },
          { text: 'on rainy days', textZh: '在雨天', role: 'adverbial' },
        ],
        hint: 'carefully 表方式，on rainy days 表时间。',
      },
      {
        sentence: 'They arrived late for the meeting.',
        sentenceZh: '他们开会来晚了。',
        segments: [
          { text: 'They', textZh: '他们', role: 'subject' },
          { text: 'arrived', textZh: '到达', role: 'predicate' },
          { text: 'late', textZh: '晚', role: 'adverbial' },
          { text: 'for the meeting', textZh: '为了开会', role: 'adverbial' },
        ],
        hint: 'late 表时间，for the meeting 表目的，都是状语。',
      },
      {
        sentence: 'The children laughed loudly in the park.',
        sentenceZh: '孩子们在公园里大声笑。',
        segments: [
          { text: 'The children', textZh: '孩子们', role: 'subject' },
          { text: 'laughed', textZh: '笑', role: 'predicate' },
          { text: 'loudly', textZh: '大声地', role: 'adverbial' },
          { text: 'in the park', textZh: '在公园里', role: 'adverbial' },
        ],
        hint: 'loudly 表方式，in the park 表地点。',
      },
    ],
  },
  {
    levelId: 'struct-4',
    puzzles: [
      {
        sentence: 'She quietly read an interesting book in the library.',
        sentenceZh: '她在图书馆里安静地读了一本有趣的书。',
        segments: [
          { text: 'She', textZh: '她', role: 'subject' },
          { text: 'quietly', textZh: '安静地', role: 'adverbial' },
          { text: 'read', textZh: '读', role: 'predicate' },
          { text: 'interesting', textZh: '有趣的', role: 'attributive' },
          { text: 'book', textZh: '书', role: 'object' },
          { text: 'in the library', textZh: '在图书馆里', role: 'adverbial' },
        ],
        hint: '含主语、谓语、宾语、定语、状语五种成分。',
      },
      {
        sentence: 'The tall boy became very strong last year.',
        sentenceZh: '那个高个男孩去年变得很强壮。',
        segments: [
          { text: 'tall', textZh: '高的', role: 'attributive' },
          { text: 'boy', textZh: '男孩', role: 'subject' },
          { text: 'became', textZh: '变得', role: 'predicate' },
          { text: 'very strong', textZh: '很强壮', role: 'complement' },
          { text: 'last year', textZh: '去年', role: 'adverbial' },
        ],
        hint: '含定语、主语、谓语、补语、状语五种成分。',
      },
      {
        sentence: 'We carefully planted many red flowers in the garden.',
        sentenceZh: '我们在花园里认真地种了许多红花。',
        segments: [
          { text: 'We', textZh: '我们', role: 'subject' },
          { text: 'carefully', textZh: '认真地', role: 'adverbial' },
          { text: 'planted', textZh: '种', role: 'predicate' },
          { text: 'red', textZh: '红的', role: 'attributive' },
          { text: 'flowers', textZh: '花', role: 'object' },
          { text: 'in the garden', textZh: '在花园里', role: 'adverbial' },
        ],
        hint: '含主语、谓语、宾语、定语、状语五种成分。',
      },
      {
        sentence: 'The old man slowly told us an exciting story yesterday.',
        sentenceZh: '那位老人昨天慢慢地给我们讲了一个精彩的故事。',
        segments: [
          { text: 'old', textZh: '年老的', role: 'attributive' },
          { text: 'man', textZh: '老人', role: 'subject' },
          { text: 'slowly', textZh: '慢慢地', role: 'adverbial' },
          { text: 'told', textZh: '讲', role: 'predicate' },
          { text: 'exciting', textZh: '精彩的', role: 'attributive' },
          { text: 'story', textZh: '故事', role: 'object' },
          { text: 'yesterday', textZh: '昨天', role: 'adverbial' },
        ],
        hint: '含主语、谓语、宾语、定语、状语五种成分。',
      },
      {
        sentence: 'The smart student answered the difficult question correctly in class.',
        sentenceZh: '那个聪明的学生在课堂上正确地回答了那道难题。',
        segments: [
          { text: 'smart', textZh: '聪明的', role: 'attributive' },
          { text: 'student', textZh: '学生', role: 'subject' },
          { text: 'answered', textZh: '回答', role: 'predicate' },
          { text: 'difficult', textZh: '难的', role: 'attributive' },
          { text: 'question', textZh: '问题', role: 'object' },
          { text: 'correctly', textZh: '正确地', role: 'adverbial' },
          { text: 'in class', textZh: '在课堂上', role: 'adverbial' },
        ],
        hint: '含主语、谓语、宾语、定语、状语五种成分。',
      },
      {
        sentence: 'Tom found his lost dog safe at last.',
        sentenceZh: '汤姆终于找到了他走丢的狗，狗很安全。',
        segments: [
          { text: 'Tom', textZh: '汤姆', role: 'subject' },
          { text: 'found', textZh: '找到', role: 'predicate' },
          { text: 'lost', textZh: '走丢的', role: 'attributive' },
          { text: 'dog', textZh: '狗', role: 'object' },
          { text: 'safe', textZh: '安全的', role: 'complement' },
          { text: 'at last', textZh: '终于', role: 'adverbial' },
        ],
        hint: '含主语、谓语、宾语、定语、补语、状语六种成分。',
      },
      {
        sentence: 'A young girl quickly opened the heavy door.',
        sentenceZh: '一个小女孩快速打开了那扇重门。',
        segments: [
          { text: 'young', textZh: '小的', role: 'attributive' },
          { text: 'girl', textZh: '女孩', role: 'subject' },
          { text: 'quickly', textZh: '快速地', role: 'adverbial' },
          { text: 'opened', textZh: '打开', role: 'predicate' },
          { text: 'heavy', textZh: '重的', role: 'attributive' },
          { text: 'door', textZh: '门', role: 'object' },
        ],
        hint: '含主语、谓语、宾语、定语、状语五种成分。',
      },
      {
        sentence: 'My brother became very happy after the exam.',
        sentenceZh: '我哥哥考试后变得很开心。',
        segments: [
          { text: 'My brother', textZh: '我哥哥', role: 'subject' },
          { text: 'became', textZh: '变得', role: 'predicate' },
          { text: 'very happy', textZh: '很开心', role: 'complement' },
          { text: 'after the exam', textZh: '考试后', role: 'adverbial' },
        ],
        hint: '含主语、谓语、补语、状语四种成分；very happy 作表语补语。',
      },
      {
        sentence: 'The little bird sang sweetly in the tree.',
        sentenceZh: '那只小鸟在树上甜美地歌唱。',
        segments: [
          { text: 'little', textZh: '小的', role: 'attributive' },
          { text: 'bird', textZh: '鸟', role: 'subject' },
          { text: 'sang', textZh: '歌唱', role: 'predicate' },
          { text: 'sweetly', textZh: '甜美地', role: 'adverbial' },
          { text: 'in the tree', textZh: '在树上', role: 'adverbial' },
        ],
        hint: '含定语、主语、谓语、状语四种成分。',
      },
      {
        sentence: 'We carefully cleaned the dirty classroom yesterday.',
        sentenceZh: '我们昨天认真地打扫了那间脏教室。',
        segments: [
          { text: 'We', textZh: '我们', role: 'subject' },
          { text: 'carefully', textZh: '认真地', role: 'adverbial' },
          { text: 'cleaned', textZh: '打扫', role: 'predicate' },
          { text: 'dirty', textZh: '脏的', role: 'attributive' },
          { text: 'classroom', textZh: '教室', role: 'object' },
          { text: 'yesterday', textZh: '昨天', role: 'adverbial' },
        ],
        hint: '含主语、谓语、宾语、定语、状语五种成分。',
      },
      {
        sentence: 'The brave firefighter saved the little child safely.',
        sentenceZh: '那位勇敢的消防员安全地救出了那个小孩。',
        segments: [
          { text: 'brave', textZh: '勇敢的', role: 'attributive' },
          { text: 'firefighter', textZh: '消防员', role: 'subject' },
          { text: 'saved', textZh: '救出', role: 'predicate' },
          { text: 'little', textZh: '小的', role: 'attributive' },
          { text: 'child', textZh: '小孩', role: 'object' },
          { text: 'safely', textZh: '安全地', role: 'adverbial' },
        ],
        hint: '含定语、主语、谓语、宾语、状语五种成分。',
      },
      {
        sentence: 'She slowly made her sick grandma feel better.',
        sentenceZh: '她慢慢地让生病的奶奶感觉好受了些。',
        segments: [
          { text: 'She', textZh: '她', role: 'subject' },
          { text: 'slowly', textZh: '慢慢地', role: 'adverbial' },
          { text: 'made', textZh: '使', role: 'predicate' },
          { text: 'sick', textZh: '生病的', role: 'attributive' },
          { text: 'grandma', textZh: '奶奶', role: 'object' },
          { text: 'feel better', textZh: '感觉好受', role: 'complement' },
        ],
        hint: '含主语、谓语、宾语、定语、补语、状语六种成分。',
      },
    ],
  },
]
