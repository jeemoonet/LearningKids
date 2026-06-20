import type { VocabWord } from './types'

const IRREGULAR_VERBS: Record<string, { past: string; pp: string }> = {
  be: { past: 'was/were', pp: 'been' },
  do: { past: 'did', pp: 'done' },
  go: { past: 'went', pp: 'gone' },
  have: { past: 'had', pp: 'had' },
  say: { past: 'said', pp: 'said' },
  get: { past: 'got', pp: 'got/gotten' },
  make: { past: 'made', pp: 'made' },
  know: { past: 'knew', pp: 'known' },
  think: { past: 'thought', pp: 'thought' },
  take: { past: 'took', pp: 'taken' },
  see: { past: 'saw', pp: 'seen' },
  come: { past: 'came', pp: 'come' },
  give: { past: 'gave', pp: 'given' },
  find: { past: 'found', pp: 'found' },
  tell: { past: 'told', pp: 'told' },
  become: { past: 'became', pp: 'become' },
  leave: { past: 'left', pp: 'left' },
  feel: { past: 'felt', pp: 'felt' },
  bring: { past: 'brought', pp: 'brought' },
  begin: { past: 'began', pp: 'begun' },
  keep: { past: 'kept', pp: 'kept' },
  hold: { past: 'held', pp: 'held' },
  write: { past: 'wrote', pp: 'written' },
  stand: { past: 'stood', pp: 'stood' },
  hear: { past: 'heard', pp: 'heard' },
  let: { past: 'let', pp: 'let' },
  mean: { past: 'meant', pp: 'meant' },
  set: { past: 'set', pp: 'set' },
  meet: { past: 'met', pp: 'met' },
  run: { past: 'ran', pp: 'run' },
  pay: { past: 'paid', pp: 'paid' },
  sit: { past: 'sat', pp: 'sat' },
  speak: { past: 'spoke', pp: 'spoken' },
  lie: { past: 'lay', pp: 'lain' },
  lead: { past: 'led', pp: 'led' },
  read: { past: 'read', pp: 'read' },
  grow: { past: 'grew', pp: 'grown' },
  lose: { past: 'lost', pp: 'lost' },
  fall: { past: 'fell', pp: 'fallen' },
  send: { past: 'sent', pp: 'sent' },
  build: { past: 'built', pp: 'built' },
  spend: { past: 'spent', pp: 'spent' },
  cut: { past: 'cut', pp: 'cut' },
  put: { past: 'put', pp: 'put' },
  break: { past: 'broke', pp: 'broken' },
  wear: { past: 'wore', pp: 'worn' },
  choose: { past: 'chose', pp: 'chosen' },
  buy: { past: 'bought', pp: 'bought' },
  teach: { past: 'taught', pp: 'taught' },
  catch: { past: 'caught', pp: 'caught' },
  draw: { past: 'drew', pp: 'drawn' },
  drive: { past: 'drove', pp: 'driven' },
  eat: { past: 'ate', pp: 'eaten' },
  fly: { past: 'flew', pp: 'flown' },
  forget: { past: 'forgot', pp: 'forgotten' },
  hide: { past: 'hid', pp: 'hidden' },
  hit: { past: 'hit', pp: 'hit' },
  hurt: { past: 'hurt', pp: 'hurt' },
  lend: { past: 'lent', pp: 'lent' },
  light: { past: 'lit', pp: 'lit' },
  sell: { past: 'sold', pp: 'sold' },
  shoot: { past: 'shot', pp: 'shot' },
  sing: { past: 'sang', pp: 'sung' },
  sleep: { past: 'slept', pp: 'slept' },
  swim: { past: 'swam', pp: 'swum' },
  throw: { past: 'threw', pp: 'thrown' },
  wake: { past: 'woke', pp: 'woken' },
  win: { past: 'won', pp: 'won' },
  // 中考常考不规则动词补充
  beat: { past: 'beat', pp: 'beaten' },
  bear: { past: 'bore', pp: 'born/borne' },
  blow: { past: 'blew', pp: 'blown' },
  rise: { past: 'rose', pp: 'risen' },
  bind: { past: 'bound', pp: 'bound' },
  wind: { past: 'wound', pp: 'wound' },
  cost: { past: 'cost', pp: 'cost' },
  spread: { past: 'spread', pp: 'spread' },
  shine: { past: 'shone', pp: 'shone' },
  hang: { past: 'hung', pp: 'hung' },
  stick: { past: 'stuck', pp: 'stuck' },
  strike: { past: 'struck', pp: 'struck' },
  shake: { past: 'shook', pp: 'shaken' },
  steal: { past: 'stole', pp: 'stolen' },
  tear: { past: 'tore', pp: 'torn' },
  swear: { past: 'swore', pp: 'sworn' },
  drink: { past: 'drank', pp: 'drunk' },
  ring: { past: 'rang', pp: 'rung' },
  sink: { past: 'sank', pp: 'sunk' },
  freeze: { past: 'froze', pp: 'frozen' },
  bite: { past: 'bit', pp: 'bitten' },
  fight: { past: 'fought', pp: 'fought' },
  seek: { past: 'sought', pp: 'sought' },
}

