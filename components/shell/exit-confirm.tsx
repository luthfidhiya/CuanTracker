"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

const EXIT_WINDOW_MS = 2000;
const STANDALONE_QUERY = "(display-mode: standalone)";

function subscribeStandalone(cb: () => void) {
  const mql = window.matchMedia(STANDALONE_QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function isStandalone() {
  return (
    window.matchMedia(STANDALONE_QUERY).matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * In the installed app, pressing Back on Ringkasan first shows "press again to
 * exit" instead of closing immediately. Elsewhere Back is normal browser history.
 */
export function ExitConfirm() {
  const pathname = usePathname();
  const standalone = useSyncExternalStore(subscribeStandalone, isStandalone, () => false);
  return standalone && pathname === "/" ? <ExitTrap /> : null;
}

function ExitTrap() {
  useEffect(() => {
    let armedUntil = 0;
    // One spare history entry so the first Back lands here instead of leaving.
    history.pushState({ __exitTrap: true }, "");

    const onPopState = () => {
      if (Date.now() < armedUntil) {
        window.close();
        return;
      }
      // Re-arm so the stack never runs out; some Android shells reload instead of closing when it does.
      history.pushState({ __exitTrap: true }, "");
      armedUntil = Date.now() + EXIT_WINDOW_MS;
      toast("Tekan kembali sekali lagi untuk keluar", { id: "exit-confirm", duration: EXIT_WINDOW_MS });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return null;
}
