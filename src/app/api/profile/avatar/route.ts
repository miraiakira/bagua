import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 6 * 1024 * 1024;
const allowedTypes = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

type R2ContextResult =
  | { ok: false; missing: string[] }
  | { ok: true; bucket: string; publicBaseUrl: string; client: S3Client };

const getR2Context = (): R2ContextResult => {
  const accountId =
    process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId =
    process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey =
    process.env.R2_SECRET_ACCESS_KEY ||
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET || process.env.CLOUDFLARE_R2_BUCKET;
  const publicBaseUrl =
    process.env.R2_PUBLIC_BASE_URL || process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL;

  const missing: string[] = [];
  if (!accountId) missing.push("R2_ACCOUNT_ID");
  if (!accessKeyId) missing.push("R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("R2_SECRET_ACCESS_KEY");
  if (!bucket) missing.push("R2_BUCKET");
  if (!publicBaseUrl) missing.push("R2_PUBLIC_BASE_URL");

  if (missing.length > 0) {
    return { ok: false as const, missing };
  }

  const accountIdValue = accountId as string;
  const accessKeyIdValue = accessKeyId as string;
  const secretAccessKeyValue = secretAccessKey as string;
  const bucketValue = bucket as string;
  const publicBaseUrlValue = publicBaseUrl as string;

  return {
    ok: true as const,
    bucket: bucketValue,
    publicBaseUrl: publicBaseUrlValue,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountIdValue}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyIdValue,
        secretAccessKey: secretAccessKeyValue,
      },
    }),
  };
};

export async function POST(request: Request) {
  const r2 = getR2Context();
  if (!r2.ok) {
    return NextResponse.json(
      {
        message: `R2 配置缺失，请设置: ${r2.missing.join(", ")}`,
      },
      { status: 500 },
    );
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "缺少头像文件" }, { status: 400 });
  }
  if (file.size <= 0) {
    return NextResponse.json({ message: "头像文件为空" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: "头像文件过大，不能超过 6MB" },
      { status: 400 },
    );
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { message: "仅支持 JPG / PNG / WEBP / GIF 格式" },
      { status: 400 },
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const key = `avatars/${session.user.id}/${Date.now()}-${randomUUID()}.${extension}`;
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return NextResponse.json({
    url: `${r2.publicBaseUrl.replace(/\/+$/, "")}/${key}`,
  });
}
