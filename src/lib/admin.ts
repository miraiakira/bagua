import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const parseAdminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const isAdminEmail = (email?: string | null) => {
  if (!email) {
    return false;
  }
  return parseAdminEmails().includes(email.trim().toLowerCase());
};

export const getAdminSession = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !isAdminEmail(session.user.email)) {
    return null;
  }
  return session;
};

const parsePositiveInteger = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
};

export const parsePagination = (searchParams: URLSearchParams) => {
  const page = parsePositiveInteger(searchParams.get("page"), DEFAULT_PAGE);
  const pageSize = Math.min(
    parsePositiveInteger(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE,
  );
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
};
