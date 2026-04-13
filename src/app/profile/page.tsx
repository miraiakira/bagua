"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image as AntImage,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";
import type { UploadProps } from "antd";
import ImgCrop from "antd-img-crop";
import { authClient } from "@/lib/auth-client";

type HistoryItem = {
  id: number;
  mbti: string;
  subtype: string;
  type64: string;
  createdAt: string;
  scores: Record<string, number>;
  advice: {
    product?: string;
    investment?: string;
    relationship?: string;
  };
  hexagram: {
    bits?: string;
    kingWen: number;
    name: string;
    symbol: string;
    title: string;
    upper: {
      bits?: string;
      name: string;
      symbol: string;
      xiang: string;
    };
    lower: {
      bits?: string;
      name: string;
      symbol: string;
      xiang: string;
    };
  };
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

const getHexagramSummary = (item: HistoryItem) =>
  `${item.hexagram.upper.xiang}上${item.hexagram.lower.xiang}下，重在顺势判断、把握节奏。`;

const getPersonalitySummary = (item: HistoryItem) => {
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

const getHexagramBits = (item: HistoryItem) =>
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

const svgToPngDataUrl = (svg: string, size = 1024) =>
  new Promise<string>((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const image = new window.Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("无法创建 PNG 画布"));
        return;
      }
      context.drawImage(image, 0, 0, size, size);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("SVG 转 PNG 失败"));
    };
    image.src = objectUrl;
  });

