export type MbtiQuestion = {
  id: string;
  dimension: string;
  prompt: string;
  optionA: string;
  optionB: string;
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

export type AssessResponse = {
  mbti: string;
  subtype: string;
  type64: string;
  scores: Record<string, number>;
  hexagram: Hexagram;
  advice: Record<string, string>;
  timestamp: string;
};

export type AssessmentHistoryItem = {
  id: number;
  mbti: string;
  subtype: string;
  type64: string;
  scores: Record<string, number>;
  hexagram: Hexagram;
  advice: Record<string, string>;
  createdAt: string;
};

export const defaultQuestions: MbtiQuestion[] = [
  { id: "q1", dimension: "EI", prompt: "参加新项目时，你更自然的状态是：", optionA: "先和人沟通碰撞", optionB: "先独立思考梳理" },
  { id: "q2", dimension: "EI", prompt: "连续开会一天后，你通常：", optionA: "越聊越有能量", optionB: "需要独处恢复" },
  { id: "q3", dimension: "EI", prompt: "做重要决策时，你更依赖：", optionA: "外部讨论与反馈", optionB: "内在判断与沉淀" },
  { id: "q4", dimension: "SN", prompt: "分析机会时，你首先看：", optionA: "已验证的事实数据", optionB: "潜在趋势与可能性" },
  { id: "q5", dimension: "SN", prompt: "听方案汇报时，你更在意：", optionA: "执行细节与落地性", optionB: "方向想象与空间" },
  { id: "q6", dimension: "SN", prompt: "面对不确定市场，你通常：", optionA: "回到历史样本对比", optionB: "构建未来情景推演" },
  { id: "q7", dimension: "TF", prompt: "处理冲突时，你优先：", optionA: "按客观标准裁决", optionB: "兼顾关系与感受" },
  { id: "q8", dimension: "TF", prompt: "评估团队成员时，你更看重：", optionA: "能力产出与结果", optionB: "氛围协同与成长" },
  { id: "q9", dimension: "TF", prompt: "做取舍时你更常说：", optionA: "先看原则和逻辑", optionB: "先看人和影响" },
  { id: "q10", dimension: "JP", prompt: "推进任务时，你更偏好：", optionA: "提前计划并按表执行", optionB: "边做边调灵活推进" },
  { id: "q11", dimension: "JP", prompt: "面对截止日期，你通常：", optionA: "提前收口降低风险", optionB: "临近截止冲刺整合" },
  { id: "q12", dimension: "JP", prompt: "日程安排上，你更舒服：", optionA: "结构清晰可预期", optionB: "保留弹性与机动" },
  { id: "q13", dimension: "ST", prompt: "遇到波动行情时，你更容易：", optionA: "保持情绪稳定", optionB: "情绪起伏明显" },
  { id: "q14", dimension: "ST", prompt: "出现突发问题时，你通常：", optionA: "先稳住节奏再处理", optionB: "快速应激直接反应" },
  { id: "q15", dimension: "ST", prompt: "高压情况下，你常见状态是：", optionA: "稳定推进", optionB: "敏锐紧绷" },
  { id: "q16", dimension: "FX", prompt: "执行策略时，你更倾向：", optionA: "锁定主线持续推进", optionB: "随反馈即时调整" },
  { id: "q17", dimension: "FX", prompt: "面对长期目标，你更像：", optionA: "定向深挖型", optionB: "机动探索型" },
  { id: "q18", dimension: "FX", prompt: "资源分配时，你更常：", optionA: "集中投入关键点", optionB: "分散布局保弹性" },
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
  1: "乾", 2: "坤", 3: "屯", 4: "蒙", 5: "需", 6: "讼", 7: "师", 8: "比",
  9: "小畜", 10: "履", 11: "泰", 12: "否", 13: "同人", 14: "大有", 15: "谦", 16: "豫",
  17: "随", 18: "蛊", 19: "临", 20: "观", 21: "噬嗑", 22: "贲", 23: "剥", 24: "复",
  25: "无妄", 26: "大畜", 27: "颐", 28: "大过", 29: "坎", 30: "离", 31: "咸", 32: "恒",
  33: "遁", 34: "大壮", 35: "晋", 36: "明夷", 37: "家人", 38: "睽", 39: "蹇", 40: "解",
  41: "损", 42: "益", 43: "夬", 44: "姤", 45: "萃", 46: "升", 47: "困", 48: "井",
  49: "革", 50: "鼎", 51: "震", 52: "艮", 53: "渐", 54: "归妹", 55: "丰", 56: "旅",
  57: "巽", 58: "兑", 59: "涣", 60: "节", 61: "中孚", 62: "小过", 63: "既济", 64: "未济",
};

const kingWenByTrigramPair: Record<string, number> = {
  "乾-乾": 1, "兑-乾": 43, "离-乾": 14, "震-乾": 34, "巽-乾": 9, "坎-乾": 5, "艮-乾": 26, "坤-乾": 11,
  "乾-兑": 10, "兑-兑": 58, "离-兑": 38, "震-兑": 54, "巽-兑": 61, "坎-兑": 60, "艮-兑": 41, "坤-兑": 19,
  "乾-离": 13, "兑-离": 49, "离-离": 30, "震-离": 55, "巽-离": 37, "坎-离": 63, "艮-离": 22, "坤-离": 36,
  "乾-震": 25, "兑-震": 17, "离-震": 21, "震-震": 51, "巽-震": 42, "坎-震": 3, "艮-震": 27, "坤-震": 24,
  "乾-巽": 44, "兑-巽": 28, "离-巽": 50, "震-巽": 32, "巽-巽": 57, "坎-巽": 48, "艮-巽": 18, "坤-巽": 46,
  "乾-坎": 6, "兑-坎": 47, "离-坎": 64, "震-坎": 40, "巽-坎": 59, "坎-坎": 29, "艮-坎": 4, "坤-坎": 7,
  "乾-艮": 33, "兑-艮": 31, "离-艮": 56, "震-艮": 62, "巽-艮": 53, "坎-艮": 39, "艮-艮": 52, "坤-艮": 15,
  "乾-坤": 12, "兑-坤": 45, "离-坤": 35, "震-坤": 16, "巽-坤": 20, "坎-坤": 8, "艮-坤": 23, "坤-坤": 2,
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
  if (stability === "稳" && fixed === "定") return { stability, fixed, subtype: "A" };
  if (stability === "稳" && fixed === "变") return { stability, fixed, subtype: "B" };
  if (stability === "敏" && fixed === "定") return { stability, fixed, subtype: "C" };
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
  const title = upper.name === lower.name ? `${name}为${upper.xiang}` : `${upper.xiang}${lower.xiang}${name}`;
  const fuxiIndex = bitStringToIndex(bits);
  const symbol = String.fromCodePoint(0x4DC0 + kingWen - 1);

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

export const buildAdvice = (mbti: string, subtype: string, hexagram: Hexagram) => {
  const product = [
    "先定义单一北极星指标，再决定功能取舍。",
    "用小步实验验证当前卦象代表的节奏，避免一次性重押。",
    "为关键假设设置止损阈值，达到阈值自动复盘。",
  ];
  const investment = [
    "把仓位拆成三段执行，避免单点情绪决策。",
    "优先筛选与你人格偏好相反视角的证据，降低确认偏差。",
    "以周为单位复核逻辑，不因日内波动改变核心计划。",
  ];
  const relationship = [
    "先对齐目标，再讨论方法，避免直接进入立场对抗。",
    "把分歧写成可验证假设，约定复盘节点。",
    "根据对方节奏调整沟通强度，先求可持续合作。",
  ];

  if (mbti.includes("N")) {
    product[1] = "先做原型验证方向价值，再投入工程化资源。";
  }
  if (mbti.includes("S")) {
    product[1] = "先做流程和数据基线，再逐步扩展创新点。";
  }
  if (mbti.includes("T")) {
    relationship[0] = "先统一评价标准，再对齐分工和边界。";
  }
  if (mbti.includes("F")) {
    relationship[0] = "先建立信任和共识，再推进责任与节奏。";
  }
  if (subtype === "D" || subtype === "C") {
    investment[0] = "把仓位拆成更多批次执行，降低波动中的行为偏差。";
  }
  if (hexagram.kingWen === 1 || hexagram.kingWen === 43) {
    product[2] = "当前卦势偏进取，保留进攻同时必须定义明确撤退线。";
  }
  if (hexagram.kingWen === 2 || hexagram.kingWen === 23) {
    product[2] = "当前卦势偏守成，先稳结构再谈扩张。";
  }

  return {
    product: product.join(" "),
    investment: investment.join(" "),
    relationship: relationship.join(" "),
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
  const advice = buildAdvice(mbti, subtype, hexagram);

  return {
    mbti,
    subtype,
    type64,
    scores,
    hexagram,
    advice,
    timestamp: new Date().toISOString(),
  };
};
