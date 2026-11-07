"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { IconButton } from "./primitives";

const THEME_STORAGE_KEY = "y4-theme";
const FONT_SCALE_STORAGE_KEY = "y4-font-scale";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark =
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
  };

  return (
    <IconButton
      label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      variant="outline"
      onClick={toggle}
    >
      {dark ? (
        <span aria-hidden="true" className="text-base">☀️</span>
      ) : (
        <span aria-hidden="true" className="text-base">🌙</span>
      )}
    </IconButton>
  );
}

const SCALES: { label: string; value: number }[] = [
  { label: "A-", value: 0.92 },
  { label: "A", value: 1 },
  { label: "A+", value: 1.12 },
];

export function FontSizeControl() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem(FONT_SCALE_STORAGE_KEY));
    if (saved && !Number.isNaN(saved)) {
      setScale(saved);
      document.documentElement.style.setProperty("--font-scale", String(saved));
    }
  }, []);

  const applyScale = (next: number) => {
    setScale(next);
    document.documentElement.style.setProperty("--font-scale", String(next));
    window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(next));
  };

  return (
    <div
      role="group"
      aria-label="Điều chỉnh cỡ chữ"
      className="inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
    >
      {SCALES.map((item) => {
        const active = Math.abs(scale - item.value) < 0.01;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => applyScale(item.value)}
            className={`min-h-9 min-w-9 rounded-lg px-2.5 text-xs font-semibold transition-colors ${
              active
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export interface AppShellProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  title,
  subtitle,
  backHref,
  backLabel = "Dashboard",
  actions,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <span aria-hidden="true">←</span>
                <span className="hidden sm:inline">{backLabel}</span>
              </Link>
            ) : null}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl dark:text-white">
                  {title}
                </h1>
              </div>
              {subtitle ? (
                <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">{subtitle}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <FontSizeControl />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
