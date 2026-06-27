export interface GameplayStep {
  icon: string
  title: string
  summary: string
  detail: string
}

export const GAMEPLAY_HOOK =
  '每个单词都是一名士兵——叫得出名字，拼得对字母，造得出句子，他们才肯跟你走。'

export const GAMEPLAY_STEPS: GameplayStep[] = [
  {
    icon: '🚀',
    title: '登舰出发',
    summary: '先备好约 100 名勇士，再选王国踏上征途。',
    detail: '战斗力 = 军团人数，经验值 = 熟悉程度。词越多、越熟，远征越稳。',
  },
  {
    icon: '➡️',
    title: '逐格前进',
    summary: '在王国地图上点击前进箭头，队伍沿路径一格一格推进。',
    detail: '每站必经关卡——村庄、城堡或山谷，通关后才能继续下一站。',
  },
  {
    icon: '🏘️',
    title: '招募村庄',
    summary: '认对词义、造对句子，村民才会加入军团。',
    detail: '四选一认词 → 三道造句填空。全部通关，战斗力立刻 +N！',
  },
  {
    icon: '🏰',
    title: '城堡 BOSS',
    summary: '选一名武士出战，拼写发射，击破怪兽的封印。',
    detail: 'BOSS 有词性属性——派出「相生」的士兵，伤害 +20%；同族出战则 -20%。',
  },
  {
    icon: '⛰️',
    title: '复习山谷',
    summary: '帮走散的士兵找回名字，别让熟悉度掉链子。',
    detail: '认词巩固，提升经验。久未复习的士兵，可能会悄悄离开哦。',
  },
  {
    icon: '🏆',
    title: '逐国征服',
    summary: '打通一国的全部关卡，解锁下一王国。',
    detail: '从微光村国出发，由易到难，七大王国等你来插旗。',
  },
]

export const GAMEPLAY_TIPS = [
  '形容词克名词，副词克动词——语法关系就是战斗加成。',
  '音节越多等级越高，动词武士天生更猛。',
  'BOSS 战输了可以重来，已有士兵不会丢。',
]
