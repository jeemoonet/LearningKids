export interface PrepSentenceTemplate {
  sentence: string
  sentenceZh: string
  verbs: string[]
  /** 配对介词关卡：挖空 and / to 等连接词 */
  link?: string
}

/** 中考风格句子模板，{prep} 为挖空处 */
export const PREP_TEMPLATES: Record<string, PrepSentenceTemplate[]> = {
  at: [
    { sentence: 'The bus leaves {prep} half past seven.', sentenceZh: '公交车七点半发车。', verbs: ['leaves'] },
    { sentence: 'We have history class {prep} three every Friday.', sentenceZh: '我们每周五四点上历史课。', verbs: ['have'] },
    { sentence: 'The meeting starts {prep} nine in the morning.', sentenceZh: '会议早上九点开始。', verbs: ['starts'] },
    { sentence: 'Please hand in your homework {prep} noon.', sentenceZh: '请在中午前交作业。', verbs: ['hand'] },
  ],
  on: [
    { sentence: 'My birthday is {prep} May 8th.', sentenceZh: '我的生日是五月八日。', verbs: ['is'] },
    { sentence: 'The art show opens {prep} Sunday afternoon.', sentenceZh: '美术展周日下午开幕。', verbs: ['opens'] },
    { sentence: 'We will visit the museum {prep} June 2, 2024.', sentenceZh: '我们将在2024年6月2日参观博物馆。', verbs: ['will', 'visit'] },
    { sentence: 'The school sports day is {prep} Friday.', sentenceZh: '学校运动会在周五。', verbs: ['is'] },
  ],
  in: [
    { sentence: 'The park is quiet {prep} the evening.', sentenceZh: '公园在晚上很安静。', verbs: ['is'] },
    { sentence: 'It is a good idea to visit Beijing {prep} October.', sentenceZh: '十月来北京旅游是个好主意。', verbs: ['is'] },
    { sentence: 'Many flowers bloom {prep} spring.', sentenceZh: '许多花在春天开放。', verbs: ['bloom'] },
    { sentence: 'We read books {prep} the library every week.', sentenceZh: '我们每周在图书馆看书。', verbs: ['read'] },
  ],
  for: [
    { sentence: 'She slept {prep} eight hours last night.', sentenceZh: '她昨晚睡了八个小时。', verbs: ['slept'] },
    { sentence: 'We waited {prep} an hour at the station.', sentenceZh: '我们在车站等了一小时。', verbs: ['waited'] },
    { sentence: 'Here is a gift {prep} you.', sentenceZh: '这是送给你的礼物。', verbs: ['is'] },
    { sentence: 'The shop will be closed {prep} three days.', sentenceZh: '这家店将关闭三天。', verbs: ['will', 'be', 'closed'] },
  ],
  since: [
    { sentence: 'Dad has worked here {prep} last year.', sentenceZh: '爸爸从去年起在这里工作。', verbs: ['has', 'worked'] },
    { sentence: 'Mom has cooked here {prep} June.', sentenceZh: '妈妈从六月起在这里做饭。', verbs: ['has', 'cooked'] },
    { sentence: 'I have known Tom {prep} primary school.', sentenceZh: '我从小学就认识汤姆。', verbs: ['have', 'known'] },
  ],
  during: [
    { sentence: 'It rained {prep} the trip.', sentenceZh: '旅行期间下雨了。', verbs: ['rained'] },
    { sentence: 'Please keep quiet {prep} the exam.', sentenceZh: '考试期间请保持安静。', verbs: ['keep'] },
    { sentence: 'The game stopped {prep} the rain.', sentenceZh: '比赛因雨中止。', verbs: ['stopped'] },
  ],
  through: [
    { sentence: 'The lights stayed on {prep} the storm.', sentenceZh: '暴风雨中灯一直亮着。', verbs: ['stayed'] },
    { sentence: 'Fans stayed {prep} the last minute.', sentenceZh: '球迷坚持到最后一分钟。', verbs: ['stayed'] },
    { sentence: 'We worked {prep} the night.', sentenceZh: '我们通宵工作。', verbs: ['worked'] },
  ],
  before: [
    { sentence: 'Wash your hands {prep} lunch.', sentenceZh: '午饭前洗手。', verbs: ['Wash'] },
    { sentence: 'Brush your teeth {prep} bed.', sentenceZh: '睡前刷牙。', verbs: ['Brush'] },
    { sentence: 'Finish your homework {prep} dinner.', sentenceZh: '晚饭前完成作业。', verbs: ['Finish'] },
  ],
  after: [
    { sentence: 'Tom called me {prep} the game.', sentenceZh: '汤姆赛后给我打了电话。', verbs: ['called'] },
    { sentence: 'We went home {prep} class.', sentenceZh: '下课后我们回了家。', verbs: ['went'] },
    { sentence: 'Send the photo {prep} five o\'clock.', sentenceZh: '五点后把照片发给我。', verbs: ['Send'] },
  ],
  by: [
    { sentence: 'The shop closes {prep} nine tonight.', sentenceZh: '商店今晚九点前关门。', verbs: ['closes'] },
    { sentence: 'Please finish the report {prep} Friday.', sentenceZh: '请在周五前完成报告。', verbs: ['finish'] },
    { sentence: 'The work must be done {prep} six.', sentenceZh: '这项工作必须在六点前完成。', verbs: ['must', 'be', 'done'] },
  ],
  from: [
    { sentence: 'The bus runs {prep} seven to ten.', sentenceZh: '公交车从七点到十点运行。', verbs: ['runs'] },
    { sentence: 'Class runs {prep} nine to three.', sentenceZh: '课程从九点到三点。', verbs: ['runs'] },
    { sentence: 'I walk to school {prep} home every day.', sentenceZh: '我每天从家步行上学。', verbs: ['walk'] },
  ],
  to: [
    { sentence: 'It is a quarter {prep} ten now.', sentenceZh: '现在差一刻十点。', verbs: ['is'] },
    { sentence: 'The film starts at twenty {prep} seven.', sentenceZh: '电影七点二十开始。', verbs: ['starts'] },
    { sentence: 'We stayed {prep} midnight.', sentenceZh: '我们一直待到午夜。', verbs: ['stayed'] },
  ],
  past: [
    { sentence: 'The bell rings at ten {prep} nine.', sentenceZh: '铃声响，现在九点十分。', verbs: ['rings'] },
    { sentence: 'It is half {prep} eight.', sentenceZh: '现在八点半。', verbs: ['is'] },
    { sentence: 'The train leaves at five {prep} six.', sentenceZh: '火车六点过五分发车。', verbs: ['leaves'] },
  ],
  around: [
    { sentence: 'Lunch starts {prep} twelve.', sentenceZh: '午饭大约十二点开始。', verbs: ['starts'] },
    { sentence: 'Dinner is {prep} seven.', sentenceZh: '晚饭大约七点。', verbs: ['is'] },
    { sentence: 'We will meet {prep} three this afternoon.', sentenceZh: '我们今天下午大约三点见面。', verbs: ['will', 'meet'] },
  ],
  over: [
    { sentence: 'We visit grandma {prep} the weekend.', sentenceZh: '我们整个周末去看奶奶。', verbs: ['visit'] },
    { sentence: 'They stayed home {prep} Christmas.', sentenceZh: '他们圣诞节期间待在家里。', verbs: ['stayed'] },
    { sentence: 'He read books {prep} the holiday.', sentenceZh: '他假期期间一直在读书。', verbs: ['read'] },
  ],
  between: [
    { sentence: 'No phones {prep} nine and three.', sentenceZh: '九点到三点之间不许用手机。', verbs: [] },
    { sentence: 'We nap {prep} one and two.', sentenceZh: '我们在一点到两点之间小睡。', verbs: ['nap'] },
    { sentence: 'The shop is open {prep} Monday and Friday.', sentenceZh: '商店周一到周五营业。', verbs: ['is', 'open'] },
  ],
  behind: [
    { sentence: 'The cat is {prep} the door.', sentenceZh: '猫在门后面。', verbs: ['is'] },
    { sentence: 'The bookshelf is {prep} the teacher.', sentenceZh: '书架在老师身后。', verbs: ['is'] },
    { sentence: 'A tall boy stood {prep} me in line.', sentenceZh: '排队时一个高个男孩站在我后面。', verbs: ['stood'] },
  ],
  into: [
    { sentence: 'She walked {prep} the classroom quietly.', sentenceZh: '她安静地走进了教室。', verbs: ['walked'] },
    { sentence: 'The cat jumped {prep} the box.', sentenceZh: '猫跳进了箱子里。', verbs: ['jumped'] },
    { sentence: 'Put the milk {prep} the fridge.', sentenceZh: '把牛奶放进冰箱。', verbs: ['Put'] },
  ],
  off: [
    { sentence: 'The cat jumped {prep} the chair.', sentenceZh: '猫从椅子上跳了下来。', verbs: ['jumped'] },
    { sentence: 'He fell {prep} his bike.', sentenceZh: '他从自行车上摔了下来。', verbs: ['fell'] },
    { sentence: 'Please take {prep} your coat.', sentenceZh: '请脱掉你的外套。', verbs: ['take'] },
  ],
  along: [
    { sentence: 'I walk {prep} the river every morning.', sentenceZh: '我每天早上沿着河散步。', verbs: ['walk'] },
    { sentence: 'Trees grow {prep} the road.', sentenceZh: '树沿着路生长。', verbs: ['grow'] },
    { sentence: 'We ran {prep} the beach.', sentenceZh: '我们沿着海滩奔跑。', verbs: ['ran'] },
  ],
  among: [
    { sentence: 'She sat {prep} the students.', sentenceZh: '她坐在学生中间。', verbs: ['sat'] },
    { sentence: 'The house stands {prep} the trees.', sentenceZh: '房子立在树林中。', verbs: ['stands'] },
    { sentence: 'He is popular {prep} his classmates.', sentenceZh: '他在同学中很受欢迎。', verbs: ['is'] },
  ],
  of: [
    { sentence: 'A cup {prep} tea, please.', sentenceZh: '请给我一杯茶。', verbs: [] },
    { sentence: 'The capital {prep} China is Beijing.', sentenceZh: '中国的首都是北京。', verbs: ['is'] },
    { sentence: 'She is afraid {prep} dogs.', sentenceZh: '她怕狗。', verbs: ['is', 'afraid'] },
  ],
  with: [
    { sentence: 'I went to the park {prep} my friends.', sentenceZh: '我和朋友们去了公园。', verbs: ['went'] },
    { sentence: 'She cut the apple {prep} a knife.', sentenceZh: '她用刀切苹果。', verbs: ['cut'] },
    { sentence: 'Fill in the form {prep} a pen.', sentenceZh: '请用钢笔填写表格。', verbs: ['Fill'] },
  ],
  about: [
    { sentence: 'Lunch starts {prep} twelve.', sentenceZh: '午饭大约十二点开始。', verbs: ['starts'] },
    { sentence: 'Dinner is {prep} seven.', sentenceZh: '晚饭大约七点。', verbs: ['is'] },
    { sentence: 'We will meet {prep} three this afternoon.', sentenceZh: '我们今天下午大约三点见面。', verbs: ['will', 'meet'] },
    { sentence: 'The film ends {prep} nine tonight.', sentenceZh: '电影今晚大约九点结束。', verbs: ['ends'] },
  ],
  under: [
    { sentence: 'The cat hid {prep} the bed.', sentenceZh: '猫躲到了床底下。', verbs: ['hid'] },
    { sentence: 'Children {prep} twelve get free tickets.', sentenceZh: '十二岁以下儿童免票。', verbs: ['get'] },
    { sentence: 'The bridge goes {prep} the river.', sentenceZh: '桥从河下穿过。', verbs: ['goes'] },
  ],
  above: [
    { sentence: 'The plane flew {prep} the clouds.', sentenceZh: '飞机飞在云层上方。', verbs: ['flew'] },
    { sentence: 'Keep your head {prep} water.', sentenceZh: '保持头部在水面以上。', verbs: ['Keep'] },
    { sentence: 'The temperature is {prep} zero today.', sentenceZh: '今天气温在零度以上。', verbs: ['is'] },
  ],
  below: [
    { sentence: 'The village lies {prep} the hill.', sentenceZh: '村庄在山丘下方。', verbs: ['lies'] },
    { sentence: 'Do not write {prep} this line.', sentenceZh: '不要写在这条线下面。', verbs: ['write'] },
    { sentence: 'The temperature fell {prep} freezing.', sentenceZh: '气温降到了冰点以下。', verbs: ['fell'] },
  ],
  across: [
    { sentence: 'She walked {prep} the street carefully.', sentenceZh: '她小心地穿过了马路。', verbs: ['walked'] },
    { sentence: 'There is a bridge {prep} the river.', sentenceZh: '河上有一座桥。', verbs: ['is'] },
    { sentence: 'We swam {prep} the lake.', sentenceZh: '我们游过了湖。', verbs: ['swam'] },
  ],
  against: [
    { sentence: 'Do not lean {prep} the wall.', sentenceZh: '不要靠在墙上。', verbs: ['lean'] },
    { sentence: 'We played {prep} another school.', sentenceZh: '我们和另一所学校比赛。', verbs: ['played'] },
    { sentence: 'The rain beat {prep} the window.', sentenceZh: '雨点敲打着窗户。', verbs: ['beat'] },
  ],
  without: [
    { sentence: 'He left {prep} saying goodbye.', sentenceZh: '他没说再见就走了。', verbs: ['left', 'saying'] },
    { sentence: 'I cannot live {prep} music.', sentenceZh: '我不能没有音乐。', verbs: ['cannot', 'live'] },
    { sentence: 'She went out {prep} a coat.', sentenceZh: '她没穿外套就出去了。', verbs: ['went'] },
  ],
  within: [
    { sentence: 'Reply {prep} three days, please.', sentenceZh: '请在三天内回复。', verbs: ['Reply'] },
    { sentence: 'The shop is {prep} walking distance.', sentenceZh: '商店在步行距离内。', verbs: ['is'] },
    { sentence: 'Finish the work {prep} an hour.', sentenceZh: '一小时内完成这项工作。', verbs: ['Finish'] },
  ],
  beyond: [
    { sentence: 'The hills lie {prep} the river.', sentenceZh: '山丘在河的那一边。', verbs: ['lie'] },
    { sentence: 'It is {prep} my understanding.', sentenceZh: '这超出了我的理解。', verbs: ['is'] },
    { sentence: 'Do not go {prep} the gate.', sentenceZh: '不要越过大门。', verbs: ['go'] },
  ],
  inside: [
    { sentence: 'Wait {prep} the classroom.', sentenceZh: '在教室里等。', verbs: ['Wait'] },
    { sentence: 'There is a gift {prep} the box.', sentenceZh: '盒子里有一份礼物。', verbs: ['is'] },
    { sentence: 'Stay {prep} until the rain stops.', sentenceZh: '待在室内直到雨停。', verbs: ['Stay', 'stops'] },
  ],
  outside: [
    { sentence: 'The children played {prep} all afternoon.', sentenceZh: '孩子们整个下午都在外面玩。', verbs: ['played'] },
    { sentence: 'There is a garden {prep} the house.', sentenceZh: '房子外面有一个花园。', verbs: ['is'] },
    { sentence: 'Wait for me {prep} the gate.', sentenceZh: '在大门外等我。', verbs: ['Wait'] },
  ],
  toward: [
    { sentence: 'She walked {prep} the school gate.', sentenceZh: '她朝校门走去。', verbs: ['walked'] },
    { sentence: 'The ship sailed {prep} the island.', sentenceZh: '船向岛屿驶去。', verbs: ['sailed'] },
    { sentence: 'He took a step {prep} me.', sentenceZh: '他朝我迈了一步。', verbs: ['took'] },
  ],
  towards: [
    { sentence: 'They ran {prep} the finish line.', sentenceZh: '他们朝终点线跑去。', verbs: ['ran'] },
    { sentence: 'The bird flew {prep} the south.', sentenceZh: '鸟朝南飞去。', verbs: ['flew'] },
  ],
  until: [
    { sentence: 'Wait here {prep} I come back.', sentenceZh: '在这里等到我回来。', verbs: ['Wait', 'come'] },
    { sentence: 'The shop is open {prep} nine.', sentenceZh: '商店营业到九点。', verbs: ['is', 'open'] },
    { sentence: 'We stayed {prep} the show ended.', sentenceZh: '我们一直待到演出结束。', verbs: ['stayed', 'ended'] },
  ],
  ago: [
    { sentence: 'I met her two days {prep}.', sentenceZh: '我两天前遇见了她。', verbs: ['met'] },
    { sentence: 'He moved here a year {prep}.', sentenceZh: '他一年前搬到这里。', verbs: ['moved'] },
    { sentence: 'The film started ten minutes {prep}.', sentenceZh: '电影十分钟前开始了。', verbs: ['started'] },
  ],
}