const buildNftAsset = (item: HistoryItem): NFTAsset => {
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

export default function ProfilePage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const currentUser = sessionData?.user ?? null;
  const displayName = currentUser?.name?.trim() || currentUser?.email?.split("@")[0] || "用户";
  const avatarContent = displayName.slice(0, 1).toUpperCase();
  const avatarSrc = currentUser?.image || undefined;
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [nftPngById, setNftPngById] = useState<Record<number, string>>({});
  const [messageApi, messageContextHolder] = message.useMessage();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const historyCacheKey = currentUser ? `profile-history:${currentUser.id}` : "";
  const historyCards = useMemo(
    () =>
      history.map((item) => ({
        ...item,
        createdAtText: Number.isNaN(new Date(item.createdAt).getTime())
          ? item.createdAt
          : new Date(item.createdAt).toLocaleString("zh-CN", { hour12: false }),
        mbtiDisplayName: getMbtiDisplayName(item.mbti, item.subtype),
        hexagramSummary: getHexagramSummary(item),
        personalitySummary: getPersonalitySummary(item),
        scoreItems: Object.entries(item.scores || {}).map(([dimension, score]) => ({
          dimension,
          score,
          color: score > 0 ? "green" : score < 0 ? "volcano" : "default",
        })),
        nft: buildNftAsset(item),
      })),
    [history],
  );

  const downloadText = useCallback((filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, []);

  const downloadDataUrl = useCallback((filename: string, dataUrl: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  useEffect(() => {
    if (historyCards.length === 0) {
      setNftPngById({});
      return;
    }
    let cancelled = false;
    const generatePng = async () => {
      const entries = await Promise.all(
        historyCards.map(async (item) => {
          try {
            const pngDataUrl = await svgToPngDataUrl(item.nft.svg, 1024);
            return [item.id, pngDataUrl] as const;
          } catch {
            return [item.id, ""] as const;
          }
        }),
      );
      if (cancelled) {
        return;
      }
      const nextMap = entries.reduce<Record<number, string>>((acc, [id, png]) => {
        if (png) {
          acc[id] = png;
        }
        return acc;
      }, {});
      setNftPngById(nextMap);
    };
    void generatePng();
    return () => {
      cancelled = true;
    };
  }, [historyCards]);

  const onSignOut = async () => {
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  };

  const onAvatarUpload: UploadProps["customRequest"] = async (options) => {
    setAvatarUploading(true);
    try {
      const file = options.file as File;
      const formData = new FormData();
      formData.append("file", file, file.name || "avatar.jpg");
      const uploadResponse = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const uploadData = (await uploadResponse.json()) as { url?: string; message?: string };
      if (!uploadResponse.ok || !uploadData.url) {
        throw new Error(uploadData.message || "上传头像失败");
      }

      const updateResult = await authClient.updateUser({
        image: uploadData.url,
      });
      if (updateResult?.error) {
        throw new Error(updateResult.error.message || "保存头像失败");
      }

      messageApi.success("头像已更新");
      options.onSuccess?.({ url: uploadData.url });
      router.refresh();
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "头像上传失败";
      messageApi.error(messageText);
      options.onError?.(new Error(messageText));
    } finally {
      setAvatarUploading(false);
    }
  };

  const beforeAvatarUpload: UploadProps["beforeUpload"] = (file) => {
    if (!file.type.startsWith("image/")) {
      messageApi.error("请选择图片文件");
      return Upload.LIST_IGNORE;
    }
    if (file.size > 6 * 1024 * 1024) {
      messageApi.error("图片不能超过 6MB");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const fetchHistory = useCallback(
    async (silent = false) => {
      if (!currentUser) {
        setHistory([]);
        return;
      }
      if (!silent) {
        setHistoryLoading(true);
      }
      setHistoryError("");
      try {
        const response = await fetch("/api/mbti/history", { cache: "no-store" });
        const data = (await response.json()) as { items?: HistoryItem[]; message?: string };
        if (!response.ok) {
          throw new Error(data.message || "加载历史结果失败");
        }
        const nextHistory = Array.isArray(data.items) ? data.items : [];
        setHistory(nextHistory);
        if (historyCacheKey) {
          sessionStorage.setItem(historyCacheKey, JSON.stringify(nextHistory));
        }
      } catch (error) {
        setHistoryError(error instanceof Error ? error.message : "加载历史结果失败");
      } finally {
        if (!silent) {
          setHistoryLoading(false);
        }
      }
    },
    [currentUser, historyCacheKey],
  );

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    let hasCachedHistory = false;
    if (historyCacheKey) {
      const cachedHistory = sessionStorage.getItem(historyCacheKey);
      if (cachedHistory) {
        try {
          const parsedHistory = JSON.parse(cachedHistory) as unknown;
          if (Array.isArray(parsedHistory)) {
            setHistory(parsedHistory as HistoryItem[]);
            hasCachedHistory = true;
          }
        } catch {
          sessionStorage.removeItem(historyCacheKey);
        }
      }
    }
    void fetchHistory(hasCachedHistory);
  }, [currentUser, fetchHistory, historyCacheKey]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    const onFocus = () => {
      void fetchHistory(true);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchHistory(true);
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [currentUser, fetchHistory]);

  if (!currentUser) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Alert
          type="info"
          showIcon
          title="请先登录后查看个人页面"
          action={(
            <Space size={8}>
              <Link href="/signin">
                <Button size="small" type="primary">
                  去登录
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="small">
                  去注册
                </Button>
              </Link>
            </Space>
          )}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {messageContextHolder}
      <Space orientation="vertical" size={16} className="w-full">
        <Card>
          <Space orientation="vertical" size={16} className="w-full">
            <Space size={12}>
              <ImgCrop
                cropShape="round"
                quality={1}
                rotationSlider
                modalTitle="裁剪头像"
                modalOk="确认裁剪"
                modalCancel="取消"
              >
                <Upload
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  showUploadList={false}
                  maxCount={1}
                  customRequest={onAvatarUpload}
                  beforeUpload={beforeAvatarUpload}
                  disabled={avatarUploading}
                >
                  <div className="group relative h-20 w-20 cursor-pointer">
                    <Avatar size={80} src={avatarSrc}>
                      {avatarSrc ? null : avatarContent}
                    </Avatar>
                    <div
                      className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-xs text-white transition-opacity ${avatarUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                    >
                      {avatarUploading ? (
                        <Space size={6} align="center">
                          <Spin size="small" />
                          <span>上传中...</span>
                        </Space>
                      ) : (
                        "编辑头像"
                      )}
                    </div>
                  </div>
                </Upload>
              </ImgCrop>
              <div>
                <Typography.Title level={3} className="!mb-0">
                  {displayName}
                </Typography.Title>
                <Typography.Text type="secondary">{currentUser.email}</Typography.Text>
                <div>
                  <Typography.Text type="secondary" className="text-xs">
                    鼠标移到头像上可编辑
                  </Typography.Text>
                </div>
              </div>
            </Space>

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="用户 ID">{currentUser.id}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{currentUser.email}</Descriptions.Item>
              <Descriptions.Item label="邮箱已验证">
                {currentUser.emailVerified ? "是" : "否"}
              </Descriptions.Item>
              <Descriptions.Item label="昵称">{currentUser.name || "未设置"}</Descriptions.Item>
            </Descriptions>

            <Space>
              <Link href="/">
                <Button>返回首页</Button>
              </Link>
              <Link href="/profile/change-password">
                <Button type="primary">修改密码</Button>
              </Link>
              <Button danger onClick={onSignOut} loading={sessionPending}>
                退出登录
              </Button>
            </Space>
          </Space>
        </Card>

        <Card
          title="历史测评结果"
          extra={(
            <Button size="small" onClick={() => void fetchHistory(false)} loading={historyLoading}>
              刷新
            </Button>
          )}
        >
          {historyLoading ? (
            <div className="py-8 text-center">
              <Spin />
            </div>
          ) : historyError ? (
            <Alert type="error" showIcon title={historyError} />
          ) : historyCards.length === 0 ? (
            <Empty description="暂无测评记录" />
          ) : (
            <Space orientation="vertical" size={12} className="w-full">
              {historyCards.map((item) => (
                <Card key={item.id} size="small">
                  <Space orientation="vertical" size={8} className="w-full">
                    <Row gutter={[12, 12]} align="middle">
                      <Col xs={24} md={16}>
                        <Space size={8} wrap>
                          <Tag color="purple">{item.mbti}</Tag>
                          <Tag color="blue">{item.type64}</Tag>
                          <Tag color="gold">子型 {item.subtype}</Tag>
                          <Tag>
                            {item.hexagram.symbol} {item.hexagram.name}
                          </Tag>
                        </Space>
                        <Typography.Title level={5} className="!mt-2 !mb-1">
                          {item.hexagram.title}
                        </Typography.Title>
                        <Typography.Text type="secondary">
                          第 {item.hexagram.kingWen} 卦 · {item.createdAtText}
                        </Typography.Text>
                      </Col>
                      <Col xs={24} md={8}>
                        <Descriptions size="small" column={1} bordered>
                          <Descriptions.Item label="上卦">
                            {item.hexagram.upper.symbol} {item.hexagram.upper.name}（
                            {item.hexagram.upper.xiang}）
                          </Descriptions.Item>
                          <Descriptions.Item label="下卦">
                            {item.hexagram.lower.symbol} {item.hexagram.lower.name}（
                            {item.hexagram.lower.xiang}）
                          </Descriptions.Item>
                        </Descriptions>
                      </Col>
                    </Row>
                    <Divider className="!my-2" />
                    <Space size={8} wrap>
                      {item.scoreItems.map((scoreItem) => (
                        <Tag key={scoreItem.dimension} color={scoreItem.color}>
                          {scoreItem.dimension}: {scoreItem.score > 0 ? "+" : ""}
                          {scoreItem.score}
                        </Tag>
                      ))}
                    </Space>
                    <Space orientation="vertical" size={4} className="w-full">
                      <Typography.Text strong>策略建议</Typography.Text>
                      <Typography.Text>
                        产品：{item.advice.product || "暂无"}
                      </Typography.Text>
                      <Typography.Text>
                        投资：{item.advice.investment || "暂无"}
                      </Typography.Text>
                      <Typography.Text>
                        人际：{item.advice.relationship || "暂无"}
                      </Typography.Text>
                    </Space>
                    <Divider className="!my-2" />
                    <Space orientation="vertical" size={8} className="w-full">
                      <Typography.Text strong>
                        NFT 预览（稀有度 {item.nft.rarityScore}）
                      </Typography.Text>
                      {nftPngById[item.id] ? (
                        <AntImage
                          src={nftPngById[item.id]}
                          alt={`${item.hexagram.name} NFT 预览`}
                          width={320}
                          height={320}
                          className="rounded-md border border-gray-200"
                          preview={{
                            mask: "点击预览",
                            src: nftPngById[item.id],
                          }}
                        />
                      ) : (
                        <div className="flex h-[320px] w-[320px] items-center justify-center rounded-md border border-gray-200 bg-gray-50">
                          <Space orientation="vertical" align="center" size={8}>
                            <Spin size="small" />
                            <Typography.Text type="secondary">正在生成 PNG</Typography.Text>
                          </Space>
                        </div>
                      )}
                      <Space size={8} wrap>
                        <Button
                          size="small"
                          disabled={!nftPngById[item.id]}
                          onClick={() => {
                            downloadDataUrl(
                              `bagua-${item.id}-${item.hexagram.kingWen}.png`,
                              nftPngById[item.id],
                            );
                          }}
                        >
                          下载 NFT PNG
                        </Button>
                        <Button
                          size="small"
                          disabled={!nftPngById[item.id]}
                          onClick={() => {
                            const metadata = JSON.stringify(
                              {
                                name: item.nft.tokenName,
                                description: `基于测评结果生成的卦象 NFT：${item.hexagram.symbol}${item.hexagram.name}。主题为受阻、观势、借力、破局。`,
                                image: nftPngById[item.id],
                                external_url: "https://bagua.local/profile",
                                attributes: item.nft.traits,
                              },
                              null,
                              2,
                            );
                            downloadText(
                              `bagua-${item.id}-${item.hexagram.kingWen}.json`,
                              metadata,
                              "application/json",
                            );
                          }}
                        >
                          下载 Metadata
                        </Button>
                        {item.nft.traits.slice(6, 10).map((trait) => (
                          <Tag key={`${item.id}-${trait.trait_type}`} color="cyan">
                            {trait.trait_type}: {trait.value}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </Card>
      </Space>
    </div>
  );
}
