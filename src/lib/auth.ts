import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { PostgresDialect } from "kysely";
import { Resend } from "resend";
import { dbPool } from "@/lib/db";

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3221";
const secret =
  process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-dev-secret-change-me";
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL ?? "Bagua <onboarding@resend.dev>";
const appName = process.env.APP_NAME ?? "Bagua";
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const changePasswordTokenTtlSec = Number(
  process.env.CHANGE_PASSWORD_TOKEN_TTL_SEC ?? "900",
);
const usedChangePasswordTokens = new Map<string, number>();

const base64UrlEncode = (value: string) =>
  Buffer.from(value, "utf8").toString("base64url");
const base64UrlDecode = (value: string) =>
  Buffer.from(value, "base64url").toString("utf8");
const signValue = (value: string) =>
  createHmac("sha256", secret).update(value).digest("base64url");

export const appDisplayName = appName;

export const createChangePasswordToken = (userId: string, email: string) => {
  const expiresAt = Date.now() + changePasswordTokenTtlSec * 1000;
  const payload = JSON.stringify({
    uid: userId,
    em: email,
    exp: expiresAt,
    nonce: randomBytes(16).toString("hex"),
  });
  const encodedPayload = base64UrlEncode(payload);
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

export const verifyChangePasswordToken = (token: string) => {
  const delimiterIndex = token.lastIndexOf(".");
  if (delimiterIndex <= 0 || delimiterIndex === token.length - 1) {
    return { valid: false as const };
  }
  const encodedPayload = token.slice(0, delimiterIndex);
  const signature = token.slice(delimiterIndex + 1);
  if (!encodedPayload || !signature) {
    return { valid: false as const };
  }
  const expectedSignature = signValue(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return { valid: false as const };
  }
  const decodedPayload = base64UrlDecode(encodedPayload);
  let userId = "";
  let email = "";
  let expiresAt = 0;
  try {
    const parsed = JSON.parse(decodedPayload) as {
      uid?: unknown;
      em?: unknown;
      exp?: unknown;
    };
    userId = typeof parsed.uid === "string" ? parsed.uid : "";
    email = typeof parsed.em === "string" ? parsed.em : "";
    expiresAt = typeof parsed.exp === "number" ? parsed.exp : Number.NaN;
  } catch {
    const [legacyUserId, legacyExpiresAtRaw] = decodedPayload.split(".");
    userId = legacyUserId ?? "";
    expiresAt = Number(legacyExpiresAtRaw);
  }
  if (!userId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return { valid: false as const };
  }
  return {
    valid: true as const,
    userId,
    email,
    expiresAt,
  };
};

export const consumeChangePasswordToken = (
  token: string,
  expiresAt: number,
) => {
  const now = Date.now();
  for (const [key, value] of usedChangePasswordTokens.entries()) {
    if (value <= now) {
      usedChangePasswordTokens.delete(key);
    }
  }
  if (usedChangePasswordTokens.has(token)) {
    return false;
  }
  usedChangePasswordTokens.set(token, expiresAt);
  return true;
};

export const sendSystemEmail = async ({
  to,
  subject,
  intro,
  actionLabel,
  actionUrl,
}: {
  to: string;
  subject: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
}) => {
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: resendFromEmail,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
        <h2 style="margin: 0 0 16px 0;">${appName}</h2>
        <p style="margin: 0 0 16px 0; color: #111827;">${intro}</p>
        <a href="${actionUrl}" style="display: inline-block; padding: 10px 16px; color: #ffffff; background: #4338ca; text-decoration: none; border-radius: 6px;">
          ${actionLabel}
        </a>
        <p style="margin: 20px 0 0 0; font-size: 12px; color: #6b7280;">如果按钮无法点击，请复制此链接到浏览器打开：${actionUrl}</p>
      </div>
    `,
    text: `${intro}\n\n${actionLabel}：${actionUrl}`,
  });
};

type AuthEmailCallbackParams = {
  user: {
    email: string;
  };
  url: string;
};

export const auth = betterAuth({
  database: new PostgresDialect({
    pool: dbPool,
  }),
  baseURL,
  secret,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }: AuthEmailCallbackParams) => {
      await sendSystemEmail({
        to: user.email,
        subject: `${appName} 密码重置`,
        intro: "你正在申请重置密码，请点击下面的按钮继续。",
        actionLabel: "重置密码",
        actionUrl: url,
      });
    },
  },
  emailVerification: resend
    ? {
        sendOnSignUp: true,
        sendVerificationEmail: async ({
          user,
          url,
        }: AuthEmailCallbackParams) => {
          await sendSystemEmail({
            to: user.email,
            subject: `${appName} 邮箱验证`,
            intro: "欢迎注册，请点击下面按钮完成邮箱验证。",
            actionLabel: "验证邮箱",
            actionUrl: url,
          });
        },
      }
    : undefined,
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
  plugins: [nextCookies()],
});
