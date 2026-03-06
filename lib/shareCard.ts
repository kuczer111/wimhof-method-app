import { formatTime } from "@/lib/format";
import { getBreathingSessions, getColdSessions } from "@/lib/storage";
import { calculateStreak } from "@/lib/analytics";

type AspectRatio = "9:16" | "1:1";

interface SessionCardData {
  retentionTimesSeconds: number[];
  totalDurationSeconds: number;
  rounds: number;
  streakDays: number;
  date: string;
}

interface ProgressCardData {
  retentionTimesAvg: number[]; // average per round over recent sessions
  coldStreakDays: number;
  breathingStreakDays: number;
  totalSessions: number;
  totalColdMinutes: number;
  bestRetention: number; // seconds
}

const COLORS = {
  bg: "#0f172a",
  cardBg: "#1e293b",
  accent: "#0ea5e9",
  accentLight: "#38bdf8",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  barFill: "#0ea5e9",
  barBg: "#334155",
  streakBadge: "#f59e0b",
  streakBadgeBg: "#78350f",
};

function getDimensions(ratio: AspectRatio): { w: number; h: number } {
  if (ratio === "9:16") return { w: 1080, h: 1920 };
  return { w: 1080, h: 1080 };
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawBranding(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = "500 28px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Wim Hof Method App", w / 2, h - 40);
}

function drawStreakBadge(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, streak: number
) {
  if (streak <= 0) return;
  const text = `${streak} day streak`;
  ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, sans-serif";
  const metrics = ctx.measureText(text);
  const padX = 24;
  const padY = 12;
  const bw = metrics.width + padX * 2;
  const bh = 48 + padY;

  drawRoundedRect(ctx, x - bw / 2, y, bw, bh, bh / 2);
  ctx.fillStyle = COLORS.streakBadgeBg;
  ctx.fill();

  ctx.fillStyle = COLORS.streakBadge;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + bh / 2);
}

function drawRetentionBars(
  ctx: CanvasRenderingContext2D,
  retentionSeconds: number[],
  x: number, y: number, width: number, height: number
) {
  const count = retentionSeconds.length;
  if (count === 0) return;

  const maxVal = Math.max(...retentionSeconds, 60);
  const gap = 20;
  const barWidth = Math.min(80, (width - gap * (count - 1)) / count);
  const totalBarsWidth = count * barWidth + (count - 1) * gap;
  const startX = x + (width - totalBarsWidth) / 2;

  for (let i = 0; i < count; i++) {
    const bx = startX + i * (barWidth + gap);
    const ratio = retentionSeconds[i] / maxVal;
    const barH = Math.max(8, ratio * height);

    // Background bar
    drawRoundedRect(ctx, bx, y, barWidth, height, 12);
    ctx.fillStyle = COLORS.barBg;
    ctx.fill();

    // Filled bar
    drawRoundedRect(ctx, bx, y + height - barH, barWidth, barH, 12);
    ctx.fillStyle = COLORS.barFill;
    ctx.fill();

    // Time label above bar
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 30px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(formatTime(retentionSeconds[i]), bx + barWidth / 2, y + height - barH - 12);

    // Round label below
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "500 26px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText(`R${i + 1}`, bx + barWidth / 2, y + height + 12);
  }
}

