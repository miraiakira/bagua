export type MbtiQuestion = {
  id: string;
  dimension: string;
  prompt: string;
  optionA: string;
  optionB: string;
};

export type DimensionMeta = {
  code: string;
  name: string;
  description: string;
  optionAHint: string;
  optionBHint: string;
};

export type DimensionScoreExplanation = {
  code: string;
  name: string;
  score: number;
  polarity: "A" | "B" | "balanced";
  intensity: string;
  tendency: string;
  summary: string;
};

export type AssessRequestBody = {
  answers?: Record<string, string>;
};

export type Trigram = {
  name: string;
  symbol: string;
  xiang: string;
  bits: string;
};

export type Hexagram = {
  fuxiIndex: number;
  kingWen: number;
  symbol: string;
  name: string;
  title: string;
  bits: string;
  upper: Trigram;
  lower: Trigram;
};

export type AdviceBundle = {
  product: string;
  investment: string;
  relationship: string;
};

export type PersonalityAnalysis = {
  baseline: string;
  strengths: string;
  blindSpot: string;
  rhythm: string;
};

export type AssessResponse = {
  mbti: string;
  subtype: string;
  type64: string;
  scores: Record<string, number>;
  hexagram: Hexagram;
  analysis: PersonalityAnalysis;
  advice: AdviceBundle;
  timestamp: string;
};

export type AssessmentHistoryItem = {
  id: number;
  mbti: string;
  subtype: string;
  type64: string;
  scores: Record<string, number>;
  hexagram: Hexagram;
  advice: AdviceBundle;
  createdAt: string;
};

export const dimensionMetaByCode: Record<string, DimensionMeta> = {
  EI: {
    code: "EI",
    name: "能量来源",
    description: "看你更习惯通过外部互动进入状态，还是先在内部完成判断。",
    optionAHint: "A 更偏外部互动驱动",
    optionBHint: "B 更偏内部思考驱动",
  },
  SN: {
    code: "SN",
    name: "信息关注点",
    description: "看你遇事更先抓现实证据，还是先看趋势、想象和潜在可能。",
    optionAHint: "A 更偏事实与样本",
    optionBHint: "B 更偏趋势与可能性",
  },
  TF: {
    code: "TF",
    name: "判断依据",
    description: "看你做取舍时更先按标准和逻辑判断，还是先考虑人和关系影响。",
    optionAHint: "A 更偏原则与逻辑",
    optionBHint: "B 更偏感受与关系",
  },
  JP: {
    code: "JP",
    name: "行动节奏",
    description: "看你更偏好先规划后推进，还是在行动中不断调整和收敛。",
    optionAHint: "A 更偏计划和收口",
    optionBHint: "B 更偏弹性和迭代",
  },
  ST: {
    code: "ST",
    name: "稳定阈值",
    description:
      "看你在压力和波动下更容易稳住节奏，还是更快被刺激并进入高响应。",
    optionAHint: "A 更偏稳态处理",
    optionBHint: "B 更偏敏感响应",
  },
  FX: {
    code: "FX",
    name: "聚焦方式",
    description: "看你更自然地锁定主线深挖，还是保留多个方向随时调整。",
    optionAHint: "A 更偏定向聚焦",
    optionBHint: "B 更偏机动探索",
  },
};

const orderedDimensionCodes = ["EI", "SN", "TF", "JP", "ST", "FX"] as const;

const dimensionScoreTemplates: Record<
  string,
  {
    positive: { tendency: string; summary: string };
    negative: { tendency: string; summary: string };
    balanced: string;
  }
> = {
  EI: {
    positive: {
      tendency: "外部互动驱动",
      summary: "你更容易在交流、碰撞和即时反馈里进入状态。",
    },
    negative: {
      tendency: "内部思考驱动",
      summary: "你更习惯先在内部形成判断，再选择合适时机表达。",
    },
    balanced: "你能在外部互动和独立思考之间切换，启动方式更受场景影响。",
  },
  SN: {
    positive: {
      tendency: "事实与样本导向",
      summary: "你更相信已验证的信息，会先抓住现实依据再推进判断。",
    },
    negative: {
      tendency: "趋势与可能性导向",
      summary: "你更容易先看到潜在空间，会先从变化和想象中寻找方向。",
    },
    balanced: "你会同时参考事实和可能性，通常先看哪一侧取决于问题类型。",
  },
  TF: {
    positive: {
      tendency: "原则与逻辑导向",
      summary: "你做取舍时更重视标准是否一致、判断是否站得住。",
    },
    negative: {
      tendency: "感受与关系导向",
      summary: "你做判断时会更在意人是否被照顾、关系是否可持续。",
    },
    balanced: "你会同时顾及逻辑和关系，往往根据对象与后果调整判断重心。",
  },
  JP: {
    positive: {
      tendency: "计划与收口导向",
      summary: "你更偏好先明确结构和节奏，再把事情稳定推进。",
    },
    negative: {
      tendency: "弹性与迭代导向",
      summary: "你更适合在行动中修正路线，让信息边出现边收敛。",
    },
    balanced: "你既能规划也能调整，具体更偏哪侧通常取决于任务的不确定性。",
  },
  ST: {
    positive: {
      tendency: "稳态处理导向",
      summary: "面对波动时，你更容易先稳住节奏，再决定是否调整。",
    },
    negative: {
      tendency: "敏感响应导向",
      summary: "面对变化时，你会更快察觉信号并进入高响应状态。",
    },
    balanced: "你在稳定推进和快速响应之间相对均衡，反应方式更受压力强度影响。",
  },
  FX: {
    positive: {
      tendency: "定向聚焦导向",
      summary: "你更自然地锁定主线，把资源持续压在关键点上。",
    },
    negative: {
      tendency: "机动探索导向",
      summary: "你更愿意保留多个选项，根据反馈不断调整路径。",
    },
    balanced: "你能在聚焦深挖和机动探索之间切换，策略通常跟资源状态同步变化。",
  },
};

