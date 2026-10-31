// File: nesora-app/src/lib/format.ts
// Same display helpers as the website (lib/format.ts there).

export function formatDuration(totalSeconds: number | null | undefined) {
  if (!totalSeconds || totalSeconds < 0) return "";
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function formatCount(n: number) {
  if (n < 1000) return String(n);
  const units: [number, string][] = [
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [size, suffix] of units) {
    if (n >= size) {
      const value = n / size;
      return `${value >= 10 ? Math.floor(value) : Math.floor(value * 10) / 10}${suffix}`;
    }
  }
  return String(n);
}

export function formatViews(n: number) {
  return `${formatCount(n)} ${n === 1 ? "view" : "views"}`;
}

export function timeAgo(date: Date | string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  const steps: [number, string][] = [
    [31_536_000, "y"],
    [2_592_000, "mo"],
    [604_800, "w"],
    [86_400, "d"],
    [3_600, "h"],
    [60, "m"],
  ];
  for (const [size, label] of steps) {
    if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
  }
  return "just now";
}

export function initials(name: string | null | undefined) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "N";
}

const MICRO_PER_MB = 1_000_000;

/** Storage arrives in µMB as a string (1 GB = 1,000 MB), same formatting as the website. */
export function formatStorage(microMb: string | number) {
  const mb = Number(microMb) / MICRO_PER_MB;
  if (mb >= 1000) return `${(mb / 1000).toFixed(mb >= 10_000 ? 1 : 2).replace(/\.?0+$/, "")} GB`;
  if (mb >= 10) return `${Math.floor(mb)} MB`;
  return `${mb.toFixed(2).replace(/\.?0+$/, "") || "0"} MB`;
}

export function formatStorageDetailed(microMb: string | number) {
  const mb = Number(microMb) / MICRO_PER_MB;
  if (mb >= 1000) {
    const gb = mb / 1000;
    return `${gb.toFixed(3)} GB (${Math.floor(mb)} MB)`;
  }
  if (mb >= 10) return `${mb.toFixed(1)} MB`;
  return `${mb.toFixed(2)} MB`;

}