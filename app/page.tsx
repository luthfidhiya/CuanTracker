import { AppShell } from "@/components/AppShell";
import { PrivacyProvider } from "@/components/PrivacyContext";
import { RefreshProvider } from "@/components/RefreshContext";

export default function Home() {
  return (
    <PrivacyProvider>
      <RefreshProvider>
        <AppShell />
      </RefreshProvider>
    </PrivacyProvider>
  );
}