const getScoreIntensity = (score: number) => {
  const absolute = Math.min(Math.abs(score), 3);
  if (absolute === 0) {
    return "平衡";
  }
  if (absolute === 1) {
    return "轻度偏向";
  }
  if (absolute === 2) {
    return "明显偏向";
  }
  return "强烈偏向";
};

export const buildDimensionScoreExplanations = (
  scores: Record<string, number>,
): DimensionScoreExplanation[] =>
  orderedDimensionCodes.map((code) => {
    const meta = dimensionMetaByCode[code];
    const template = dimensionScoreTemplates[code];
    const score = scores[code] ?? 0;

    if (score === 0) {
      return {
        code,
        name: meta.name,
        score,
        polarity: "balanced",
        intensity: "平衡",
        tendency: "两侧接近",
        summary: template.balanced,
      };
    }

    const polarity = score > 0 ? "A" : "B";
    const direction = polarity === "A" ? template.positive : template.negative;
    const intensity = getScoreIntensity(score);

    return {
      code,
      name: meta.name,
      score,
      polarity,
      intensity,
      tendency: direction.tendency,
      summary: `${intensity}${direction.tendency}，${direction.summary}`,
    };
  });

export const defaultQuestions: MbtiQuestion[] = [
  {
    id: "q1",
    dimension: "EI",
    prompt: "进入一个陌生协作场景时，你通常先：",
    optionA: "通过交流快速进入状态",
    optionB: "先自己想清楚再加入讨论",
  },
  {
    id: "q2",
    dimension: "EI",
    prompt: "连续一整天高强度沟通后，你更常见的状态是：",
    optionA: "仍然有交流和推进的动力",
    optionB: "需要独处一段时间恢复",
  },
  {
    id: "q3",
    dimension: "EI",
    prompt: "遇到重要但还不够清晰的问题时，你更倾向：",
    optionA: "边讨论边形成判断",
    optionB: "先在心里推演成熟再表达",
  },
  {
    id: "q4",
    dimension: "SN",
    prompt: "评估一个新方向时，你首先会抓：",
    optionA: "已发生的事实和可验证数据",
    optionB: "未来趋势和潜在空间",
  },
  {
    id: "q5",
    dimension: "SN",
    prompt: "听别人讲方案时，你更容易追问：",
    optionA: "资源、流程和落地细节",
    optionB: "核心假设、延展性和可能变化",
  },
  {
    id: "q6",
    dimension: "SN",
    prompt: "面对不确定变化时，你更相信：",
    optionA: "从已有案例归纳规律",
    optionB: "先构建几种未来情景再判断",
  },
  {
    id: "q7",
    dimension: "TF",
    prompt: "团队里出现分歧时，你通常先考虑：",
    optionA: "标准是否一致、逻辑是否站得住",
    optionB: "关系是否会受损、感受是否被照顾",
  },
  {
    id: "q8",
    dimension: "TF",
    prompt: "两种方案都可行时，你更可能优先选择：",
    optionA: "原则更清楚、结果更稳的一边",
    optionB: "对人影响更好、协作更顺的一边",
  },
  {
    id: "q9",
    dimension: "TF",
    prompt: "表达不同意见时，你更自然的方式是：",
    optionA: "先指出问题和判断依据",
    optionB: "先顾及对方感受再推进观点",
  },
  {
    id: "q10",
    dimension: "JP",
    prompt: "接到任务后，你更舒服的起手方式是：",
    optionA: "先定计划和里程碑再开工",
    optionB: "先动起来，边做边收敛",
  },
  {
    id: "q11",
    dimension: "JP",
    prompt: "临近截止日期时，你通常会：",
    optionA: "提前完成关键部分，给自己留缓冲",
    optionB: "在最后阶段集中整合和冲刺",
  },
  {
    id: "q12",
    dimension: "JP",
    prompt: "理想的工作节奏更像：",
    optionA: "安排明确、步骤可预期",
    optionB: "保留弹性，随新情况调整",
  },
  {
    id: "q13",
    dimension: "ST",
    prompt: "遇到突发问题时，你第一反应更像：",
    optionA: "先稳住，再决定怎么处理",
    optionB: "状态立刻被拉高，快速进入应对",
  },
  {
    id: "q14",
    dimension: "ST",
    prompt: "在连续高压几天后，你通常：",
    optionA: "还能维持相对稳定的输出",
    optionB: "会明显感到紧绷和消耗",
  },
  {
    id: "q15",
    dimension: "ST",
    prompt: "面对外部波动或异常信号时，你更常：",
    optionA: "保持原有节奏，不轻易失衡",
    optionB: "对细微变化很敏感，迅速作出反应",
  },
  {
    id: "q16",
    dimension: "FX",
    prompt: "推进长期目标时，你更自然的方式是：",
    optionA: "锁定核心路径持续推进",
    optionB: "根据反馈不断调整打法",
  },
  {
    id: "q17",
    dimension: "FX",
    prompt: "资源有限时，你更倾向：",
    optionA: "集中投入最关键的一点",
    optionB: "分散布局，保留多个可能性",
  },
  {
    id: "q18",
    dimension: "FX",
    prompt: "当外部条件变化时，你通常会：",
    optionA: "在原主线内做有限修正",
    optionB: "及时改道，寻找更合适的路径",
  },
];

