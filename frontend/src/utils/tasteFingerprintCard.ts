import { categoryColor } from "./vizColors";

interface GenreShare {
  genre: string;
  pct: number;
}

interface CardData {
  displayName: string;
  summary: string;
  topGenres: GenreShare[];
}

const WIDTH = 1080;
const HEIGHT = 1350;
const MARGIN = 90;

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function renderTasteFingerprintCard(data: CardData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, "#1a0a2e");
  bg.addColorStop(1, "#0d0710");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "#c084fc";
  ctx.font = "600 32px system-ui, sans-serif";
  ctx.fillText("VibeRoute AI", MARGIN, 110);

  ctx.fillStyle = "#f3f4f6";
  ctx.font = "700 56px system-ui, sans-serif";
  ctx.fillText(`${data.displayName}'s`, MARGIN, 200);
  ctx.fillText("Taste Fingerprint", MARGIN, 270);

  ctx.fillStyle = "#d1d5db";
  ctx.font = "italic 30px system-ui, sans-serif";
  const summaryLines = wrapText(ctx, data.summary, WIDTH - MARGIN * 2).slice(0, 4);
  let y = 350;
  for (const line of summaryLines) {
    ctx.fillText(line, MARGIN, y);
    y += 42;
  }

  y += 30;
  const barMaxWidth = WIDTH - MARGIN * 2;
  const barHeight = 22;

  for (const genre of data.topGenres.slice(0, 8)) {
    const color = categoryColor(genre.genre);

    ctx.fillStyle = "#f3f4f6";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText(genre.genre, MARGIN, y);

    ctx.font = "600 26px system-ui, sans-serif";
    const pctText = `${Math.round(genre.pct)}%`;
    const pctWidth = ctx.measureText(pctText).width;
    ctx.fillText(pctText, WIDTH - MARGIN - pctWidth, y);

    y += 16;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    roundRect(ctx, MARGIN, y, barMaxWidth, barHeight, barHeight / 2);
    ctx.fill();

    ctx.fillStyle = color;
    roundRect(ctx, MARGIN, y, Math.max(barHeight, (barMaxWidth * genre.pct) / 100), barHeight, barHeight / 2);
    ctx.fill();

    y += barHeight + 40;
  }

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "22px system-ui, sans-serif";
  ctx.fillText("Built on the Spotify Web API — vibe-route.app", MARGIN, HEIGHT - 60);

  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, h / 2, w / 2 > 0 ? w / 2 : r);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
