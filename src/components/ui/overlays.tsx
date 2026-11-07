"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/* ============================================================================
 * 1. TABS
 * ========================================================================== */
export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ items, activeId, onChange, className = "" }: TabsProps) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80 ${className}`}
    >
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(item.id)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <span>{item.label}</span>
            {item.badge !== undefined ? (
              <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * 2. MODAL (Hộp thoại trung tâm)
 * ========================================================================== */
export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer ? (
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ============================================================================
 * 3. SHEET (Bottom Sheet trên Mobile / Drawer phải trên PC)
 * ========================================================================== */
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-end bg-slate-950/60 backdrop-blur-xs md:items-stretch"
      onClick={onClose}
    >
      <div
        className="flex max-h-[82dvh] w-full flex-col overflow-hidden rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl md:max-h-full md:max-w-md md:rounded-none md:rounded-l-2xl md:border-t-0 md:border-l dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-300 md:hidden dark:bg-slate-700" />
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 4. TOOLTIP / POPOVER (Hover trên PC, Chạm trên iPad/iPhone/Android)
 * ========================================================================== */
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const supportsHover = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  return (
    <span
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => {
        if (supportsHover()) setOpen(true);
      }}
      onMouseLeave={() => {
        if (supportsHover()) setOpen(false);
      }}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((prev) => !prev);
      }}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-full left-1/2 z-40 mb-2 w-64 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}

/* ============================================================================
 * 5. TOAST
 * ========================================================================== */
export interface ToastMessage {
  id: string;
  title: string;
  tone?: "info" | "success" | "error";
}

interface ToastContextValue {
  pushToast: (title: string, tone?: ToastMessage["tone"]) => void;
}

const ToastContext = createContext<ToastContextValue>({
  pushToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((title: string, tone: ToastMessage["tone"] = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div
        aria-live="polite"
        className="no-print pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${
              t.tone === "error"
                ? "border-rose-300 bg-rose-600 text-white"
                : t.tone === "success"
                  ? "border-emerald-300 bg-emerald-600 text-white"
                  : "border-slate-700 bg-slate-900 text-white dark:border-slate-700 dark:bg-slate-800"
            }`}
          >
            <span>{t.title}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
