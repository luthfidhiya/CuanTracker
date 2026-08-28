"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Time window (ms) the user has to press Back a second time to actually exit.
const EXIT_WINDOW_MS = 2000;

/**
 * Intercepts the browser/PWA Back button so the app isn't closed on the
 * first press. Shows a "press back again to exit" toast instead; only a
 * second Back press within EXIT_WINDOW_MS is allowed to go through.
 *
 * Note: this uses the browser History API trick (pushState + popstate).
 * JS cannot force-close a tab/PWA window directly — the second Back press
 * simply isn't intercepted, letting the browser/OS handle it normally
 * (which is what actually closes/backgrounds an installed PWA).
 */
export function ExitConfirm() {
  const [showToast, setShowToast] = useState(false);
  const armedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reserve one history entry so the first Back press lands on popstate
    // instead of leaving the app immediately.
    history.pushState({ __exitTrap: true }, "");

    const handlePopState = () => {
      if (armedRef.current) {
        // Second Back press within the window: let it proceed for real.
        armedRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowToast(false);
        return;
      }

      // First Back press: swallow it, re-arm the trap, ask for confirmation.
      history.pushState({ __exitTrap: true }, "");
      armedRef.current = true;
      setShowToast(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        armedRef.current = false;
        setShowToast(false);
      }, EXIT_WINDOW_MS);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: 16, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 16, x: "-50%" }}
          className="fixed bottom-6 left-1/2 z-100 rounded-full border border-slate-700 bg-slate-800/95 px-5 py-3 text-sm font-medium text-white shadow-2xl backdrop-blur"
        >
          Tekan kembali sekali lagi untuk keluar
        </motion.div>
      )}
    </AnimatePresence>
  );
}
