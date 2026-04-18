"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Image as AntImage,
  Input,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import {
  buildAdvice,
  buildDimensionScoreExplanations,
  buildPersonalityAnalysis,
  type Hexagram,
} from "@/lib/mbti-core";

type AdminResultListItem = {
  id: number;
  userId: string | null;
  userName: string;
  userEmail: string;
  mbti: string;
  subtype: string;
  type64: string;
  scores: Record<string, number>;
  advice: {
    product?: string;
    investment?: string;
    relationship?: string;
  };
  hexagram: Hexagram;
  createdAt: string;
};

type ResultListResponse = {
  items: AdminResultListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

const mbtiOptions = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
].map((value) => ({ label: value, value }));

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const scoreColors: Record<string, string> = {
  EI: "blue",
  SN: "purple",
  TF: "cyan",
  JP: "gold",
  ST: "green",
  FX: "magenta",
};

type NFTTrait = {
  trait_type: string;
  value: string | number;
};

type NFTAsset = {
  svg: string;
  tokenName: string;
  rarityScore: number;
  traits: NFTTrait[];
};

const trigramBitsByName: Record<string, string> = {
  乾: "111",
  兑: "110",
  离: "101",
  震: "100",
  巽: "011",
  坎: "010",
  艮: "001",
  坤: "000",
};

const palettes = [
  {
    bg: "#f4efe3",
    panel: "#e7dcc8",
    line: "#26221d",
    accent: "#a85d32",
    glow: "#d7b68a",
    mist: "#fffaf1",
  },
  {
    bg: "#eef1eb",
    panel: "#dbe2d8",
    line: "#1f2a24",
    accent: "#4b7563",
    glow: "#a7c5b5",
    mist: "#f7fbf8",
  },
];

const rarityLabels = [
  { min: 90, label: "Legendary" },
  { min: 80, label: "Epic" },
  { min: 70, label: "Rare" },
  { min: 0, label: "Common" },
];

const mbtiLabelByCode: Record<string, string> = {
  INTJ: "建筑师",
  INTP: "逻辑学家",
  ENTJ: "指挥官",
  ENTP: "辩论家",
  INFJ: "提倡者",
  INFP: "调停者",
  ENFJ: "主人公",
  ENFP: "竞选者",
  ISTJ: "物流师",
  ISFJ: "守卫者",
  ESTJ: "总经理",
  ESFJ: "执政官",
  ISTP: "鉴赏家",
  ISFP: "探险家",
  ESTP: "企业家",
  ESFP: "表演者",
};

const getMbtiDisplayName = (mbti: string, subtype?: string) =>
  `${mbti}${subtype ? `-${subtype}` : ""} ${mbtiLabelByCode[mbti] || "人格类型"}`;

const getHexagramSummary = (item: AdminResultListItem) =>
  `${item.hexagram.upper.xiang}上${item.hexagram.lower.xiang}下，重在顺势判断、把握节奏。`;

const getPersonalitySummary = (item: AdminResultListItem) => {
  const traits = [
    item.mbti.startsWith("I") ? "偏内省" : "偏外放",
    item.mbti.includes("N") ? "看重趋势" : "重视现实",
    item.mbti.includes("T") ? "理性决断" : "关系导向",
    item.mbti.endsWith("J") ? "推进有章法" : "应变更灵活",
    (item.scores.ST || 0) >= 0 ? "状态稳" : "感知敏",
    (item.scores.FX || 0) >= 0 ? "聚焦强" : "机动性高",
  ];
  return traits.join("、");
};