const trigramByBits: Record<string, Trigram> = {
  "111": { name: "乾", symbol: "☰", xiang: "天", bits: "111" },
  "110": { name: "兑", symbol: "☱", xiang: "泽", bits: "110" },
  "101": { name: "离", symbol: "☲", xiang: "火", bits: "101" },
  "100": { name: "震", symbol: "☳", xiang: "雷", bits: "100" },
  "011": { name: "巽", symbol: "☴", xiang: "风", bits: "011" },
  "010": { name: "坎", symbol: "☵", xiang: "水", bits: "010" },
  "001": { name: "艮", symbol: "☶", xiang: "山", bits: "001" },
  "000": { name: "坤", symbol: "☷", xiang: "地", bits: "000" },
};

const hexNameByKingWen: Record<number, string> = {
  1: "乾",
  2: "坤",
  3: "屯",
  4: "蒙",
  5: "需",
  6: "讼",
  7: "师",
  8: "比",
  9: "小畜",
  10: "履",
  11: "泰",
  12: "否",
  13: "同人",
  14: "大有",
  15: "谦",
  16: "豫",
  17: "随",
  18: "蛊",
  19: "临",
  20: "观",
  21: "噬嗑",
  22: "贲",
  23: "剥",
  24: "复",
  25: "无妄",
  26: "大畜",
  27: "颐",
  28: "大过",
  29: "坎",
  30: "离",
  31: "咸",
  32: "恒",
  33: "遁",
  34: "大壮",
  35: "晋",
  36: "明夷",
  37: "家人",
  38: "睽",
  39: "蹇",
  40: "解",
  41: "损",
  42: "益",
  43: "夬",
  44: "姤",
  45: "萃",
  46: "升",
  47: "困",
  48: "井",
  49: "革",
  50: "鼎",
  51: "震",
  52: "艮",
  53: "渐",
  54: "归妹",
  55: "丰",
  56: "旅",
  57: "巽",
  58: "兑",
  59: "涣",
  60: "节",
  61: "中孚",
  62: "小过",
  63: "既济",
  64: "未济",
};

const kingWenByTrigramPair: Record<string, number> = {
  "乾-乾": 1,
  "兑-乾": 43,
  "离-乾": 14,
  "震-乾": 34,
  "巽-乾": 9,
  "坎-乾": 5,
  "艮-乾": 26,
  "坤-乾": 11,
  "乾-兑": 10,
  "兑-兑": 58,
  "离-兑": 38,
  "震-兑": 54,
  "巽-兑": 61,
  "坎-兑": 60,
  "艮-兑": 41,
  "坤-兑": 19,
  "乾-离": 13,
  "兑-离": 49,
  "离-离": 30,
  "震-离": 55,
  "巽-离": 37,
  "坎-离": 63,
  "艮-离": 22,
  "坤-离": 36,
  "乾-震": 25,
  "兑-震": 17,
  "离-震": 21,
  "震-震": 51,
  "巽-震": 42,
  "坎-震": 3,
  "艮-震": 27,
  "坤-震": 24,
  "乾-巽": 44,
  "兑-巽": 28,
  "离-巽": 50,
  "震-巽": 32,
  "巽-巽": 57,
  "坎-巽": 48,
  "艮-巽": 18,
  "坤-巽": 46,
  "乾-坎": 6,
  "兑-坎": 47,
  "离-坎": 64,
  "震-坎": 40,
  "巽-坎": 59,
  "坎-坎": 29,
  "艮-坎": 4,
  "坤-坎": 7,
  "乾-艮": 33,
  "兑-艮": 31,
  "离-艮": 56,
  "震-艮": 62,
  "巽-艮": 53,
  "坎-艮": 39,
  "艮-艮": 52,
  "坤-艮": 15,
  "乾-坤": 12,
  "兑-坤": 45,
  "离-坤": 35,
  "震-坤": 16,
  "巽-坤": 20,
  "坎-坤": 8,
  "艮-坤": 23,
  "坤-坤": 2,
};

const bitStringToIndex = (bits: string) => {
  let result = 0;
  for (let i = 0; i < bits.length; i += 1) {
    if (bits[i] === "1") {
      result += 1 << i;
    }
  }
  return result;
};

