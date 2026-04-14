"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useAppNav } from "@/hooks/useAppNav";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";

const DISMISS_DISTANCE_PX = 100;
/** px/ms; positive means pointer moving downward */
const DISMISS_VELOCITY_PX_PER_MS = 0.45;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export default function NavMoreSheet({ open, onClose }) {
  const { loginHref, user, isAuthenticated, logout } = useAppNav();

  const prefersReducedMotion = usePrefersReducedMotion();
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const handleRef = useRef(null);
  const dragRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    samples: [],
  });

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  useEffect(() => {
    if (!open) {
      setTranslateY(0);
      setIsDragging(false);
      dragRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        samples: [],
      };
    }
  }, [open]);

  const finishDrag = useCallback(
    (clientX, clientY) => {
      const d = dragRef.current;
      const deltaY = clientY - d.startY;
      const deltaX = clientX - d.startX;

      let shouldDismiss = false;
      if (
        deltaY > 0 &&
        Math.abs(deltaY) >= Math.abs(deltaX) &&
        (deltaY >= DISMISS_DISTANCE_PX ||
          (d.samples.length >= 2 &&
            (() => {
              const a = d.samples[d.samples.length - 1];
              const b = d.samples[d.samples.length - 2];
              const dt = a.t - b.t;
              if (dt <= 0) return false;
              const vy = (a.y - b.y) / dt;
              return vy > DISMISS_VELOCITY_PX_PER_MS;
            })()))
      ) {
        shouldDismiss = true;
      }

      dragRef.current = {
        pointerId: null,
        startX: 0,
        startY: 0,
        samples: [],
      };
      setIsDragging(false);
      setTranslateY(0);

      if (shouldDismiss) {
        onClose();
      }
    },
    [onClose],
  );

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    const el = handleRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const now = performance.now();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      samples: [{ t: now, y: e.clientY }],
    };
    setIsDragging(true);
    setTranslateY(0);
  };

  const handlePointerMove = (e) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    const dy = e.clientY - dragRef.current.startY;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > Math.abs(dy) * 1.2) {
      setTranslateY(0);
      return;
    }
    const now = performance.now();
    const next = [...dragRef.current.samples, { t: now, y: e.clientY }];
    const trimmed = next.slice(-6);
    dragRef.current = {
      ...dragRef.current,
      samples: trimmed,
    };
    setTranslateY(dy > 0 ? dy : 0);
  };

  const handlePointerUp = (e) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    const el = handleRef.current;
    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    finishDrag(e.clientX, e.clientY);
  };

  const handlePointerCancel = (e) => {
    if (dragRef.current.pointerId !== e.pointerId) return;
    const el = handleRef.current;
    try {
      el?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      samples: [],
    };
    setIsDragging(false);
    setTranslateY(0);
  };

  const panelTransition =
    prefersReducedMotion || isDragging
      ? "none"
      : "transform 0.2s ease-out";

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
        <DialogPanel
          className="w-full max-h-[85dvh] overflow-y-auto rounded-t-2xl border border-neutral-600 bg-neutral-800 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 shadow-xl"
          style={{
            transform: translateY > 0 ? `translateY(${translateY}px)` : undefined,
            transition: panelTransition,
          }}
        >
          <div
            ref={handleRef}
            role="presentation"
            className="mb-2 flex min-h-11 cursor-grab touch-none items-center justify-center active:cursor-grabbing px-4 pb-1 pt-1"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <span className="h-1.5 w-10 shrink-0 rounded-full bg-neutral-500" />
          </div>
          <DialogTitle className="sr-only">Account</DialogTitle>

          <div className="flex flex-col gap-3 px-4 py-4">
            {isAuthenticated ? (
              <>
                <p className="text-center text-base font-bold text-neutral-400">
                  {user?.username}
                </p>
                <RoundedButton
                  type="button"
                  className="w-full cursor-pointer !text-lg !font-bold bg-neutral-700 text-neutral-100 hover:bg-neutral-600"
                  onClick={handleLogout}
                >
                  Logout
                </RoundedButton>
              </>
            ) : (
              <RoundedButton
                href={loginHref}
                className="block w-full cursor-pointer text-center !text-lg !font-bold bg-red-300 text-neutral-800 hover:bg-red-400"
                onClick={onClose}
              >
                Login
              </RoundedButton>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
