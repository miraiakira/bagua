"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Radio,
  Row,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";
import { authClient } from "@/lib/auth-client";
import {
  buildDimensionScoreExplanations,
  buildPersonalityAnalysis,
  type Hexagram,
} from "@/lib/mbti-core";

type Question = {
  id: string;
  dimension: string;
  prompt: string;
  optionA: string;
  optionB: string;
};

type AssessResponse = {
  mbti: string;
  subtype: string;
  type64: string;
  scores: Record<string, number>;
  hexagram: Hexagram;
  advice: {
    product: string;
    investment: string;
    relationship: string;
  };
  timestamp: string;
};

type PointSummary = {
  balance: number;
  todayCheckedIn: boolean;
  dailyCheckinPoints: number;
};

type SubmitEvent = Parameters<NonNullable<React.ComponentProps<"form">["onSubmit"]>>[0];

const apiBase = "/api";

export default function Home() {
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, "A" | "B">>({});
  const [result, setResult] = useState<AssessResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [lastSubmittedAnswers, setLastSubmittedAnswers] = useState("");
  const [points, setPoints] = useState<PointSummary | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState("");
  const [checkinLoading, setCheckinLoading] = useState(false);
  const submitLockRef = useRef(false);
  const submissionRef = useRef<{ answers: string; id: string } | null>(null);
  const [messageApi, messageContextHolder] = message.useMessage();
  const currentUser = sessionData?.user ?? null;
  const userId = currentUser?.id;
  const authResolved = sessionHydrated && !sessionPending;

  useEffect(() => {
    setSessionHydrated(true);
  }, []);

  const fetchPoints = useCallback(async (silent = false) => {
    if (!userId) {
      setPoints(null);
      return;
    }
    if (!silent) {
      setPointsLoading(true);
    }
    setPointsError("");
    try {
      const response = await fetch("/api/points", { cache: "no-store" });
      const data = (await response.json()) as PointSummary & { message?: string };
      if (!response.ok) {
        throw new Error(data.message || "加载卦子失败");
      }
      setPoints(data);
    } catch (fetchError) {
      setPointsError(fetchError instanceof Error ? fetchError.message : "加载卦子失败");
    } finally {
      if (!silent) {
        setPointsLoading(false);
      }
    }
  }, [userId]);

  const onDailyCheckin = async () => {
    if (checkinLoading) {
      return;
    }
    setCheckinLoading(true);
    setPointsError("");
    try {
      const response = await fetch("/api/points/checkin", { method: "POST" });
      const data = (await response.json()) as {
        awarded?: boolean;
        points?: number;
        summary?: PointSummary;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(data.message || "签到失败");
      }
      if (data.summary) {
        setPoints(data.summary);
      } else {
        await fetchPoints(true);
      }
      if (data.awarded) {
        messageApi.success(`签到成功，获得 ${data.points || 0} 卦子`);
      } else {
        messageApi.info("今天已经签到过了");
      }
    } catch (checkinError) {
      const messageText = checkinError instanceof Error ? checkinError.message : "签到失败";
      setPointsError(messageText);
      messageApi.error(messageText);
    } finally {
      setCheckinLoading(false);
    }
  };

  useEffect(() => {
    if (!authResolved || !userId) {
      setPoints(null);
      setPointsError("");
      return;
    }
    void fetchPoints();
  }, [authResolved, fetchPoints, userId]);

  useEffect(() => {
    if (!authResolved) {
      return;
    }

    if (!currentUser) {
      setQuestions([]);
      setAnswers({});
      setResult(null);
      setLastSubmittedAnswers("");
      submissionRef.current = null;
      setQuestionsLoading(false);
      return;
    }

    const loadQuestions = async () => {
      setQuestionsLoading(true);
      setError("");
      try {
        const res = await fetch(`${apiBase}/mbti/questions`);
        if (!res.ok) {
          throw new Error("无法加载题目");
        }
        const data = await res.json();
        setQuestions(data.questions ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setQuestionsLoading(false);
      }
    };
    void loadQuestions();
  }, [authResolved, currentUser]);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers],
  );
  const totalQuestions = questions.length;
  const remainingCount = Math.max(totalQuestions - answeredCount, 0);
  const progressPercent = totalQuestions === 0
    ? 0
    : Math.round((answeredCount / totalQuestions) * 100);

  const serializedAnswers = useMemo(
    () => JSON.stringify(questions.map((question) => [question.id, answers[question.id]])),
    [answers, questions],
  );
  const isCurrentAnswerSubmitted = serializedAnswers === lastSubmittedAnswers;
  const canSubmit = totalQuestions > 0
    && answeredCount === totalQuestions
    && !isCurrentAnswerSubmitted;
  const displayName = currentUser?.name?.trim() || currentUser?.email?.split("@")[0] || "用户";
  const resultAnalysis = useMemo(
    () => (result
      ? buildPersonalityAnalysis(result.mbti, result.subtype, result.scores, result.hexagram)
      : null),
    [result],
  );
  const scoreExplanations = useMemo(
    () => (result ? buildDimensionScoreExplanations(result.scores) : []),
    [result],
  );

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!canSubmit || loading || submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    setLoading(true);
    setError("");
    try {
      if (submissionRef.current?.answers !== serializedAnswers) {
        submissionRef.current = {
          answers: serializedAnswers,
          id: crypto.randomUUID(),
        };
      }
      const res = await fetch(`${apiBase}/mbti/assess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          submissionId: submissionRef.current.id,
        }),
      });
      if (!res.ok) {
        throw new Error("测评失败，请重试");
      }
      const data = (await res.json()) as AssessResponse;
      setResult(data);
      setLastSubmittedAnswers(serializedAnswers);
      await fetchPoints(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 flex flex-col gap-4">
      {messageContextHolder}
      {authResolved && !currentUser && (
        <Alert
          className="mb-4"
          type="info"
          showIcon
          title="请先登录后开始测评（登录入口在顶部导航）"
        />
      )}

      <Space orientation="vertical" size={16} className="w-full">
        <Card>
          <Space orientation="vertical" size={16} className="w-full">
            <Row gutter={[20, 20]} align="middle">
              <Col xs={24} md={currentUser ? 14 : 24}>
                <Space orientation="vertical" size={10} className="w-full">
                  <Tag color="purple" className="w-fit">认知问卷</Tag>
                  <Typography.Title level={2} className="!mb-0">
                    MBTI × 卦象 决策测评
                  </Typography.Title>
                  <Typography.Paragraph className="!mb-0">
                    完成 18 题后，系统会输出你的 MBTI、64 子型与对应卦象，并给出行动、决策、人际三类策略建议。
                  </Typography.Paragraph>
                  {currentUser && (
                    <Space size={10} align="center" className="pt-1">
                      <Avatar size={40} src={currentUser.image || undefined}>
                        {currentUser.image ? null : displayName.slice(0, 1).toUpperCase()}
                      </Avatar>
                      <Space orientation="vertical" size={0}>
                        <Typography.Text strong>欢迎回来，{displayName}</Typography.Text>
                        <Typography.Text type="secondary" className="text-xs">
                          {currentUser.email}
                        </Typography.Text>
                      </Space>
                    </Space>
                  )}
                </Space>
              </Col>
              {currentUser && (
                <Col xs={24} md={10}>
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <Space orientation="vertical" size={12} className="w-full">
                      <div className="flex items-start justify-between gap-3">
                        <Statistic
                          title="我的卦子"
                          value={points?.balance ?? 0}
                          loading={pointsLoading && !points}
                        />
                        <Tag color={points?.todayCheckedIn ? "success" : "gold"}>
                          {points?.todayCheckedIn ? "今日已签到" : "今日未签到"}
                        </Tag>
                      </div>
                      <Button
                        type="primary"
                        block
                        loading={checkinLoading}
                        disabled={pointsLoading || Boolean(points?.todayCheckedIn)}
                        onClick={() => void onDailyCheckin()}
                      >
                        {points?.todayCheckedIn
                          ? "今日已领取"
                          : `签到 +${points?.dailyCheckinPoints ?? 5} 卦子`}
                      </Button>
                    </Space>
                    {pointsError && (
                      <Alert className="mt-3" type="error" showIcon title={pointsError} />
                    )}
                  </div>
                </Col>
              )}
            </Row>
            <Divider className="!my-0" />
            <Row gutter={[12, 12]}>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic title="完成率" value={progressPercent} suffix="%" />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic title="已回答" value={answeredCount} />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic title="剩余题数" value={remainingCount} />
                </Card>
              </Col>
            </Row>
          </Space>
        </Card>

        <form onSubmit={onSubmit}>
          <Space orientation="vertical" size={12} className="w-full">
            {questions.map((question, index) => (
              <Card
                key={question.id}
                title={
                  <Space size={8}>
                    <Tag color="blue">Q{index + 1}</Tag>
                    <Tag color="geekblue">{question.dimension}</Tag>
                    <Typography.Text strong>{question.prompt}</Typography.Text>
                  </Space>
                }
              >
                <Radio.Group
                  value={answers[question.id]}
                  onChange={(event) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: event.target.value as "A" | "B",
                    }))
                  }
                >
                  <Space orientation="vertical" size={12}>
                    <Radio value="A">{question.optionA}</Radio>
                    <Radio value="B">{question.optionB}</Radio>
                  </Space>
                </Radio.Group>
              </Card>
            ))}

            <Card>
              <Space
                orientation="vertical"
                size={12}
                className="w-full"
              >
                <Typography.Text>
                  当前进度：{answeredCount}/{totalQuestions}（{progressPercent}%）
                </Typography.Text>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={!canSubmit || !currentUser || questionsLoading}
                  block
                >
                  {isCurrentAnswerSubmitted ? "当前答案已提交" : "生成 MBTI 与对应卦象"}
                </Button>
              </Space>
            </Card>
          </Space>
        </form>

        {authResolved && currentUser && questionsLoading && (
          <Alert title="题目加载中..." type="info" showIcon />
        )}
        {error && <Alert title={error} type="error" showIcon />}

        {result && (
          <Card title="测评结果">
            <Space orientation="vertical" size={16} className="w-full">
              <Row gutter={[12, 12]}>
                <Col xs={24} md={12}>
                  <Card size="small" title="人格类型">
                    <Space align="baseline" size={8}>
                      <Typography.Title level={1} className="!mb-0">
                        {result.mbti}
                      </Typography.Title>
                      <Tag color="purple">{result.type64}</Tag>
                    </Space>
                    <Divider className="!my-3" />
                    <Typography.Text>子类型：{result.subtype}</Typography.Text>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card size="small" title="对应卦象">
                    <Space orientation="vertical" size={8}>
                      <Space align="center">
                        <Typography.Title level={1} className="!mb-0">
                          {result.hexagram.symbol}
                        </Typography.Title>
                        <Space orientation="vertical" size={0}>
                          <Typography.Text strong>{result.hexagram.title}</Typography.Text>
                          <Typography.Text type="secondary">
                            {result.hexagram.name}卦
                          </Typography.Text>
                        </Space>
                      </Space>
                      <Space wrap size={8}>
                        <Tag>文王序 {result.hexagram.kingWen}</Tag>
                        <Tag>伏羲序 {result.hexagram.fuxiIndex}</Tag>
                      </Space>
                      <Typography.Text>
                        上卦 {result.hexagram.upper.name}
                        {result.hexagram.upper.symbol} / 下卦 {result.hexagram.lower.name}
                        {result.hexagram.lower.symbol}
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        六爻编码（下→上）：{result.hexagram.bits}
                      </Typography.Text>
                    </Space>
                  </Card>
                </Col>
              </Row>
              <Card size="small" title="六维分数解释">
                <Row gutter={[12, 12]}>
                  {scoreExplanations.map((item) => (
                    <Col xs={24} md={12} xl={8} key={item.code}>
                      <Card size="small">
                        <Space orientation="vertical" size={6} className="w-full">
                          <Space size={8} wrap>
                            <Tag color="geekblue">{item.code}</Tag>
                            <Typography.Text strong>{item.name}</Typography.Text>
                            <Tag color={item.polarity === "balanced"
                              ? "default"
                              : item.polarity === "A"
                                ? "green"
                                : "volcano"}
                            >
                              {item.score > 0 ? "+" : ""}
                              {item.score}
                            </Tag>
                          </Space>
                          <Typography.Text>
                            {item.intensity} · {item.tendency}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            {item.summary}
                          </Typography.Text>
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
              <Card size="small" title="策略建议">
                <Space orientation="vertical" size={8}>
                  {resultAnalysis && (
                    <>
                      <Typography.Paragraph className="!mb-0">
                        <Typography.Text strong>人格基调：</Typography.Text>
                        {resultAnalysis.baseline}
                      </Typography.Paragraph>
                      <Typography.Paragraph className="!mb-0">
                        <Typography.Text strong>天然优势：</Typography.Text>
                        {resultAnalysis.strengths}
                      </Typography.Paragraph>
                      <Typography.Paragraph className="!mb-0">
                        <Typography.Text strong>决策提醒：</Typography.Text>
                        {resultAnalysis.blindSpot}
                      </Typography.Paragraph>
                      <Typography.Paragraph className="!mb-0">
                        <Typography.Text strong>卦象节奏：</Typography.Text>
                        {resultAnalysis.rhythm}
                      </Typography.Paragraph>
                      <Divider className="!my-1" />
                    </>
                  )}
                  <Typography.Paragraph className="!mb-0">
                    <Typography.Text strong>行动建议：</Typography.Text>
                    {result.advice.product}
                  </Typography.Paragraph>
                  <Typography.Paragraph className="!mb-0">
                    <Typography.Text strong>决策建议：</Typography.Text>
                    {result.advice.investment}
                  </Typography.Paragraph>
                  <Typography.Paragraph className="!mb-0">
                    <Typography.Text strong>人际建议：</Typography.Text>
                    {result.advice.relationship}
                  </Typography.Paragraph>
                </Space>
              </Card>
            </Space>
          </Card>
        )}
      </Space>
    </div>
  );
}