export const buildMBTI = (scores: Record<string, number>) => {
  const ei = scores.EI >= 0 ? "E" : "I";
  const sn = scores.SN < 0 ? "N" : "S";
  const tf = scores.TF >= 0 ? "T" : "F";
  const jp = scores.JP >= 0 ? "J" : "P";
  return `${ei}${sn}${tf}${jp}`;
};

export const buildSubtype = (scores: Record<string, number>) => {
  const stability = scores.ST >= 0 ? "稳" : "敏";
  const fixed = scores.FX >= 0 ? "定" : "变";
  if (stability === "稳" && fixed === "定")
    return { stability, fixed, subtype: "A" };
  if (stability === "稳" && fixed === "变")
    return { stability, fixed, subtype: "B" };
  if (stability === "敏" && fixed === "定")
    return { stability, fixed, subtype: "C" };
  return { stability, fixed, subtype: "D" };
};

export const buildBits = (
  scores: Record<string, number>,
  stability: string,
  fixed: string,
) => {
  const b1 = fixed === "定" ? "1" : "0";
  const b2 = scores.JP >= 0 ? "1" : "0";
  const b3 = scores.TF >= 0 ? "1" : "0";
  const b4 = stability === "稳" ? "1" : "0";
  const b5 = scores.SN < 0 ? "1" : "0";
  const b6 = scores.EI >= 0 ? "1" : "0";
  return `${b1}${b2}${b3}${b4}${b5}${b6}`;
};

export const buildHexagram = (bits: string): Hexagram => {
  if (bits.length !== 6) {
    throw new Error("invalid bits length");
  }

  const lowerBits = bits.slice(0, 3);
  const upperBits = bits.slice(3);
  const lower = trigramByBits[lowerBits];
  const upper = trigramByBits[upperBits];
  if (!lower || !upper) {
    throw new Error("invalid trigram bits");
  }

  const key = `${upper.name}-${lower.name}`;
  const kingWen = kingWenByTrigramPair[key];
  if (!kingWen) {
    throw new Error("hexagram pair missing");
  }

  const name = hexNameByKingWen[kingWen];
  const title =
    upper.name === lower.name
      ? `${name}为${upper.xiang}`
      : `${upper.xiang}${lower.xiang}${name}`;
  const fuxiIndex = bitStringToIndex(bits);
  const symbol = String.fromCodePoint(0x4dc0 + kingWen - 1);

  return {
    fuxiIndex,
    kingWen,
    symbol,
    name,
    title,
    bits,
    upper,
    lower,
  };
};

type PersonalityBlueprint = {
  baseline: string;
  strengths: string;
  blindSpot: string;
  product: string;
  investment: string;
  relationship: string;
};

type SubtypeProfile = {
  baseline: string;
  strengths: string;
  blindSpot: string;
  product: string;
  investment: string;
  relationship: string;
};

type HexagramTheme = {
  summary: string;
  product: string;
  investment: string;
  relationship: string;
};

