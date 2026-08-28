import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function DashboardRedirectPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login?redirect=/dashboard");

  const role = session.user.role.toUpperCase();
  if (role === "ADMIN") redirect("/admin");
  if (role === "TENANT") redirect("/my-enquiries");
  redirect("/my-properties");
}