const IRREGULAR_NOUNS: Record<string, string> = {
  child: 'children',
  man: 'men',
  woman: 'women',
  foot: 'feet',
  tooth: 'teeth',
  mouse: 'mice',
  goose: 'geese',
  person: 'people',
  leaf: 'leaves',
  knife: 'knives',
  life: 'lives',
  wife: 'wives',
  wolf: 'wolves',
  half: 'halves',
  shelf: 'shelves',
  potato: 'potatoes',
  tomato: 'tomatoes',
  hero: 'heroes',
  echo: 'echoes',
  piano: 'pianos',
  photo: 'photos',
  radio: 'radios',
  zoo: 'zoos',
}

/** 短元音 + 单辅音结尾才双写（如 stop → stopped），长元音/双元音不双写（如 cheat → cheated） */
function shouldDoubleFinalConsonant(word: string): boolean {
  return /([bdfglmnprst])$/.test(word) && /[^aeiou][aeiou][bdfglmnprst]$/.test(word)
}

function regularPastTense(word: string): string {
  if (word.endsWith('ie')) return `${word.slice(0, -2)}ied`
  if (word.endsWith('e')) return `${word}d`
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ied`
  if (shouldDoubleFinalConsonant(word)) {
    const last = word[word.length - 1]
    return `${word}${last}ed`
  }
  return `${word}ed`
}

function regularPastParticiple(word: string): string {
  return regularPastTense(word)
}

function presentParticiple(word: string): string {
  if (word.endsWith('ie')) return `${word.slice(0, -2)}ying`
  if (word.endsWith('e') && !word.endsWith('ee')) return `${word.slice(0, -1)}ing`
  if (shouldDoubleFinalConsonant(word)) {
    const last = word[word.length - 1]
    return `${word}${last}ing`
  }
  return `${word}ing`
}

function regularPlural(word: string): string {
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('ch') || word.endsWith('sh')) {
    return `${word}es`
  }
  if (word.endsWith('f')) return `${word.slice(0, -1)}ves`
  if (word.endsWith('fe')) return `${word.slice(0, -2)}ves`
  return `${word}s`
}

export interface VerbTenses {
  base: string
  past: string
  pastParticiple: string
  presentParticiple: string
}

export function getVerbTenses(word: string): VerbTenses | null {
  const lower = word.toLowerCase()
  const irregular = IRREGULAR_VERBS[lower]
  if (irregular) {
    return {
      base: lower,
      past: irregular.past,
      pastParticiple: irregular.pp,
      presentParticiple: presentParticiple(lower),
    }
  }
  return {
    base: lower,
    past: regularPastTense(lower),
    pastParticiple: regularPastParticiple(lower),
    presentParticiple: presentParticiple(lower),
  }
}

export function getNounPlural(word: string): string | null {
  const lower = word.toLowerCase()
  if (IRREGULAR_NOUNS[lower]) return IRREGULAR_NOUNS[lower]
  return regularPlural(lower)
}

/** 动词时态一行展示：take → took → taken → taking */
export function formatVerbTensesLine(tenses: VerbTenses): string {
  return `${tenses.base} → ${tenses.past} → ${tenses.pastParticiple} → ${tenses.presentParticiple}`
}

export function getRelatedRootWords(word: VocabWord): string[] {
  return [word.similar1, word.similar2, word.similar3].filter(Boolean)
}

export function getThreeExamples(word: VocabWord): Array<{ en: string; zh: string }> {
  if (word.exampleEn) {
    return [{ en: word.exampleEn, zh: word.exampleZh || '' }]
  }
  return []
}