const mbtiBlueprints: Record<string, PersonalityBlueprint> = {
  INTJ: {
    baseline: "你习惯先搭框架再行动，喜欢用长期结构解释眼前问题。",
    strengths: "擅长识别关键变量、建立系统路径，并在复杂局面里保持主线。",
    blindSpot: "容易因判断过早成型而低估外部反馈，也可能把标准拉得过高。",
    product: "适合负责方向框架和能力地图，但立项前要尽快补上真实用户验证。",
    investment:
      "更适合做深度跟踪和逻辑拆解，避免因为确信底层逻辑而忽视市场节奏。",
    relationship:
      "沟通时先给结论与原则，再补充对他人处境的回应，协作阻力会更小。",
  },
  INTP: {
    baseline: "你偏好先看原理与逻辑一致性，遇事会先在脑中完成多轮推演。",
    strengths: "擅长拆解概念、提出新模型，并发现别人忽略的假设漏洞。",
    blindSpot: "容易停留在分析阶段，或者因为追求完备解释而延后决策。",
    product: "适合做定义、推演和方案验证，但要给自己设置明确的落地时间点。",
    investment: "适合做假设树和证据链，避免只在模型上正确却错过执行窗口。",
    relationship: "表达观点时多给上下文和结论落点，别人会更容易跟上你的思路。",
  },
  ENTJ: {
    baseline: "你天然会从目标、资源和节奏出发组织行动，偏好快速形成推进面。",
    strengths: "擅长定标准、抓主线和整合资源，能把模糊事务推成明确计划。",
    blindSpot: "容易推进过快，让他人只接收到压力而没接收到方向。",
    product: "适合负责路线、优先级和团队拉齐，但要预留试错空间避免一次压满。",
    investment: "行动果断、执行纪律强，关键是别把仓位速度当成逻辑正确的证明。",
    relationship:
      "先说明为什么要这样做，再分配动作，会比直接下结论更容易达成认同。",
  },
  ENTP: {
    baseline: "你喜欢在变化中寻找机会，善于通过碰撞新想法打开局面。",
    strengths: "擅长提出新视角、连接资源，并在不确定中快速找到突破口。",
    blindSpot: "容易对新可能性持续加码，导致收束不足或后续跟进变弱。",
    product: "适合开新题、找增长机会和试验新路径，但要及早确定聚焦边界。",
    investment:
      "适合在变化中捕捉机会，交易前先写下失效条件，避免策略一路漂移。",
    relationship:
      "你的表达有感染力，但要少一点辩胜心，多一点对共识节奏的照顾。",
  },
  INFJ: {
    baseline: "你会先感知长期方向与人心变化，再决定如何稳妥地推动事情。",
    strengths: "擅长发现深层动机、整合价值判断，并让复杂议题形成意义感。",
    blindSpot: "容易把预期放在心里，若缺少明确表达，外界未必知道你的真实判断。",
    product: "适合负责愿景、叙事和关键判断，但仍要把抽象方向拆成可交付节点。",
    investment:
      "适合做耐心观察和长期判断，避免因为理想叙事过强而忽略现实信号。",
    relationship:
      "你重视深度连接，及时说清需求与边界，比默默承受更有利于关系稳定。",
  },
  INFP: {
    baseline: "你会先确认价值认同与内在感受，只有认可一件事才愿意真正投入。",
    strengths: "擅长保持真实感、发现独特机会，并在创意和意义之间建立连接。",
    blindSpot: "容易因为不想违背内心而推迟碰撞，也可能在现实约束前回撤过快。",
    product: "适合负责用户感受、内容表达和差异化创意，但要把偏好转成具体标准。",
    investment: "重视是否真正理解一个标的，交易时要把感受判断落成可验证条件。",
    relationship: "你很会共情，但关键分歧不能只靠体谅维持，仍要把规则说明白。",
  },
  ENFJ: {
    baseline: "你会自然关注群体状态与共同目标，擅长让人愿意一起往前走。",
    strengths: "擅长凝聚共识、识别关系温度，并把抽象目标转成集体行动。",
    blindSpot: "容易为了维持整体气氛而延后难话题，导致问题积压。",
    product: "适合负责跨团队协同和对外表达，但决策时要防止被过多反馈拖慢。",
    investment:
      "适合用团队信息和长期判断辅助决策，但仍要让结论回到数字和仓位纪律。",
    relationship:
      "你具备带动氛围的能力，关键是把期待说具体，别让默契承担全部沟通。",
  },
  ENFP: {
    baseline: "你通常先感知机会和人心流向，再用热情把事情点燃。",
    strengths: "擅长连接人、激活创意，并在陌生环境里快速找到可能性。",
    blindSpot: "容易被新鲜感带动切换太快，或因为怕扫兴而延后必要收口。",
    product: "适合做新方向探索和用户洞察，但要尽快把想法压成有限的实验列表。",
    investment:
      "你对情绪和叙事变化敏感，操作时尤其需要预设退出条件和复盘节奏。",
    relationship: "你很容易拉近距离，但长期合作仍要补足承诺、边界和后续动作。",
  },
  ISTJ: {
    baseline: "你倾向先确认事实、流程和责任，再一步一步把事情做稳。",
    strengths: "擅长守住秩序、建立规则，并把复杂任务拆成可靠流程。",
    blindSpot: "容易因为重视确定性而对新机会反应偏慢，也可能过度依赖旧经验。",
    product: "适合负责流程建设、质量控制和风险兜底，但别只优化旧路径。",
    investment:
      "你重视纪律和边界，优势是稳定，提醒是别把历史样本直接等同未来。",
    relationship:
      "先把标准、分工和时间说清会很高效，但也要补上情绪上的确认与反馈。",
  },
  ISFJ: {
    baseline: "你会先照顾稳定、关系和现实细节，偏好以可靠方式支持整体运行。",
    strengths: "擅长发现被忽略的实际需求，能持续稳定地承担关键支持角色。",
    blindSpot: "容易为了维持和谐而把负担揽在自己身上，导致真实压力被隐藏。",
    product: "适合负责体验打磨、服务细节和交付稳定，但需要主动提出资源边界。",
    investment: "适合慢变量和稳健节奏，做决定时别只求安心，也要评估机会成本。",
    relationship: "你很会照顾别人，但当分工失衡时要尽早提出，不要等问题累积。",
  },
  ESTJ: {
    baseline: "你会自然站到组织和执行位置上，习惯把混乱场面迅速收成秩序。",
    strengths: "擅长明确目标、压实责任，并让团队进入高执行状态。",
    blindSpot: "容易把效率优先到过头，忽略了节奏背后的接受度和隐性阻力。",
    product: "适合负责推进、排期和资源整合，但重要变更前要先验证一线反馈。",
    investment:
      "你执行力强、能坚持计划，但要警惕只因为计划清楚就误判风险可控。",
    relationship:
      "表达要求时很明确，若能同步说明原因和支持方式，合作质量会更高。",
  },
  ESFJ: {
    baseline: "你会优先关注团队秩序与关系气氛，希望大家在稳定配合中达成目标。",
    strengths: "擅长组织协作、照顾感受，并让复杂事务保持顺滑运转。",
    blindSpot: "容易因为想让所有人都舒服，而推迟必要的取舍与边界设置。",
    product: "适合负责协同流程、服务设计和运营稳定，但要防止反馈过多导致摇摆。",
    investment:
      "适合借助清晰节奏管理风险，关键是让判断回到规则而不被群体情绪带偏。",
    relationship:
      "你天生重视关系维护，但越是重要合作，越要把责任和预期写清楚。",
  },
  ISTP: {
    baseline: "你习惯先观察真实系统怎么运转，再用最直接的方法解决问题。",
    strengths: "擅长在现场快速判断、精准修正，并用低成本动作解决复杂故障。",
    blindSpot: "容易只在必要时才解释思路，让他人觉得你保留太多或参与感不足。",
    product: "适合做原型、排障和关键节点优化，但中长期协同时要补足文档和同步。",
    investment:
      "你适合依靠观察和执行纪律操作，避免因为短期判断顺手就放松复盘。",
    relationship: "你不喜欢冗余沟通，但关键关系里需要更主动地同步状态与想法。",
  },
  ISFP: {
    baseline: "你更相信真实体验与当下感受，倾向用温和但坚定的方式做选择。",
    strengths: "擅长把抽象想法落成具体体验，对品质、审美和个体差异很敏感。",
    blindSpot: "容易在不喜欢冲突时选择沉默，导致真正的判断没有被看见。",
    product: "适合做体验、内容和审美决策，但仍要把感觉转成团队可执行的标准。",
    investment:
      "适合从实际感受和风险承受力出发决策，避免因一时舒适而逃开必要判断。",
    relationship: "你待人真诚温和，但遇到不合适的合作时要更明确地表达边界。",
  },
  ESTP: {
    baseline: "你偏好在真实环境中快速试探和调整，越到动态场面越容易进入状态。",
    strengths: "擅长临场判断、资源调动和快速成交，能把机会迅速转成动作。",
    blindSpot: "容易高估自己对变化的控制力，在顺风时放大杠杆或节奏。",
    product:
      "适合做增长试验、商务推进和强执行场景，但要设定复盘点避免一路前冲。",
    investment:
      "你对市场变化反应快，仓位和止损必须前置，否则很容易被节奏带走。",
    relationship:
      "你有行动带动他人的能力，但长期协作不能只靠当下默契，还要补契约感。",
  },
  ESFP: {
    baseline: "你会优先感知现场氛围和真实反馈，擅长把机会变成可感知的体验。",
    strengths: "擅长调动关系、激活场域，并快速识别什么能打动人。",
    blindSpot: "容易跟着当下热度走，若缺少结构约束，后续持续性会不足。",
    product: "适合负责活动、用户触达和体验设计，但要给创意配上明确收尾动作。",
    investment: "你对情绪与节奏变化反应快，尤其需要外部纪律来抵抗临场冲动。",
    relationship: "你很能营造亲近感，但重要关系里仍要把承诺兑现节奏讲清楚。",
  },
};