export function renderSessionCard(
  canvas: HTMLCanvasElement,
  data: SessionCardData,
  ratio: AspectRatio
): void {
  const { w, h } = getDimensions(ratio);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const centerX = w / 2;
  const isStory = ratio === "9:16";
  let cy = isStory ? 240 : 100;

  // Title
  ctx.fillStyle = COLORS.accentLight;
  ctx.font = "600 36px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("SESSION COMPLETE", centerX, cy);
  cy += 70;

  // Date
  const dateStr = new Date(data.date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = "500 30px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(dateStr, centerX, cy);
  cy += isStory ? 80 : 60;

  // Stats row
  const stats = [
    { label: "Duration", value: formatTime(data.totalDurationSeconds) },
    { label: "Rounds", value: String(data.rounds) },
  ];
  const statSpacing = 240;
  const statsStartX = centerX - (statSpacing * (stats.length - 1)) / 2;
  for (let i = 0; i < stats.length; i++) {
    const sx = statsStartX + i * statSpacing;
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 56px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(stats[i].value, sx, cy);
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "500 26px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(stats[i].label, sx, cy + 64);
  }
  cy += isStory ? 160 : 130;

  // Retention bar chart
  const barChartH = isStory ? 360 : 280;
  ctx.fillStyle = COLORS.text;
  ctx.font = "600 28px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("RETENTION TIMES", centerX, cy);
  cy += 50;
  drawRetentionBars(ctx, data.retentionTimesSeconds, 80, cy, w - 160, barChartH);
  cy += barChartH + 60;

  // Streak badge
  drawStreakBadge(ctx, centerX, cy, data.streakDays);

  // Branding
  drawBranding(ctx, w, h);
}

export function renderProgressCard(
  canvas: HTMLCanvasElement,
  data: ProgressCardData,
  ratio: AspectRatio
): void {
  const { w, h } = getDimensions(ratio);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  const centerX = w / 2;
  const isStory = ratio === "9:16";
  let cy = isStory ? 240 : 100;

  // Title
  ctx.fillStyle = COLORS.accentLight;
  ctx.font = "600 36px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("MY PROGRESS", centerX, cy);
  cy += isStory ? 100 : 70;

  // Stats grid
  const gridStats = [
    { label: "Sessions", value: String(data.totalSessions) },
    { label: "Best Retention", value: formatTime(data.bestRetention) },
    { label: "Cold Minutes", value: String(data.totalColdMinutes) },
    { label: "Breathing Streak", value: `${data.breathingStreakDays}d` },
  ];
  const colW = 400;
  const rowH = 120;
  for (let i = 0; i < gridStats.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const sx = centerX + (col === 0 ? -colW / 2 : colW / 2);
    const sy = cy + row * rowH;

    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 52px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(gridStats[i].value, sx, sy);
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "500 26px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(gridStats[i].label, sx, sy + 56);
  }
  cy += rowH * 2 + 40;

  // Average retention bars if available
  if (data.retentionTimesAvg.length > 0) {
    const barH = isStory ? 320 : 240;
    ctx.fillStyle = COLORS.text;
    ctx.font = "600 28px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("AVG RETENTION BY ROUND", centerX, cy);
    cy += 50;
    drawRetentionBars(ctx, data.retentionTimesAvg, 80, cy, w - 160, barH);
  }

  drawBranding(ctx, w, h);
}

export function getSessionCardData(
  retentionTimesSeconds: number[],
  totalDurationSeconds: number,
  rounds: number
): SessionCardData {
  const breathingSessions = getBreathingSessions();
  const coldSessions = getColdSessions();
  const allSessions = [
    ...breathingSessions.map((s) => ({ date: s.date })),
    ...coldSessions.map((s) => ({ date: s.date })),
  ];
  return {
    retentionTimesSeconds,
    totalDurationSeconds,
    rounds,
    streakDays: calculateStreak(allSessions),
    date: new Date().toISOString(),
  };
}

export function getProgressCardData(): ProgressCardData {
  const breathingSessions = getBreathingSessions();
  const coldSessions = getColdSessions();

  const breathingStreak = calculateStreak(breathingSessions);
  const coldStreak = calculateStreak(coldSessions);
  const totalColdMinutes = Math.round(
    coldSessions.reduce((sum, s) => sum + s.duration, 0) / 60
  );

  let bestRetention = 0;
  const roundTotals: Record<number, { sum: number; count: number }> = {};
  for (const s of breathingSessions) {
    for (let i = 0; i < s.retentionTimes.length; i++) {
      if (s.retentionTimes[i] > bestRetention) bestRetention = s.retentionTimes[i];
      if (!roundTotals[i]) roundTotals[i] = { sum: 0, count: 0 };
      roundTotals[i].sum += s.retentionTimes[i];
      roundTotals[i].count++;
    }
  }

  const maxRounds = Object.keys(roundTotals).length;
  const retentionTimesAvg: number[] = [];
  for (let i = 0; i < maxRounds; i++) {
    if (roundTotals[i]) {
      retentionTimesAvg.push(Math.round(roundTotals[i].sum / roundTotals[i].count));
    }
  }

  return {
    retentionTimesAvg,
    coldStreakDays: coldStreak,
    breathingStreakDays: breathingStreak,
    totalSessions: breathingSessions.length + coldSessions.length,
    totalColdMinutes,
    bestRetention,
  };
}

export async function shareOrDownload(canvas: HTMLCanvasElement): Promise<void> {
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png")
  );
  const file = new File([blob], "wimhof-session.png", { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