const getAdviceSummary = (advice: {
  product?: string;
  investment?: string;
  relationship?: string;
}, item: AdminResultListItem) =>
  advice.product ||
  advice.investment ||
  advice.relationship ||
  getHexagramSummary(item);

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0;i < value.length;i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let n = Math.imul(t ^ (t >>> 15), t | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getHexagramBits = (item: AdminResultListItem) =>
  item.hexagram.bits ||
  `${item.hexagram.lower.bits || trigramBitsByName[item.hexagram.lower.name] || "000"}${item.hexagram.upper.bits || trigramBitsByName[item.hexagram.upper.name] || "000"}`;

const renderTrigramMini = ({
  x,
  y,
  title,
  name,
  symbol,
  accent,
  textFill,
}: {
  x: number;
  y: number;
  title: string;
  name: string;
  symbol: string;
  accent: string;
  textFill: string;
}) => {
  return `
    <g>
      <text x="${x}" y="${y}" fill="${accent}" font-size="16" font-family="Arial, sans-serif" text-anchor="middle" filter="url(#textShadowSoft)">${title}</text>
      <text x="${x}" y="${y + 38}" fill="${textFill}" font-size="34" font-family="Arial, serif" text-anchor="middle" filter="url(#textShadowStrong)">${symbol}</text>
      <text x="${x}" y="${y + 68}" fill="${textFill}" font-size="22" font-family="Arial, sans-serif" text-anchor="middle" filter="url(#textShadowSoft)">${name}</text>
    </g>
  `;
};

const renderTrigramBackdrop = ({
  section,
  xiang,
  accent,
  ink,
}: {
  section: "upper" | "lower";
  xiang: string;
  accent: string;
  ink: string;
}) => {
  const isUpper = section === "upper";
  const top = isUpper ? 44 : 534;
  const bottom = isUpper ? 474 : 980;
  const centerY = isUpper ? 174 : 846;
  const edgeY = isUpper ? 404 : 618;
  const opacity = isUpper ? "0.05" : "0.045";
  const secondaryOpacity = isUpper ? "0.12" : "0.1";
  const common = `
    <path d="M108 ${top + 26} H916" stroke="${accent}" stroke-opacity="0.05" />
    <path d="M108 ${bottom - 26} H916" stroke="${accent}" stroke-opacity="0.05" />
  `;

  switch (xiang) {
    case "天":
      return `
        ${common}
        <circle cx="792" cy="${centerY}" r="110" fill="none" stroke="${accent}" stroke-opacity="${secondaryOpacity}" stroke-width="2.5" />
        <circle cx="792" cy="${centerY}" r="146" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2" />
        <path d="M138 ${centerY - 56} C 324 ${centerY - 92}, 544 ${centerY - 94}, 724 ${centerY - 44}" fill="none" stroke="${accent}" stroke-opacity="${secondaryOpacity}" stroke-width="3" />
        <path d="M196 ${centerY + 22} C 392 ${centerY - 6}, 572 ${centerY - 4}, 846 ${centerY + 36}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2.5" />
      `;
    case "地":
      return `
        ${common}
        <path d="M116 ${edgeY} C 266 ${edgeY - 26}, 422 ${edgeY + 16}, 588 ${edgeY - 12} C 736 ${edgeY - 36}, 846 ${edgeY + 10}, 916 ${edgeY - 8}" fill="none" stroke="${accent}" stroke-opacity="${secondaryOpacity}" stroke-width="3" />
        <path d="M116 ${edgeY + 48} C 286 ${edgeY + 18}, 430 ${edgeY + 54}, 598 ${edgeY + 28} C 748 ${edgeY + 2}, 842 ${edgeY + 44}, 916 ${edgeY + 24}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2.5" />
        <rect x="138" y="${centerY - 60}" width="748" height="120" rx="28" fill="${ink}" fill-opacity="${opacity}" />
      `;
    case "山":
      return `
        ${common}
        <path d="M144 ${edgeY + 12} L296 ${centerY - 84} L450 ${edgeY + 12} Z" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2.5" />
        <path d="M314 ${edgeY + 12} L514 ${centerY - 138} L714 ${edgeY + 12} Z" fill="none" stroke="${accent}" stroke-opacity="${secondaryOpacity}" stroke-width="3" />
        <path d="M600 ${edgeY + 12} L754 ${centerY - 62} L888 ${edgeY + 12} Z" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2.5" />
        <path d="M314 ${edgeY + 12} L514 ${centerY - 138} L714 ${edgeY + 12} Z" fill="${ink}" fill-opacity="${opacity}" />
      `;
    case "水":
      return `
        ${common}
        <path d="M96 ${centerY - 14} C 206 ${centerY - 40}, 308 ${centerY + 22}, 432 ${centerY - 10} C 558 ${centerY - 44}, 676 ${centerY + 18}, 808 ${centerY - 6} C 862 ${centerY - 18}, 900 ${centerY - 12}, 928 ${centerY}" fill="none" stroke="${accent}" stroke-opacity="${secondaryOpacity}" stroke-width="3.5" />
        <path d="M96 ${centerY + 52} C 214 ${centerY + 28}, 330 ${centerY + 84}, 464 ${centerY + 58} C 592 ${centerY + 30}, 722 ${centerY + 86}, 928 ${centerY + 42}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="3" />
        <path d="M96 ${centerY + 106} C 230 ${centerY + 82}, 374 ${centerY + 130}, 514 ${centerY + 108} C 640 ${centerY + 88}, 776 ${centerY + 132}, 928 ${centerY + 96}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2.5" />
      `;
    case "火":
      return `
        ${common}
        <circle cx="512" cy="${centerY}" r="106" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2.5" />
        <path d="M512 ${centerY - 130} C 448 ${centerY - 58}, 452 ${centerY + 24}, 512 ${centerY + 84} C 578 ${centerY + 18}, 580 ${centerY - 54}, 512 ${centerY - 130} Z" fill="${accent}" fill-opacity="${secondaryOpacity}" />
        <path d="M512 ${centerY - 86} C 476 ${centerY - 34}, 484 ${centerY + 16}, 512 ${centerY + 48} C 544 ${centerY + 12}, 548 ${centerY - 28}, 512 ${centerY - 86} Z" fill="${ink}" fill-opacity="${opacity}" />
      `;
    case "雷":
      return `
        ${common}
        <path d="M408 ${centerY - 118} H586 L516 ${centerY - 8} H624 L446 ${centerY + 164} L514 ${centerY + 46} H414 Z" fill="${accent}" fill-opacity="${secondaryOpacity}" />
        <path d="M150 ${centerY - 72} C 278 ${centerY - 108}, 354 ${centerY - 106}, 458 ${centerY - 54}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2.5" />
      `;
    case "风":
      return `
        ${common}
        <path d="M120 ${centerY - 58} C 286 ${centerY - 118}, 444 ${centerY - 118}, 646 ${centerY - 46}" fill="none" stroke="${accent}" stroke-opacity="${secondaryOpacity}" stroke-width="3" />
        <path d="M184 ${centerY + 8} C 356 ${centerY - 46}, 534 ${centerY - 54}, 748 ${centerY + 4}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="3" />
        <path d="M308 ${centerY + 72} C 486 ${centerY + 22}, 670 ${centerY + 20}, 892 ${centerY + 78}" fill="none" stroke="${accent}" stroke-opacity="${secondaryOpacity}" stroke-width="3" />
      `;
    case "泽":
      return `
        ${common}
        <ellipse cx="512" cy="${centerY + 38}" rx="268" ry="62" fill="${accent}" fill-opacity="${opacity}" />
        <path d="M244 ${centerY + 16} C 364 ${centerY - 8}, 470 ${centerY - 10}, 780 ${centerY + 14}" fill="none" stroke="${accent}" stroke-opacity="${secondaryOpacity}" stroke-width="3" />
        <path d="M288 ${centerY + 72} C 416 ${centerY + 52}, 548 ${centerY + 54}, 734 ${centerY + 76}" fill="none" stroke="${accent}" stroke-opacity="${opacity}" stroke-width="2.5" />
      `;
    default:
      return `
        ${common}
        <rect x="132" y="${centerY - 70}" width="760" height="140" rx="32" fill="${accent}" fill-opacity="${opacity}" />
      `;
  }
};

const buildNftAsset = (item: AdminResultListItem): NFTAsset => {
  const bitsBottomToTop = getHexagramBits(item);
  const bitsTopToBottom = bitsBottomToTop.split("").reverse().join("");
  const seedInput = `${item.id}|${item.createdAt}|${item.mbti}|${item.type64}|${item.hexagram.kingWen}|${bitsBottomToTop}`;
  const seed = hashString(seedInput);
  const rand = mulberry32(seed);
  const palette = palettes[Math.floor(rand() * palettes.length)];

  const weatherTraits = ["薄雾", "夜雨", "风压", "微光"];
  const pathTraits = ["窄桥", "石阶", "山道", "回廊"];
  const lightTraits = ["远灯", "破晓", "星辉", "火种"];
  const weather = weatherTraits[Math.floor(rand() * weatherTraits.length)];
  const path = pathTraits[Math.floor(rand() * pathTraits.length)];
  const light = lightTraits[Math.floor(rand() * lightTraits.length)];
  const noise = rand();
  const inkColor = palette.line;
  const accentColor = palette.accent;
  const solidPanel = palette.mist;
  const solidPanelAlt = palette.bg;

  const momentum =
    Math.abs(item.scores.EI || 0) +
    Math.abs(item.scores.SN || 0) +
    Math.abs(item.scores.TF || 0) +
    Math.abs(item.scores.JP || 0);
  const stability = Math.abs(item.scores.ST || 0) + Math.abs(item.scores.FX || 0);
  const rarityScore = clamp(
    Math.round(58 + momentum * 2 + stability * 2 + noise * 12),
    60,
    98,
  );
  const rarity = rarityLabels.find((itemRarity) => rarityScore >= itemRarity.min)?.label || "Common";

  const traits: NFTTrait[] = [
    { trait_type: "Hexagram", value: `${item.hexagram.symbol} ${item.hexagram.name}` },
    { trait_type: "KingWen", value: item.hexagram.kingWen },
    { trait_type: "MBTI", value: item.mbti },
    { trait_type: "Subtype", value: item.subtype },
    { trait_type: "Upper", value: `${item.hexagram.upper.symbol}${item.hexagram.upper.name}` },
    { trait_type: "Lower", value: `${item.hexagram.lower.symbol}${item.hexagram.lower.name}` },
    { trait_type: "Weather", value: weather },
    { trait_type: "Path", value: path },
    { trait_type: "Light", value: light },
    { trait_type: "Rarity", value: rarity },
    { trait_type: "RarityScore", value: rarityScore },
  ];

  const lineY = [276, 332, 388, 444, 500, 556];
  const lineSvg = bitsTopToBottom
    .split("")
    .map((bit, idx) => {
      const y = lineY[idx] ?? 108;
      if (bit === "1") {
        return `<rect x="334" y="${y}" width="356" height="20" rx="10" fill="${inkColor}" />`;
      }
      return [
        `<rect x="334" y="${y}" width="146" height="20" rx="10" fill="${inkColor}" />`,
        `<rect x="544" y="${y}" width="146" height="20" rx="10" fill="${inkColor}" />`,
      ].join("");
    })
    .join("");
  const upperTrigramSvg = renderTrigramMini({
    x: 278,
    y: 130,
    title: "上卦",
    name: item.hexagram.upper.name,
    symbol: item.hexagram.upper.symbol,
    accent: accentColor,
    textFill: inkColor,
  });
  const lowerTrigramSvg = renderTrigramMini({
    x: 746,
    y: 130,
    title: "下卦",
    name: item.hexagram.lower.name,
    symbol: item.hexagram.lower.symbol,
    accent: accentColor,
    textFill: inkColor,
  });

  const tokenName = `Bagua #${item.id} · ${item.hexagram.symbol}${item.hexagram.name}`;
  const upperBackdrop = renderTrigramBackdrop({
    section: "upper",
    xiang: item.hexagram.upper.xiang,
    accent: accentColor,
    ink: inkColor,
  });
  const lowerBackdrop = renderTrigramBackdrop({
    section: "lower",
    xiang: item.hexagram.lower.xiang,
    accent: accentColor,
    ink: inkColor,
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${solidPanelAlt}" />
      <stop offset="100%" stop-color="${palette.panel}" />
    </linearGradient>
    <linearGradient id="mainPanel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="${solidPanel}" />
    </linearGradient>
    <linearGradient id="upperArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${solidPanelAlt}" />
      <stop offset="100%" stop-color="#ffffff" />
    </linearGradient>
    <linearGradient id="lowerArea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="${palette.panel}" />
    </linearGradient>
    <linearGradient id="accentStroke" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.08" />
      <stop offset="50%" stop-color="${accentColor}" stop-opacity="0.48" />
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.08" />
    </linearGradient>
    <linearGradient id="foilGlow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.65" />
      <stop offset="40%" stop-color="${accentColor}" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </linearGradient>
    <clipPath id="cardClip">
      <rect x="20" y="20" width="984" height="984" rx="36" />
    </clipPath>
    <filter id="textShadowSoft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.16" />
    </filter>
    <filter id="textShadowStrong" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.22" />
    </filter>
    <filter id="mainShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.12" />
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000000" flood-opacity="0.08" />
    </filter>
  </defs>
  <g filter="url(#mainShadow)">
    <rect x="0" y="0" width="1024" height="1024" rx="40" fill="url(#mainPanel)" />
    <rect x="14" y="14" width="996" height="996" rx="38" fill="none" stroke="${accentColor}" stroke-opacity="0.12" stroke-width="2" />
    <g clip-path="url(#cardClip)">
      <rect x="20" y="20" width="984" height="492" fill="url(#upperArea)" />
      <rect x="20" y="512" width="984" height="492" fill="url(#lowerArea)" />
      <path d="M48 38 C 314 120, 564 124, 988 34 L988 198 C 620 274, 300 266, 48 164 Z" fill="url(#foilGlow)" />
      ${upperBackdrop}
      ${lowerBackdrop}
    </g>
    <rect x="36" y="36" width="952" height="952" rx="34" fill="none" stroke="${accentColor}" stroke-opacity="0.08" />
    <path d="M84 88 H940" stroke="${accentColor}" stroke-opacity="0.12" />
    <path d="M84 204 H940" stroke="${accentColor}" stroke-opacity="0.14" />
    <path d="M84 700 H940" stroke="${accentColor}" stroke-opacity="0.14" />
    <path d="M84 956 H940" stroke="${accentColor}" stroke-opacity="0.12" />
    <text x="512" y="100" fill="${accentColor}" fill-opacity="0.8" font-size="18" font-family="Arial, sans-serif" text-anchor="middle" filter="url(#textShadowSoft)">第 ${item.hexagram.kingWen} 卦</text>
    ${upperTrigramSvg}
    ${lowerTrigramSvg}
    <rect x="250" y="228" width="524" height="430" rx="34" fill="#ffffff" fill-opacity="0.84" stroke="${accentColor}" stroke-opacity="0.18" />
    <rect x="278" y="256" width="468" height="374" rx="28" fill="#ffffff" fill-opacity="0.9" />
    <path d="M318 290 H706" stroke="${accentColor}" stroke-opacity="0.16" />
    <path d="M318 600 H706" stroke="${accentColor}" stroke-opacity="0.16" />
    ${lineSvg}
    <rect x="132" y="726" width="760" height="190" rx="30" fill="#ffffff" fill-opacity="0.78" stroke="${accentColor}" stroke-opacity="0.16" />
    <text x="512" y="788" fill="${inkColor}" font-size="92" font-family="Arial, serif" text-anchor="middle" filter="url(#textShadowStrong)">${item.hexagram.title}</text>
    <text x="512" y="832" fill="${accentColor}" font-size="26" font-family="Arial, sans-serif" text-anchor="middle" filter="url(#textShadowSoft)">${item.hexagram.upper.name}上 · ${item.hexagram.lower.name}下 · ${getMbtiDisplayName(item.mbti, item.subtype)}</text>
    <text x="512" y="870" fill="${inkColor}" font-size="20" font-family="Arial, sans-serif" text-anchor="middle" filter="url(#textShadowSoft)">${getHexagramSummary(item)}</text>
    <text x="512" y="900" fill="${inkColor}" font-size="20" font-family="Arial, sans-serif" text-anchor="middle" filter="url(#textShadowSoft)">${getPersonalitySummary(item)}</text>
  </g>
</svg>`;

  return {
    svg,
    tokenName,
    rarityScore,
    traits,
  };
};

const toSvgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export default function AdminResultsPage() {
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [mbti, setMbti] = useState<string | undefined>();
  const [items, setItems] = useState<AdminResultListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedResult, setSelectedResult] = useState<AdminResultListItem | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (query.trim()) {
          params.set("keyword", query.trim());
        }
        if (mbti) {
          params.set("mbti", mbti);
        }
        const response = await fetch(`/api/admin/results?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(response.status === 403 ? "当前账号没有后台访问权限" : "加载测评结果失败");
        }
        const data = (await response.json()) as ResultListResponse;
        setItems(data.items);
        setTotal(data.pagination.total);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : "加载测评结果失败");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [mbti, page, pageSize, query]);

  const imageById = useMemo(
    () =>
      Object.fromEntries(
        items.map((item) => [item.id, toSvgDataUrl(buildNftAsset(item).svg)]),
      ) as Record<number, string>,
    [items],
  );
  const displayAdviceById = useMemo(
    () =>
      Object.fromEntries(
        items.map((item) => [
          item.id,
          buildAdvice(item.mbti, item.subtype, item.hexagram, item.scores),
        ]),
      ) as Record<number, { product: string; investment: string; relationship: string }>,
    [items],
  );

  const columns = useMemo(
    () => [
      {
        title: "结果图",
        key: "preview",
        width: 110,
        render: (_: unknown, record: AdminResultListItem) => (
          <AntImage
            src={imageById[record.id]}
            alt={`${record.type64} 结果图`}
            width={72}
            height={72}
            className="rounded-xl border border-slate-200 object-cover"
            preview={{
              src: imageById[record.id],
              mask: "预览",
            }}
          />
        ),
      },
      {
        title: "用户",
        key: "user",
        render: (_: unknown, record: AdminResultListItem) => (
          <div>
            <div className="font-medium text-gray-900">{record.userName}</div>
            <div className="text-sm text-gray-500">{record.userEmail}</div>
          </div>
        ),
      },
      {
        title: "类型",
        key: "type",
        render: (_: unknown, record: AdminResultListItem) => (
          <Space size={8}>
            <Tag color="blue">{record.mbti}</Tag>
            <Tag>{record.subtype}</Tag>
            <span>{record.type64}</span>
          </Space>
        ),
      },
      {
        title: "卦象",
        key: "hexagram",
        render: (_: unknown, record: AdminResultListItem) =>
          `${record.hexagram.kingWen}. ${record.hexagram.symbol} ${record.hexagram.name}`,
      },
      {
        title: "建议摘要",
        key: "advice",
        render: (_: unknown, record: AdminResultListItem) => (
          <div className="max-w-[260px] text-sm leading-6 text-slate-600">
            {getAdviceSummary(displayAdviceById[record.id] || record.advice, record)}
          </div>
        ),
      },
      {
        title: "测评时间",
        key: "createdAt",
        render: (_: unknown, record: AdminResultListItem) => formatDateTime(record.createdAt),
      },
      {
        title: "操作",
        key: "actions",
        width: 120,
        render: (_: unknown, record: AdminResultListItem) => (
          <Button size="small" onClick={() => setSelectedResult(record)}>
            查看详情
          </Button>
        ),
      },
    ],
    [displayAdviceById, imageById],
  );

  const summaryCards = useMemo(() => {
    const mbtiSet = new Set(items.map((item) => item.mbti));
    const subtypeCount = new Set(items.map((item) => item.subtype)).size;
    const latestCreatedAt = items[0]?.createdAt ?? null;
    const hexagramCount = new Set(items.map((item) => item.hexagram.kingWen)).size;

    return [
      {
        title: "当前结果数",
        value: String(total),
        description: "符合筛选条件的测评记录总数",
      },
      {
        title: "类型覆盖",
        value: String(mbtiSet.size),
        description: "当前页出现的 MBTI 主类型数",
      },
      {
        title: "子类覆盖",
        value: String(subtypeCount),
        description: "当前页出现的子类类型数",
      },
      {
        title: "卦象覆盖",
        value: String(hexagramCount),
        description: "当前页出现的卦象数量",
      },
      {
        title: "最近记录",
        value: latestCreatedAt ? formatDateTime(latestCreatedAt) : "-",
        description: "当前页最晚一条测评时间",
      },
    ];
  }, [items, total]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Assessment Records</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">测评结果管理</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              快速筛选用户测评记录，查看 MBTI 主类型、子类与卦象信息，支持分页追踪结果分布。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag color="purple">结果总数 {total}</Tag>
            {mbti ? <Tag color="processing">MBTI: {mbti}</Tag> : <Tag>全部类型</Tag>}
            {query ? <Tag color="blue">关键词: {query}</Tag> : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">{card.title}</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{card.value}</div>
              <div className="mt-2 text-sm text-slate-500">{card.description}</div>
            </div>
          ))}
        </div>
      </div>

      <Card styles={{ body: { padding: 24 } }}>
        <div className="mb-5 flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">筛选与列表</h3>
            <p className="mt-1 text-sm text-slate-500">可组合关键词和 MBTI 筛选条件，快速定位指定测评记录。</p>
          </div>
          <Space size={8} wrap>
            <Input.Search
              allowClear
              placeholder="搜索用户、邮箱或类型"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onSearch={(value) => {
                setPage(1);
                setKeyword(value);
                setQuery(value);
              }}
              style={{ width: 300 }}
            />
            <Select
              allowClear
              placeholder="筛选 MBTI"
              value={mbti}
              options={mbtiOptions}
              onChange={(value) => {
                setPage(1);
                setMbti(value);
              }}
              style={{ width: 160 }}
            />
            <Button
              onClick={() => {
                setKeyword("");
                setQuery("");
                setMbti(undefined);
                setPage(1);
              }}
            >
              重置
            </Button>
          </Space>
        </div>

        {error ? <Alert type="error" showIcon title={error} className="mb-4" /> : null}

        <Table<AdminResultListItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 1320 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>

      <Drawer
        title={selectedResult ? `测评结果 #${selectedResult.id}` : "测评结果详情"}
        open={Boolean(selectedResult)}
        onClose={() => setSelectedResult(null)}
        destroyOnHidden
        style={{ maxWidth: 980, width: "calc(100vw - 32px)" }}
      >
        {selectedResult ? (
          <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            {(() => {
              const displayAdvice =
                displayAdviceById[selectedResult.id] ||
                buildAdvice(
                  selectedResult.mbti,
                  selectedResult.subtype,
                  selectedResult.hexagram,
                  selectedResult.scores,
                );

              return (
                <>
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3 text-sm font-medium text-slate-700">结果图片</div>
                      <AntImage
                        src={imageById[selectedResult.id]}
                        alt={`${selectedResult.type64} 结果图片`}
                        width={320}
                        className="rounded-2xl border border-slate-200"
                        preview={{
                          src: imageById[selectedResult.id],
                        }}
                      />
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-medium text-slate-700">维度分数</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(selectedResult.scores).map(([dimension, score]) => (
                          <Tag key={dimension} color={scoreColors[dimension] || "default"}>
                            {dimension}: {score > 0 ? "+" : ""}
                            {score}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Tag color="blue">{selectedResult.mbti}</Tag>
                      <Tag color="purple">{selectedResult.subtype}</Tag>
                      <Tag color="gold">{selectedResult.type64}</Tag>
                      <Tag>{selectedResult.hexagram.symbol} {selectedResult.hexagram.name}</Tag>
                    </div>

                    <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                      {selectedResult.hexagram.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      第 {selectedResult.hexagram.kingWen} 卦 · {formatDateTime(selectedResult.createdAt)}
                    </p>

                    <Divider />

                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="用户">{selectedResult.userName}</Descriptions.Item>
                      <Descriptions.Item label="邮箱">{selectedResult.userEmail}</Descriptions.Item>
                      <Descriptions.Item label="MBTI">{selectedResult.mbti}</Descriptions.Item>
                      <Descriptions.Item label="细分类型">{selectedResult.type64}</Descriptions.Item>
                      <Descriptions.Item label="上卦">
                        {selectedResult.hexagram.upper.symbol} {selectedResult.hexagram.upper.name}
                        （{selectedResult.hexagram.upper.xiang}）
                      </Descriptions.Item>
                      <Descriptions.Item label="下卦">
                        {selectedResult.hexagram.lower.symbol} {selectedResult.hexagram.lower.name}
                        （{selectedResult.hexagram.lower.xiang}）
                      </Descriptions.Item>
                      <Descriptions.Item label="六爻编码" span={2}>
                        {selectedResult.hexagram.bits}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    <div>
                      {(() => {
                        const analysis = buildPersonalityAnalysis(
                          selectedResult.mbti,
                          selectedResult.subtype,
                          selectedResult.scores,
                          selectedResult.hexagram,
                        );
                        const scoreExplanations = buildDimensionScoreExplanations(selectedResult.scores);

                        return (
                          <>
                            <div className="text-base font-semibold text-slate-950">人格分析</div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">人格基调</div>
                                <div className="mt-2 text-sm leading-7 text-slate-700">
                                  {analysis.baseline}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">天然优势</div>
                                <div className="mt-2 text-sm leading-7 text-slate-700">
                                  {analysis.strengths}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">决策提醒</div>
                                <div className="mt-2 text-sm leading-7 text-slate-700">
                                  {analysis.blindSpot}
                                </div>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="text-xs uppercase tracking-[0.16em] text-slate-500">卦象节奏</div>
                                <div className="mt-2 text-sm leading-7 text-slate-700">
                                  {analysis.rhythm}
                                </div>
                              </div>
                            </div>
                            <Divider />
                            <div className="text-base font-semibold text-slate-950">六维分数解释</div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              {scoreExplanations.map((item) => (
                                <div key={item.code} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Tag color="geekblue">{item.code}</Tag>
                                    <div className="text-sm font-medium text-slate-950">{item.name}</div>
                                    <Tag color={item.polarity === "balanced"
                                      ? "default"
                                      : item.polarity === "A"
                                        ? "green"
                                        : "volcano"}
                                    >
                                      {item.score > 0 ? "+" : ""}
                                      {item.score}
                                    </Tag>
                                  </div>
                                  <div className="mt-2 text-sm font-medium text-slate-700">
                                    {item.intensity} · {item.tendency}
                                  </div>
                                  <div className="mt-2 text-sm leading-7 text-slate-600">
                                    {item.summary}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}

                      <Divider />

                      <div className="text-base font-semibold text-slate-950">策略建议</div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">行动建议</div>
                          <div className="mt-2 text-sm leading-7 text-slate-700">
                            {displayAdvice.product || "暂无"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">决策建议</div>
                          <div className="mt-2 text-sm leading-7 text-slate-700">
                            {displayAdvice.investment || "暂无"}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">人际建议</div>
                          <div className="mt-2 text-sm leading-7 text-slate-700">
                            {displayAdvice.relationship || "暂无"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