const subtypeProfiles: Record<string, SubtypeProfile> = {
  A: {
    baseline: "子型 A 偏稳定且定向，通常能长期守住主线，不轻易被环境带偏。",
    strengths: "你的优势是节奏稳、执行深，适合承担长期型任务和关键守盘位。",
    blindSpot: "惯性一旦形成，也可能让你对外部变化反应偏慢。",
    product: "推进重点项目时适合设阶段复盘，避免因为执行顺畅而忽略外部变数。",
    investment: "适合分批布局和长期跟踪，但别把坚持本身误当成逻辑还成立。",
    relationship: "你给人可靠感，沟通中要避免只给结论不解释过程。",
  },
  B: {
    baseline: "子型 B 偏稳定但有弹性，既重秩序也愿意在关键时刻调整方法。",
    strengths: "你兼顾稳态与变通，适合做连接方案、资源和执行的桥梁角色。",
    blindSpot: "如果目标不够明确，弹性容易被消耗成反复横跳。",
    product: "适合先定边界再做迭代，让灵活性服务主线而不是替代主线。",
    investment: "可保留机动仓位，但要让每次调整都对应清晰的证据变化。",
    relationship: "你比较会拿捏节奏，关键是把口头共识及时沉淀成明确动作。",
  },
  C: {
    baseline: "子型 C 偏敏感但定向，既能快速感知风险，也会持续盯住核心目标。",
    strengths: "你对细微变化警觉度高，适合盯关键风险、关键节点和高压问题。",
    blindSpot: "容易因为时刻绷紧而放大压力，对外表现得较为强硬或疲惫。",
    product: "重要节点前要提前分层处理风险，避免把所有问题都当成最高优先级。",
    investment: "更适合细分批次和预案式执行，用纪律消化情绪波动。",
    relationship: "你对异样很敏感，沟通时要区分事实信号和情绪投射。",
  },
  D: {
    baseline: "子型 D 偏敏感且变通，对环境变化反应快，也愿意即时调整打法。",
    strengths: "你反应灵活、嗅觉敏锐，适合在高变化环境中寻找短窗口机会。",
    blindSpot: "如果缺少锚点，很容易被噪音牵着走，消耗在频繁切换里。",
    product: "需要给探索设置清晰试验范围，避免同时开太多方向造成耗散。",
    investment: "仓位和复盘频率要比别人更细，否则情绪和节奏容易互相放大。",
    relationship: "你适应对方节奏很快，但也要保留自己的边界和稳定表达。",
  },
};

