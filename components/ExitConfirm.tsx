"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Time window (ms) the user has to press Back a second time to actually exit.
const EXIT_WINDOW_MS = 2000;

interface ExitConfirmProps {
  /** True when the user is at the home screen (dashboard, nothing focused). */
  atRoot: boolean;
  /** Called to go back up to the home screen (clear focus, switch tab). */
  onNavigateBack: () => void;
}

/**
 * Intercepts the browser/PWA Back button:
 *  - Not at the home screen -> Back just navigates up to it (in-app), no
 *    confirmation needed.
 *  - At the home screen -> first Back shows a "press back again to exit"
 *    toast; only a second Back press within EXIT_WINDOW_MS actually exits.
 *
 * Every Back press re-arms the History API trap (pushState) so the stack
 * never runs out of entries — letting it run out is what makes some
 * Android PWA shells reload the page instead of closing on a further
 * Back press, instead of the intended clean exit.
 *
 * JS can't force-close an ordinary browser tab, but window.close() does
 * close an installed PWA running in standalone display mode, which is
 * the case this is meant for.
 */
export function ExitConfirm({ atRoot, onNavigateBack }: ExitConfirmProps) {
  const [showToast, setShowToast] = useState(false);
  const armedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atRootRef = useRef(atRoot);
  const onNavigateBackRef = useRef(onNavigateBack);

  useEffect(() => {
    atRootRef.current = atRoot;
    // Left the home screen (e.g. tapped a tab) while the toast was up —
    // the exit intent no longer applies.
    if (!atRoot) {
      armedRef.current = false;
      setShowToast(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [atRoot]);

  useEffect(() => {
    onNavigateBackRef.current = onNavigateBack;
  }, [onNavigateBack]);

  useEffect(() => {
    // Reserve one history entry so the first Back press lands on popstate
    // instead of leaving the app immediately.
    history.pushState({ __exitTrap: true }, "");

    const handlePopState = () => {
      // Re-arm immediately so the trap is always in place for the next
      // Back press, whether this one is confirmed or not.
      history.pushState({ __exitTrap: true }, "");

      if (!atRootRef.current) {
        // Not at the home screen: Back just goes up one level in-app.
        armedRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowToast(false);
        onNavigateBackRef.current();
        return;
      }

      if (armedRef.current) {
        // Second Back press within the window: actually exit.
        armedRef.current = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        setShowToast(false);
        window.close();
        return;
      }

      // First Back press at home: ask for confirmation.
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