/** 关卡专用模板（同词不同考点，如位置 vs 时间） */
export const PREP_LEVEL_TEMPLATES: Record<string, Record<string, PrepSentenceTemplate[]>> = {
  'pos-1': {
    at: [
      { sentence: 'We waited {prep} the bus stop.', sentenceZh: '我们在公交车站等候。', verbs: ['waited'] },
      { sentence: 'She is {prep} home now.', sentenceZh: '她现在在家。', verbs: ['is'] },
      { sentence: 'Meet me {prep} the school gate.', sentenceZh: '在校门口等我。', verbs: ['Meet'] },
      { sentence: 'The boy stood {prep} the corner.', sentenceZh: '男孩站在拐角处。', verbs: ['stood'] },
    ],
    on: [
      { sentence: 'The book is {prep} the desk.', sentenceZh: '书在课桌上。', verbs: ['is'] },
      { sentence: 'There is a map {prep} the wall.', sentenceZh: '墙上有一张地图。', verbs: ['is'] },
      { sentence: 'Don\'t write {prep} the desk.', sentenceZh: '不要在课桌上写字。', verbs: ['write'] },
      { sentence: 'The cat sat {prep} the roof.', sentenceZh: '猫坐在屋顶上。', verbs: ['sat'] },
    ],
    in: [
      { sentence: 'We read books {prep} the library.', sentenceZh: '我们在图书馆看书。', verbs: ['read'] },
      { sentence: 'Tom lives {prep} Beijing.', sentenceZh: '汤姆住在北京。', verbs: ['lives'] },
      { sentence: 'The keys are {prep} my pocket.', sentenceZh: '钥匙在我口袋里。', verbs: ['are'] },
      { sentence: 'Many fish swim {prep} the river.', sentenceZh: '许多鱼在河里游。', verbs: ['swim'] },
    ],
  },
  'hf-5': {
    on: [
      { sentence: 'The cup is {prep} the table.', sentenceZh: '杯子在桌子上。', verbs: ['is'] },
      { sentence: 'There is a picture {prep} the wall.', sentenceZh: '墙上有一幅画。', verbs: ['is'] },
      { sentence: 'Put the book {prep} the shelf.', sentenceZh: '把书放在架子上。', verbs: ['Put'] },
      { sentence: 'A bird landed {prep} the roof.', sentenceZh: '一只鸟落在屋顶上。', verbs: ['landed'] },
    ],
    above: [
      { sentence: 'The plane flew {prep} the clouds.', sentenceZh: '飞机飞在云层上方。', verbs: ['flew'] },
      { sentence: 'The lamp hangs {prep} the desk.', sentenceZh: '灯悬在课桌上方。', verbs: ['hangs'] },
      { sentence: 'Keep your head {prep} water.', sentenceZh: '保持头部在水面以上。', verbs: ['Keep'] },
      { sentence: 'The temperature is {prep} zero today.', sentenceZh: '今天气温在零度以上。', verbs: ['is'] },
    ],
    under: [
      { sentence: 'The cat hid {prep} the bed.', sentenceZh: '猫躲到了床底下。', verbs: ['hid'] },
      { sentence: 'The ball rolled {prep} the chair.', sentenceZh: '球滚到了椅子下面。', verbs: ['rolled'] },
      { sentence: 'We sat {prep} a big tree.', sentenceZh: '我们坐在一棵大树下。', verbs: ['sat'] },
      { sentence: 'The bridge goes {prep} the road.', sentenceZh: '桥从路下穿过。', verbs: ['goes'] },
    ],
    below: [
      { sentence: 'Do not write {prep} this line.', sentenceZh: '不要写在这条线下面。', verbs: ['write'] },
      { sentence: 'The village lies {prep} the hill.', sentenceZh: '村庄在山丘下方。', verbs: ['lies'] },
      { sentence: 'The temperature fell {prep} freezing.', sentenceZh: '气温降到了冰点以下。', verbs: ['fell'] },
      { sentence: 'Children {prep} twelve get free tickets.', sentenceZh: '十二岁以下儿童免票。', verbs: ['get'] },
    ],
  },
  'more-2': {
    across: [
      { sentence: 'She walked {prep} the street carefully.', sentenceZh: '她小心地穿过了马路。', verbs: ['walked'] },
      { sentence: 'We swam {prep} the lake.', sentenceZh: '我们游过了湖。', verbs: ['swam'] },
      { sentence: 'He ran {prep} the playground.', sentenceZh: '他跑过了操场。', verbs: ['ran'] },
      { sentence: 'They drove {prep} the bridge.', sentenceZh: '他们开车过了桥。', verbs: ['drove'] },
    ],
    over: [
      { sentence: 'There is a bridge {prep} the river.', sentenceZh: '河上有一座桥。', verbs: ['is'] },
      { sentence: 'He jumped {prep} the fence.', sentenceZh: '他跳过了栅栏。', verbs: ['jumped'] },
      { sentence: 'The plane flew {prep} the city.', sentenceZh: '飞机从城市上空飞过。', verbs: ['flew'] },
      { sentence: 'A bird flew {prep} the roof.', sentenceZh: '一只鸟从屋顶上方飞过。', verbs: ['flew'] },
    ],
    through: [
      { sentence: 'We walked {prep} the tunnel.', sentenceZh: '我们穿过了隧道。', verbs: ['walked'] },
      { sentence: 'The road goes {prep} the forest.', sentenceZh: '这条路穿过森林。', verbs: ['goes'] },
      { sentence: 'Light came in {prep} the window.', sentenceZh: '光从窗户照进来。', verbs: ['came'] },
      { sentence: 'He ran {prep} the crowd.', sentenceZh: '他穿过了人群。', verbs: ['ran'] },
    ],
  },
  'pos-2': {
    out: [
      { sentence: 'Let\'s go {prep} after dinner.', sentenceZh: '晚饭后我们出去吧。', verbs: ['go'] },
      { sentence: 'She walked {prep} of the classroom quietly.', sentenceZh: '她悄悄走出了教室。', verbs: ['walked'] },
      { sentence: 'We ran {prep} to catch the bus.', sentenceZh: '我们跑出去赶公交车。', verbs: ['ran'] },
      { sentence: 'The lights went {prep} during the storm.', sentenceZh: '暴风雨中灯灭了。', verbs: ['went'] },
    ],
    off: [
      { sentence: 'Please take {prep} your coat.', sentenceZh: '请脱掉外套。', verbs: ['take'] },
      { sentence: 'Get {prep} at the next stop, please.', sentenceZh: '请在下一站下车。', verbs: ['Get'] },
      { sentence: 'He fell {prep} his bike.', sentenceZh: '他从自行车上摔了下来。', verbs: ['fell'] },
      { sentence: 'Turn {prep} the light when you leave.', sentenceZh: '离开时请关灯。', verbs: ['Turn'] },
      { sentence: 'They set {prep} early in the morning.', sentenceZh: '他们一大早就出发了。', verbs: ['set'] },
    ],
  },
  'pos-3': {
    in: [
      { sentence: 'The keys are {prep} my pocket.', sentenceZh: '钥匙在我口袋里。', verbs: ['are'] },
      { sentence: 'We live {prep} a small town.', sentenceZh: '我们住在一个小镇里。', verbs: ['live'] },
      { sentence: 'There is a cat {prep} the box.', sentenceZh: '盒子里有一只猫。', verbs: ['is'] },
      { sentence: 'Tom waits {prep} the classroom.', sentenceZh: '汤姆在教室里等。', verbs: ['waits'] },
    ],
    inside: [
      { sentence: 'Wait {prep} the classroom, please.', sentenceZh: '请在教室里等。', verbs: ['Wait'] },
      { sentence: 'The gift is {prep} the bag.', sentenceZh: '礼物在包里。', verbs: ['is'] },
      { sentence: 'They sat {prep} the tent.', sentenceZh: '他们坐在帐篷里。', verbs: ['sat'] },
      { sentence: 'Keep warm {prep} the house.', sentenceZh: '在屋里保暖。', verbs: ['Keep'] },
    ],
    out: [
      { sentence: 'Let\'s go {prep} and play.', sentenceZh: '我们出去玩吧。', verbs: ['go'] },
      { sentence: 'She went {prep} to buy milk.', sentenceZh: '她出去买牛奶了。', verbs: ['went'] },
      { sentence: 'Come {prep} here, please.', sentenceZh: '请出来。', verbs: ['Come'] },
      { sentence: 'The children ran {prep} to the yard.', sentenceZh: '孩子们跑到院子里去了。', verbs: ['ran'] },
    ],
    outside: [
      { sentence: 'Go {prep} and wait for me.', sentenceZh: '到外面等我。', verbs: ['Go'] },
      { sentence: 'They played {prep} all afternoon.', sentenceZh: '他们整个下午都在外面玩。', verbs: ['played'] },
      { sentence: 'We eat {prep} when it\'s sunny.', sentenceZh: '天晴时我们在外面吃饭。', verbs: ['eat'] },
      { sentence: 'Stay {prep} the gate until I come.', sentenceZh: '在大门外等到我来。', verbs: ['Stay'] },
    ],
    'out of': [
      { sentence: 'She ran {prep} the classroom.', sentenceZh: '她跑出了教室。', verbs: ['ran'] },
      { sentence: 'He took the book {prep} the bag.', sentenceZh: '他把书从包里拿出来。', verbs: ['took'] },
      { sentence: 'We climbed {prep} the cave.', sentenceZh: '我们爬出了洞穴。', verbs: ['climbed'] },
      { sentence: 'Get {prep} the car now.', sentenceZh: '现在下车。', verbs: ['Get'] },
    ],
  },
  'more-1': {
    with: [
      { sentence: 'I went to the park {prep} my friends.', sentenceZh: '我和朋友们去了公园。', verbs: ['went'] },
      { sentence: 'She writes {prep} a blue pen.', sentenceZh: '她用蓝笔写字。', verbs: ['writes'] },
      { sentence: 'Can you help me {prep} this box?', sentenceZh: '你能帮我搬这个箱子吗？', verbs: ['help'] },
    ],
    without: [
      { sentence: 'He left {prep} saying goodbye.', sentenceZh: '他没说再见就走了。', verbs: ['left', 'saying'] },
      { sentence: 'She went out {prep} a coat.', sentenceZh: '她没穿外套就出去了。', verbs: ['went'] },
      { sentence: 'I cannot live {prep} music.', sentenceZh: '我不能没有音乐。', verbs: ['cannot', 'live'] },
    ],
    by: [
      { sentence: 'We travel {prep} bus every day.', sentenceZh: '我们每天乘公交出行。', verbs: ['travel'] },
      { sentence: 'The letter was written {prep} Tom.', sentenceZh: '这封信是汤姆写的。', verbs: ['was', 'written'] },
      { sentence: 'Please pay {prep} card.', sentenceZh: '请用卡支付。', verbs: ['pay'] },
    ],
  },
  'more-4': {
    for: [
      { sentence: 'Here is a gift {prep} you.', sentenceZh: '这是送给你的礼物。', verbs: ['is'] },
      { sentence: 'We study hard {prep} the exam.', sentenceZh: '我们为考试努力学习。', verbs: ['study'] },
      { sentence: 'This letter is {prep} Mr. Wang.', sentenceZh: '这封信是给王先生的。', verbs: ['is'] },
    ],
    against: [
      { sentence: 'Do not lean {prep} the wall.', sentenceZh: '不要靠在墙上。', verbs: ['lean'] },
      { sentence: 'We played {prep} another school.', sentenceZh: '我们和另一所学校比赛。', verbs: ['played'] },
      { sentence: 'The rain beat {prep} the window.', sentenceZh: '雨点敲打着窗户。', verbs: ['beat'] },
    ],
  },
  'more-5': {
    'between...and': [
      {
        sentence: 'We nap between one {link} two.',
        sentenceZh: '我们在一点到两点之间小睡。',
        verbs: ['nap'],
        link: 'and',
      },
      {
        sentence: 'No phones between nine {link} three.',
        sentenceZh: '九点到三点之间不许用手机。',
        verbs: [],
        link: 'and',
      },
      {
        sentence: 'The shop is open between Monday {link} Friday.',
        sentenceZh: '商店周一到周五营业。',
        verbs: ['is', 'open'],
        link: 'and',
      },
      {
        sentence: 'The ball rolled between the chair {link} the desk.',
        sentenceZh: '球滚到了椅子和课桌之间。',
        verbs: ['rolled'],
        link: 'and',
      },
    ],
    'from...to': [
      {
        sentence: 'The bus runs from seven {link} ten.',
        sentenceZh: '公交车从七点到十点运行。',
        verbs: ['runs'],
        link: 'to',
      },
      {
        sentence: 'We study from Monday {link} Friday.',
        sentenceZh: '我们从周一学到周五。',
        verbs: ['study'],
        link: 'to',
      },
      {
        sentence: 'The path goes from the gate {link} the lake.',
        sentenceZh: '小路从大门通向湖边。',
        verbs: ['goes'],
        link: 'to',
      },
      {
        sentence: 'The shop is open from 8 a.m. {link} 6 p.m.',
        sentenceZh: '商店从早8点营业到晚6点。',
        verbs: ['is', 'open'],
        link: 'to',
      },
    ],
  },
}

/** 模板动词词表，供短文/例句题自动匹配 */
export const PREP_TEMPLATE_VERB_LEXICON = [
  ...new Set(
    [
      ...Object.values(PREP_TEMPLATES),
      ...Object.values(PREP_LEVEL_TEMPLATES).flatMap((level) => Object.values(level)),
    ].flatMap((items) =>
      items.flatMap((item) => item.verbs.map((verb) => verb.toLowerCase())),
    ),
  ),
]
