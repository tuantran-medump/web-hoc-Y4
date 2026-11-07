export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function triggerPrintPdf(): void {
  if (typeof window !== "undefined") {
    window.print();
  }
}
