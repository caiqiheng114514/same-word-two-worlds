/* 同词异义 · 港陆词语小游戏 — 题库（自动生成，请勿手改）
 *
 * 数据源：data/questions.pipe.txt（竖线分隔，可直接粘进飞书表格 / Excel）
 * 重新生成：node tools/pipe-to-words.mjs
 * 自检：    node tools/check-words.mjs
 *
 * 字段：id word mode scene stem options answer why tip level audio art source
 *       seq / stage / stageName = 关卡顺序（来自难度曲线表）
 */
window.__QUESTIONS__ = [
  {
    id: "dishi-m1-01", word: "的士", mode: "m1",
    seq: 1, stage: 1, stageName: "热身", level: 1,
    scene: "香港路边有人喊“截的士”。",
    stem: "“的士”是什么？",
    options: ["出租车", "公交车", "地铁"],
    answer: 0,
    why: "的士是taxi音译，指出租车。",
    tip: "的士=出租车。",
    audio: "", art: "红色出租车停路边", source: "待刘博康双来源核对"
  },
  {
    id: "xuegui-m1-01", word: "雪柜", mode: "m1",
    seq: 2, stage: 1, stageName: "热身", level: 1,
    scene: "香港朋友说“雪柜有汽水”。",
    stem: "“雪柜”指什么？",
    options: ["冰箱", "冰柜", "空调"],
    answer: 0,
    why: "香港雪柜就是冰箱。",
    tip: "雪柜就是冰箱。",
    audio: "", art: "厨房里的冰箱", source: "待刘博康双来源核对"
  },
  {
    id: "yincha-m1-01", word: "饮茶", mode: "m1",
    seq: 3, stage: 1, stageName: "热身", level: 1,
    scene: "同事说“周末去饮茶”。",
    stem: "“饮茶”最可能是什么？",
    options: ["只喝一杯茶", "去茶楼吃点心", "去喝酒"],
    answer: 1,
    why: "香港饮茶指上茶楼吃点心。",
    tip: "饮茶=茶楼吃点心。",
    audio: "", art: "茶楼蒸笼点心", source: "待刘博康双来源核对"
  },
  {
    id: "lishi-m1-01", word: "利是", mode: "m1",
    seq: 4, stage: 2, stageName: "高频", level: 1,
    scene: "香港老板开工说“派利是”。",
    stem: "“利是”是什么？",
    options: ["红包", "工资", "通知"],
    answer: 0,
    why: "利是即红包，粤语常用。",
    tip: "利是=红包。",
    audio: "", art: "红色小信封", source: "待刘博康双来源核对"
  },
  {
    id: "shiduo-m1-01", word: "士多", mode: "m1",
    seq: 5, stage: 2, stageName: "高频", level: 1,
    scene: "香港街边招牌写“士多”。",
    stem: "“士多”是什么店？",
    options: ["家具店", "零食杂货店", "药店"],
    answer: 1,
    why: "士多是store音译，指小杂货店。",
    tip: "士多是杂货店。",
    audio: "", art: "街边小杂货店", source: "待刘博康双来源核对"
  },
  {
    id: "fanggong-m1-01", word: "返工", mode: "m1",
    seq: 6, stage: 2, stageName: "高频", level: 2,
    scene: "香港同事下班前说“我今晚返工，唔使等我食饭”。",
    stem: "他说的“返工”是什么意思？",
    options: ["重做一遍", "回去上班", "今晚加班"],
    answer: 1,
    why: "香港“返工”指上班，内地多指重做。",
    tip: "“返工”=上班，别听成重做。",
    audio: "建议粤语", art: "夜里亮着灯的写字楼", source: "待刘博康双来源核对"
  },
  {
    id: "banfang-m1-01", word: "班房", mode: "m1",
    seq: 7, stage: 2, stageName: "高频", level: 2,
    scene: "香港老师说“返班房拿课本”。",
    stem: "“班房”最可能指？",
    options: ["监狱", "教室", "办公室"],
    answer: 1,
    why: "香港班房指教室，内地多指监狱。",
    tip: "班房是教室，不是监房。",
    audio: "", art: "课室里摆着课本", source: "待刘博康双来源核对"
  },
  {
    id: "dixia-m1-01", word: "地下/一楼", mode: "m1",
    seq: 8, stage: 2, stageName: "高频", level: 2,
    scene: "香港商场指示牌写“地下”。",
    stem: "“地下”指哪一层？",
    options: ["地底商场", "地面层", "地下停车场"],
    answer: 1,
    why: "香港G/F叫地下，指地面层。",
    tip: "香港“地下”=地面层。",
    audio: "", art: "商场楼层指示牌", source: "待刘博康双来源核对"
  },
  {
    id: "jiwu-m1-01", word: "吉屋", mode: "m1",
    seq: 9, stage: 2, stageName: "高频", level: 2,
    scene: "地产广告写“吉屋出租”。",
    stem: "在香港“吉屋”指？",
    options: ["风水好的房", "空置房", "凶宅"],
    answer: 1,
    why: "香港用“吉”避“空”，吉屋即空屋。",
    tip: "吉屋=空屋，不是好风水。",
    audio: "", art: "空置的单位门口", source: "待刘博康双来源核对"
  },
  {
    id: "zhuli-m1-01", word: "猪脷", mode: "m1",
    seq: 10, stage: 3, stageName: "敏感", level: 2,
    scene: "香港菜单写“猪脷”。",
    stem: "“猪脷”是什么？",
    options: ["猪肝", "猪耳朵", "猪舌头"],
    answer: 2,
    why: "粤语“脷”指舌，猪脷即猪舌。",
    tip: "猪脷是猪舌，不是猪利。",
    audio: "建议粤语", art: "菜市场猪舌特写", source: "待刘博康双来源核对"
  },
  {
    id: "guoshen-m1-01", word: "过身", mode: "m1",
    seq: 11, stage: 3, stageName: "敏感", level: 3,
    scene: "香港同事说“他爸爸旧年过身”。",
    stem: "“过身”是什么意思？",
    options: ["去世", "经过", "搬家"],
    answer: 0,
    why: "粤语过身指去世，不是经过。",
    tip: "过身是去世，别追问。",
    audio: "建议粤语", art: "安静的白色菊花", source: "待刘博康双来源核对"
  },
  {
    id: "bojin-m1-01", word: "帛金", mode: "m1",
    seq: 12, stage: 3, stageName: "敏感", level: 3,
    scene: "香港同事家办丧事。",
    stem: "“帛金”是什么钱？",
    options: ["结婚礼金", "丧事礼金", "生日红包"],
    answer: 1,
    why: "帛金用于丧事，不是喜事。",
    tip: "帛金是白事礼金。",
    audio: "建议粤语", art: "白色信封与素色花", source: "待刘博康双来源核对"
  },
  {
    id: "yincha-m2-01", word: "饮茶", mode: "m2",
    seq: 13, stage: 4, stageName: "当场处理", level: 1,
    scene: "同事说“周日去饮茶”。",
    stem: "最得体的回应是哪句？",
    options: ["“好，去茶楼吃点心。”", "“只喝茶不吃饭吗？”", "“饮茶是喝酒吗？”"],
    answer: 0,
    why: "饮茶是茶楼吃点心，先接住事实。",
    tip: "饮茶是茶楼点心。",
    audio: "", art: "茶楼圆桌与点心", source: "待刘博康双来源核对"
  },
  {
    id: "banfang-m2-01", word: "班房", mode: "m2",
    seq: 14, stage: 4, stageName: "当场处理", level: 2,
    scene: "香港同事说“我去班房拿本子”。",
    stem: "最得体的回应是哪句？",
    options: ["“你怎么进监狱？”", "“好，你去教室拿吧。”", "“班房不是监房吗？”"],
    answer: 1,
    why: "香港班房指教室，别接成监狱。",
    tip: "班房是教室。",
    audio: "", art: "课室门口拿本子", source: "待刘博康双来源核对"
  },
  {
    id: "jiwu-m2-01", word: "吉屋", mode: "m2",
    seq: 15, stage: 4, stageName: "当场处理", level: 2,
    scene: "地产说“这间吉屋出租”。",
    stem: "最得体的追问是哪句？",
    options: ["“请问是空置房吗？”", "“风水很好吗？”", "“是凶宅吗？”"],
    answer: 0,
    why: "吉屋是空屋，先确认空置。",
    tip: "吉屋是空屋。",
    audio: "", art: "空置单位看房", source: "待刘博康双来源核对"
  },
  {
    id: "zhuli-m2-01", word: "猪脷", mode: "m2",
    seq: 16, stage: 4, stageName: "当场处理", level: 2,
    scene: "香港朋友请你吃“猪脷”。",
    stem: "最得体的回应是哪句？",
    options: ["“猪脷是不是猪利？”", "“谢谢，我尝尝猪舌。”", "“吃舌头好恶心。”"],
    answer: 1,
    why: "猪脷即猪舌，先尝再问。",
    tip: "猪脷是猪舌。",
    audio: "建议粤语", art: "餐桌上的猪舌菜", source: "待刘博康双来源核对"
  },
  {
    id: "guoshen-m2-01", word: "过身", mode: "m2",
    seq: 17, stage: 4, stageName: "当场处理", level: 3,
    scene: "同事说“我阿爷旧年过身”。",
    stem: "最得体的回应是哪句？",
    options: ["“过身？是不是搬家？”", "“你怎么不早说？”", "“哦，他去世了，节哀。”"],
    answer: 2,
    why: "过身是去世，先确认并简短节哀。",
    tip: "过身是去世，节哀。",
    audio: "建议粤语", art: "素色卡片与白花", source: "待刘博康双来源核对"
  },
  {
    id: "bojin-m2-01", word: "帛金", mode: "m2",
    seq: 18, stage: 4, stageName: "当场处理", level: 3,
    scene: "同事家办丧事，你要表示心意。",
    stem: "最得体的说法是哪句？",
    options: ["“帛金我转给你，节哀。”", "“帛金是不是结婚红包？”", "“你们家喜事啊？”"],
    answer: 0,
    why: "帛金是丧事礼金，别问喜事。",
    tip: "帛金是白事礼金。",
    audio: "建议粤语", art: "白色信封双手递出", source: "待刘博康双来源核对"
  },
  {
    id: "fanggong-m3-01", word: "返工", mode: "m3",
    seq: 19, stage: 5, stageName: "改口", level: 2,
    scene: "原话：“你们把上班叫返工，真奇怪。”",
    stem: "哪句改口最得体？",
    options: ["“香港‘返工’指上班，内地多指重做。”", "“你们这样说很奇怪。”", "“我懂，返工就是重做。”"],
    answer: 0,
    why: "只陈述两地词义，不评价奇怪。",
    tip: "说事实，不说奇怪。",
    audio: "建议粤语", art: "两地办公室对比", source: "待刘博康双来源核对"
  },
  {
    id: "banfang-m3-01", word: "班房", mode: "m3",
    seq: 20, stage: 5, stageName: "改口", level: 2,
    scene: "原话：“班房不是监狱吗，你们好奇怪。”",
    stem: "哪句改口最得体？",
    options: ["“班房就是监狱，你们错了。”", "“香港‘班房’指教室，内地多指监狱。”", "“说班房是教室很奇怪。”"],
    answer: 1,
    why: "说清两地差异，不评判对错。",
    tip: "班房在港指教室。",
    audio: "", art: "教室与监房图标对比", source: "待刘博康双来源核对"
  },
  {
    id: "dixia-m3-01", word: "地下/一楼", mode: "m3",
    seq: 21, stage: 5, stageName: "改口", level: 2,
    scene: "原话：“地下怎么会是一楼，太乱了。”",
    stem: "哪句改口最得体？",
    options: ["“香港G/F叫地下，对应内地一楼。”", "“地下就是地底，你们乱说。”", "“一楼在地下很奇怪。”"],
    answer: 0,
    why: "用楼层对应解释，不评价乱。",
    tip: "香港地下=地面层。",
    audio: "", art: "楼层G/F与1/F指示", source: "待刘博康双来源核对"
  },
  {
    id: "zhuli-m3-01", word: "猪脷", mode: "m3",
    seq: 22, stage: 5, stageName: "改口", level: 2,
    scene: "原话：“猪脷这名字好恶心。”",
    stem: "哪句改口最得体？",
    options: ["“这名字真恶心。”", "“你们怎么吃舌头。”", "“粤语里‘脷’指舌头，所以猪脷是猪舌。”"],
    answer: 2,
    why: "解释“脷”是舌，不评价名字。",
    tip: "解释“脷”是舌。",
    audio: "建议粤语", art: "“脷”字与猪舌图", source: "待刘博康双来源核对"
  },
  {
    id: "guoshen-m3-01", word: "过身", mode: "m3",
    seq: 23, stage: 5, stageName: "改口", level: 3,
    scene: "原话：“你们说过身太不尊重了。”",
    stem: "哪句改口最得体？",
    options: ["“粤语‘过身’是去世的意思。”", "“这样说不太尊重。”", "“过身就是经过吧。”"],
    answer: 0,
    why: "说词义，不评判尊重与否。",
    tip: "说词义，不说尊重。",
    audio: "建议粤语", art: "素色背景与“过身”词卡", source: "待刘博康双来源核对"
  },
  {
    id: "bojin-m3-01", word: "帛金", mode: "m3",
    seq: 24, stage: 5, stageName: "改口", level: 3,
    scene: "原话：“帛金这词听着像喜事。”",
    stem: "哪句改口最得体？",
    options: ["“你们把丧事说成喜事？”", "“帛金是丧事礼金，不是喜事红包。”", "“帛金就是红包吧。”"],
    answer: 1,
    why: "说明用途，不反问喜事。",
    tip: "帛金是白事礼金。",
    audio: "建议粤语", art: "白事礼金信封示意", source: "待刘博康双来源核对"
  }
];
