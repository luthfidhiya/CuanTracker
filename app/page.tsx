import { getDashboardData } from "./actions";
import { AppShell } from "@/components/AppShell";

// Ensure fresh data on every request
export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getDashboardData();
  return <AppShell initialData={data} />;
}