const describeBalance = (scores: Record<string, number>) => {
  const values = Object.values(scores).map((score) => Math.abs(score));
  const strongCount = values.filter((score) => score >= 3).length;
  const balancedCount = values.filter((score) => score <= 1).length;

  if (strongCount >= 2) {
    return "你的偏好比较鲜明，优势会非常突出，但遇到反向场景时也更需要主动补盲。";
  }
  if (balancedCount >= 3) {
    return "你的多个维度都不算极端，更像场景切换型人格，判断时要防止标准随情境漂移。";
  }
  return "你的偏好清晰但并不僵硬，适合在稳定主线下保留少量调整空间。";
};

const buildScoreGuards = (scores: Record<string, number>): AdviceBundle => {
  const product =
    Math.abs(scores.SN) <= 1
      ? "你在事实与想象之间切换较快，立项时要把方向验证和执行里程碑同时写清。"
      : scores.SN < 0
        ? "你更容易先看到未来可能性，推进时记得同步补齐样本、资源和时间约束。"
        : "你更容易先抓现实约束，推进时别只优化已知路径，也要给新机会留窗口。";

  const investment =
    scores.ST < 0
      ? "你的情绪敏感度较高，交易前先写好仓位和退出规则，少做临场判断。"
      : scores.FX < 0
        ? "你的机动性很强，每次调整都要对应新的证据，避免把活跃误当有效。"
        : "你的纪律和专注度较强，复盘时要检验原假设是否已经变化，别只强化执行。";

  const relationship =
    scores.TF >= 2
      ? "你表达标准时很清楚，但越在意效率，越要给对方留出反馈和协商空间。"
      : scores.TF <= -2
        ? "你很会照顾关系感受，但关键合作里也要及时把边界和责任说透。"
        : "你能兼顾原则与感受，关键是把口头默契沉淀成可以执行的动作。";

  return { product, investment, relationship };
};

const buildHexagramTheme = (hexagram: Hexagram): HexagramTheme => {
  const id = hexagram.kingWen;

  if ([1, 14, 34, 43].includes(id)) {
    return {
      summary: `当前卦势偏进取，${hexagram.name}更强调主动出击，但进攻必须伴随清晰边界。`,
      product: "适合抢关键窗口和资源位，但每一步都要定义撤退线与复盘条件。",
      investment: "可保留进攻仓位，不过要以计划内加减仓代替情绪性追击。",
      relationship:
        "推进合作时宜直面问题，但要先说共同目标，避免强推进变成强压迫。",
    };
  }
  if ([2, 8, 15, 16, 23].includes(id)) {
    return {
      summary: `当前卦势偏守成，${hexagram.name}提醒你先稳结构，再谈扩张。`,
      product: "适合补流程、补协同、补基础设施，先把底盘做稳再放大动作。",
      investment: "当前更适合先保住判断质量和仓位秩序，不急着追求高弹性收益。",
      relationship: "先修复信任和秩序，再推动复杂议题，合作会更持久。",
    };
  }
  if ([3, 4, 39, 47, 48].includes(id)) {
    return {
      summary: `当前卦势带有阻滞感，${hexagram.name}提示先识别真正卡点，再决定如何破局。`,
      product: "不要同时解决所有问题，先找出一处最影响效率的瓶颈并集中处理。",
      investment: "先缩小试错范围，用更小仓位验证逻辑是否还成立。",
      relationship:
        "遇到分歧时先确认哪里卡住了，不要把系统问题直接理解成人的问题。",
    };
  }
  if ([11, 19, 24, 42, 46].includes(id)) {
    return {
      summary: `当前卦势偏向生长，${hexagram.name}更适合循序放大已有正反馈。`,
      product: "适合把已经验证的模块继续放大，但仍要保留节奏感，别一口气铺满。",
      investment:
        "适合顺势加仓强逻辑标的，不过加仓动作要建立在复核而非兴奋之上。",
      relationship: "现在更适合推进合作升级，但要先把角色与回报机制讲清楚。",
    };
  }
  if ([12, 20, 33, 52].includes(id)) {
    return {
      summary: `当前卦势强调观察与收敛，${hexagram.name}更适合先看清局面再做大动作。`,
      product: "适合压缩战线、保留观察窗，等待更清晰的用户和市场信号。",
      investment: "当前不宜高频切换，先以观察名单和轻仓跟踪替代重仓表态。",
      relationship: "先退半步看真实诉求，再决定是继续推进还是调整合作方式。",
    };
  }
  if ([29, 40, 59, 60].includes(id)) {
    return {
      summary: `当前卦势与风险管理有关，${hexagram.name}提醒你用规则穿越波动。`,
      product: "把复杂问题拆成阶段目标，每一阶段都设置清晰的停损与通过条件。",
      investment: "先守纪律，再谈收益，任何重仓都要配对退出规则。",
      relationship:
        "讨论敏感问题时先约定规则和边界，减少沟通过程中的二次损耗。",
    };
  }
  if ([31, 32, 37, 53, 61, 63].includes(id)) {
    return {
      summary: `当前卦势更强调协同与持续，${hexagram.name}适合用长期配合换稳定结果。`,
      product: "适合把关键协作接口和复盘机制固定下来，让迭代建立在默契之上。",
      investment: "更适合耐心跟踪和持续校验，不宜频繁追逐短时噪音。",
      relationship: "这是适合经营关系的阶段，重点不是说服，而是建立稳定预期。",
    };
  }
  if ([49, 50, 55, 56, 64].includes(id)) {
    return {
      summary: `当前卦势带有转折意味，${hexagram.name}提醒你在变局中既要更新，也要稳住核心。`,
      product: "适合推动必要升级，但先明确哪些东西必须变、哪些东西不能乱。",
      investment: "面对变局要分层操作，用试探仓位确认趋势，不要一把定胜负。",
      relationship: "沟通中先承认变化已经发生，再一起定义新的合作方式。",
    };
  }

  return {
    summary: `当前卦象为${hexagram.title}，整体更强调顺势判断、节奏控制和因时调整。`,
    product: "先辨认外部节奏，再决定是继续推进、局部试验还是暂时收缩。",
    investment: "把每次动作都和预设逻辑绑定，用复盘替代即时情绪判断。",
    relationship:
      "先理解对方所处阶段，再决定沟通强度，优先追求长期可持续合作。",
  };
};

