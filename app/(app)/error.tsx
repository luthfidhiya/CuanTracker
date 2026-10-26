"use client";

import { useEffect } from "react";
import { CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={<CloudOff />}
      title="Data gagal dimuat"
      description="Google Sheets tidak bisa dihubungi atau sedang membatasi permintaan. Datamu aman; coba lagi sebentar."
      action={<Button onClick={() => retry()}>Coba lagi</Button>}
      className="py-24"
    />
  );
}
