"use client";

/**
 * useCountdown — đồng hồ thi dựa trên mốc kết thúc tuyệt đối.
 *
 * - Số giây còn lại luôn tính từ `endsAt - Date.now()`, nên ẩn tab, khoá máy hay tải lại trang
 *   đều không làm lệch đồng hồ.
 * - Chế độ practice có thể tạm dừng: khi `pausedRemainingSec` khác null thì đồng hồ đứng yên ở giá trị đó.
 * - Hỗ trợ đồng hồ trạm OSCE (`stationEndsAt`) chạy song song với đồng hồ tổng.
 * - An toàn SSR: trước khi mount, `isReady = false` và không bao giờ báo hết giờ.
 *   UI nên hiển thị "--:--" khi `!isReady`.
 */

import { useEffect, useRef, useState } from "react";

export const WARNING_5_MIN_SEC = 300;
export const WARNING_1_MIN_SEC = 60;

/** Số giây còn lại (làm tròn lên, không âm). `endsAt` null/không hợp lệ → 0. */
export function computeRemainingSec(endsAt: string | null | undefined, nowMs: number): number {
  if (!endsAt) return 0;
  const end = Date.parse(endsAt);
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.ceil((end - nowMs) / 1000));
}

/** 75 → "01:15"; 3725 → "1:02:05". */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export interface UseCountdownOptions {
  /** Mốc kết thúc tổng (ISO 8601). */
  endsAt: string | null | undefined;
  mode?: "exam" | "practice";
  /** Chỉ có hiệu lực khi mode === "practice": đồng hồ đứng yên ở giá trị này. */
  pausedRemainingSec?: number | null;
  /** Mốc kết thúc trạm hiện tại (thi trạm). */
  stationEndsAt?: string | null;
  /** Gọi đúng 1 lần cho mỗi giá trị `endsAt` khi đồng hồ tổng về 0. */
  onExpire?: () => void;
  /** Gọi đúng 1 lần cho mỗi giá trị `stationEndsAt` khi đồng hồ trạm về 0. */
  onStationExpire?: () => void;
  /** Mặc định 250ms để số giây đổi đúng nhịp. */
  tickMs?: number;
  /** Cho test: nguồn thời gian. */
  now?: () => number;
}

export interface CountdownState {
  isReady: boolean;
  isPaused: boolean;
  remainingSec: number;
  formatted: string;
  isWarning5Min: boolean;
  isWarning1Min: boolean;
  isExpired: boolean;
  /** null nếu không có trạm đang chạy */
  stationRemainingSec: number | null;
  stationFormatted: string | null;
  isStationWarning1Min: boolean;
  isStationExpired: boolean;
}

export function useCountdown(options: UseCountdownOptions): CountdownState {
  const {
    endsAt,
    mode = "exam",
    pausedRemainingSec = null,
    stationEndsAt = null,
    onExpire,
    onStationExpire,
    tickMs = 250,
    now = Date.now,
  } = options;

  const isPaused = mode === "practice" && pausedRemainingSec !== null;
  const [nowMs, setNowMs] = useState<number | null>(null);

  const nowRef = useRef(now);
  nowRef.current = now;
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const onStationExpireRef = useRef(onStationExpire);
  onStationExpireRef.current = onStationExpire;

  // Nhịp đồng hồ + cập nhật ngay khi tab hiện lại.
  useEffect(() => {
    const update = (): void => setNowMs(nowRef.current());
    update();
    if (isPaused) return undefined;
    const id = setInterval(update, tickMs);
    const onVisible = (): void => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isPaused, tickMs]);

  const isReady = nowMs !== null;
  const remainingSec = !isReady
    ? Math.max(0, pausedRemainingSec ?? 0)
    : isPaused
      ? Math.max(0, Math.ceil(pausedRemainingSec ?? 0))
      : computeRemainingSec(endsAt, nowMs);
  const isExpired = isReady && !isPaused && Boolean(endsAt) && remainingSec === 0;

  const hasStation = Boolean(stationEndsAt);
  const stationRemainingSec = hasStation && isReady && !isPaused ? computeRemainingSec(stationEndsAt, nowMs) : null;
  const isStationExpired = stationRemainingSec === 0;

  // Gọi onExpire đúng 1 lần cho mỗi endsAt.
  const firedExpireFor = useRef<string | null>(null);
  useEffect(() => {
    if (isExpired && endsAt && firedExpireFor.current !== endsAt) {
      firedExpireFor.current = endsAt;
      onExpireRef.current?.();
    }
  }, [isExpired, endsAt]);

  const firedStationFor = useRef<string | null>(null);
  useEffect(() => {
    if (isStationExpired && stationEndsAt && firedStationFor.current !== stationEndsAt) {
      firedStationFor.current = stationEndsAt;
      onStationExpireRef.current?.();
    }
  }, [isStationExpired, stationEndsAt]);

  return {
    isReady,
    isPaused,
    remainingSec,
    formatted: isReady ? formatClock(remainingSec) : "--:--",
    isWarning5Min: isReady && !isExpired && remainingSec <= WARNING_5_MIN_SEC,
    isWarning1Min: isReady && !isExpired && remainingSec <= WARNING_1_MIN_SEC,
    isExpired,
    stationRemainingSec,
    stationFormatted: stationRemainingSec === null ? null : formatClock(stationRemainingSec),
    isStationWarning1Min:
      stationRemainingSec !== null && stationRemainingSec > 0 && stationRemainingSec <= WARNING_1_MIN_SEC,
    isStationExpired,
  };
}