const fallbackBlueprint: PersonalityBlueprint = {
  baseline: "你会用稳定偏好来理解外部世界，并努力寻找适合自己的行动节奏。",
  strengths: "你的优势在于有连续性的判断与风格，不容易被短期噪音完全带走。",
  blindSpot: "当偏好过强时，也可能忽略与你相反的信息来源。",
  product: "做重要决策时，先确认目标和验证指标，再决定资源投放的节奏。",
  investment: "先建立证据链和仓位纪律，避免让单次波动重写整个判断。",
  relationship: "先讲清目标与边界，再讨论方法，关系会更稳定。",
};

const buildSegments = (...segments: Array<string | null | undefined>) =>
  segments.filter(Boolean).join(" ");

export const buildPersonalityAnalysis = (
  mbti: string,
  subtype: string,
  scores: Record<string, number>,
  hexagram: Hexagram,
): PersonalityAnalysis => {
  const blueprint = mbtiBlueprints[mbti] || fallbackBlueprint;
  const subtypeProfile = subtypeProfiles[subtype] || subtypeProfiles.B;
  const hexagramTheme = buildHexagramTheme(hexagram);

  return {
    baseline: buildSegments(
      blueprint.baseline,
      subtypeProfile.baseline,
      describeBalance(scores),
    ),
    strengths: buildSegments(blueprint.strengths, subtypeProfile.strengths),
    blindSpot: buildSegments(blueprint.blindSpot, subtypeProfile.blindSpot),
    rhythm: hexagramTheme.summary,
  };
};

export const buildAdvice = (
  mbti: string,
  subtype: string,
  hexagram: Hexagram,
  scores: Record<string, number>,
): AdviceBundle => {
  const blueprint = mbtiBlueprints[mbti] || fallbackBlueprint;
  const subtypeProfile = subtypeProfiles[subtype] || subtypeProfiles.B;
  const hexagramTheme = buildHexagramTheme(hexagram);
  const guards = buildScoreGuards(scores);

  return {
    product: buildSegments(
      blueprint.product,
      subtypeProfile.product,
      guards.product,
      hexagramTheme.product,
    ),
    investment: buildSegments(
      blueprint.investment,
      subtypeProfile.investment,
      guards.investment,
      hexagramTheme.investment,
    ),
    relationship: buildSegments(
      blueprint.relationship,
      subtypeProfile.relationship,
      guards.relationship,
      hexagramTheme.relationship,
    ),
  };
};

export const assessAnswers = (
  answers: Record<string, string>,
  questions: MbtiQuestion[],
): AssessResponse => {
  const scores: Record<string, number> = {
    EI: 0,
    SN: 0,
    TF: 0,
    JP: 0,
    ST: 0,
    FX: 0,
  };

  for (const question of questions) {
    const answer = answers[question.id];
    if (!answer) {
      continue;
    }
    const normalized = answer.trim().toUpperCase();
    if (normalized === "A") {
      scores[question.dimension] += 1;
    } else if (normalized === "B") {
      scores[question.dimension] -= 1;
    }
  }

  const mbti = buildMBTI(scores);
  const { stability, fixed, subtype } = buildSubtype(scores);
  const type64 = `${mbti}-${subtype}`;
  const bits = buildBits(scores, stability, fixed);
  const hexagram = buildHexagram(bits);
  const analysis = buildPersonalityAnalysis(mbti, subtype, scores, hexagram);
  const advice = buildAdvice(mbti, subtype, hexagram, scores);

  return {
    mbti,
    subtype,
    type64,
    scores,
    hexagram,
    analysis,
    advice,
    timestamp: new Date().toISOString(),
  };
};
