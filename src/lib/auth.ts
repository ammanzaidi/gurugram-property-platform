import { cookies } from "next/headers";
import { PrismaClient } from "@/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

export async function getCurrentSession() {
  const token = (await cookies()).get("session_token")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session;
}

export async function requireRole(role: string) {
  return requireAnyRole([role]);
}

export async function requireAnyRole(roles: string[]) {
  const session = await getCurrentSession();
  if (!session) return { session: null, error: "Please login first.", status: 401 as const };
  if (!roles.some((role) => session.user.role.toUpperCase() === role.toUpperCase())) {
    return { session: null, error: "Access denied.", status: 403 as const };
  }
  return { session, error: null, status: 200 as const };
}

export { prisma };
