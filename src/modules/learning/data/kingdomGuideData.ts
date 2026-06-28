export interface KingdomGuideEntry {
  id: string
  order: number
  name: string
  region: string
  difficulty: string
  icon: string
  subtitle: string
  /** 该王国的语法 / 玩法主题 */
  focus: string
  /** 镇守的妖怪与称号 */
  monster: string
  /** 通关要点提示 */
  tip: string
}

export const KINGDOM_GUIDES: KingdomGuideEntry[] = [
  {
    id: 'kingdom-1',
    order: 1,
    name: '微光村国',
    region: '西南边境',
    difficulty: '★☆☆',
    icon: '🏘️',
    subtitle: '邪恶军团最薄弱的边境，从这里开始壮大你的军团。',
    focus: '入门关：认识单词、完成造句，把村民收编为第一批士兵。',
    monster: '迷雾石像 · 名词守卫',
    tip: '名词怪兽镇守，派出学者（形容词）相生克制，拼写发射击破封印。',
  },
  {
    id: 'kingdom-2',
    order: 2,
    name: '食物炊烟国',
    region: '南麓平原',
    difficulty: '★★☆',
    icon: '🍲',
    subtitle: '灶火永不熄灭的国度，形容词强化名词的试炼之地。',
    focus: '主题词汇关：饮食类名词 + 形容词搭配，练习"形容词修饰名词"。',
    monster: '饕餮锅灵 · 食欲化形',
    tip: '用形容词（学者）强化名词军团，相生加成更易破防。',
  },
  {
    id: 'kingdom-3',
    order: 3,
    name: '迷雾森林国',
    region: '西侧林带',
    difficulty: '★★☆',
    icon: '🌲',
    subtitle: '动词猎手潜伏于林，副词与动词的搭配之战。',
    focus: '动词关：动作类动词 + 副词修饰，练习"副词修饰动词"。',
    monster: '林影追猎者 · 动词之影',
    tip: '面对动词系敌人，派出魔法师（副词）相生 +20%。',
  },
  {
    id: 'kingdom-4',
    order: 4,
    name: '时之沙漏国',
    region: '中央沙海',
    difficulty: '★★★',
    icon: '⏳',
    subtitle: '时光在此倒流，不规则动词与时态的终极考验。',
    focus: '时态关：不规则动词变形与时空时态的进阶考验。',
    monster: '沙漏魔神 · 时态扭曲者',
    tip: '熟记不规则动词变形，是稳定输出的关键。',
  },
  {
    id: 'kingdom-5',
    order: 5,
    name: '万象集市国',
    region: '东岸商路',
    difficulty: '★★★',
    icon: '🏪',
    subtitle: '六族混杂的贸易枢纽，词性连线与混合战术。',
    focus: '综合关：六大词性混合出现，考验词性辨识与混合编队。',
    monster: '万舌商蛇 · 词性混沌',
    tip: '看清每个单词的词性，按相生关系灵活调度六族。',
  },
  {
    id: 'kingdom-6',
    order: 6,
    name: '记忆回廊国',
    region: '北境回廊',
    difficulty: '★★★★',
    icon: '🕯️',
    subtitle: '遗忘的士兵在此徘徊，抗遗忘与防叛逃的最后防线。',
    focus: '复习关：高强度抗遗忘训练，及时召回走散的老兵。',
    monster: '回声魅影 · 记忆吞噬者',
    tip: '勤复习、按时召回，避免士兵因遗忘而叛逃。',
  },
  {
    id: 'kingdom-7',
    order: 7,
    name: '暗影王座国',
    region: '极北王座',
    difficulty: '★★★★★',
    icon: '👑',
    subtitle: '邪恶军团的心脏，征服卡吉姆星球的最终决战。',
    focus: '终极 BOSS 关：集结全军，发起征服卡吉姆星球的最终决战。',
    monster: '暗影王座 · 词性至尊',
    tip: '带齐六族精锐与充足战力，方能攻克王座。',
  },
]

export const KINGDOM_GUIDE_INTRO =
  '卡吉姆星球被邪恶军团割据为七大王国，由弱到强、由易到难。逐一征服，壮大你的军团。'
