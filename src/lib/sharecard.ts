/**
 * Client-side share-card renderer. Draws 1080x1920 story cards on a canvas
 * and exports PNG blobs. Follows the v2 token system exactly.
 */
import qrcode from "qrcode-generator";

const W = 1080;
const H = 1920;
const PAD = 64;

// v2 tokens (canvas can't read CSS vars from another document context reliably,
// so they're mirrored here — keep in sync with globals.css)
const BLACK = "#050505";
const WHITE = "#f4f4f2";
const GREY_1 = "#9b9b96";
const GREY_2 = "#3a3a37";
const BONE = "#d9d6cf";
const SIGNAL = "#ff3b1f";

export type ProfileCardData = {
  displayName: string;
  username: string;
  city: string;
  roles: string[]; // human labels
  genres: string[];
  avatarUrl: string | null;
  foundingMember: boolean;
  profileUrl: string;
  siteHost: string;
};

export type ShowCardData = {
  title: string;
  dateLine: string; // "FRI JUN 27 — 7:00 PM"
  venueLine: string; // "LAUNCHPAD — $10 — ALL AGES"
  isTonight: boolean;
  city: string;
  flyerUrl: string | null;
  lineup: string[]; // display names
  showUrl: string;
  siteHost: string;
};

type Fonts = { display: string; mono: string };

async function loadFonts(): Promise<Fonts> {
  const css = getComputedStyle(document.documentElement);
  const display = css.getPropertyValue("--font-display").trim() || "sans-serif";
  const mono = css.getPropertyValue("--font-mono").trim() || "monospace";
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load(`400 100px ${display}`),
    document.fonts.load(`400 100px ${mono}`),
    document.fonts.load(`500 100px ${mono}`),
  ]).catch(() => {
    // fonts.load can reject on synthetic families; fonts.ready already waited
  });
  return { display, mono };
}

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null); // missing image -> clean fallback, never a broken card
    img.src = url;
  });
}

/** Bake film grain over the whole card (~4% alpha), matching the site texture. */
function drawGrain(ctx: CanvasRenderingContext2D) {
  const size = 160;
  const noise = document.createElement("canvas");
  noise.width = size;
  noise.height = size;
  const nctx = noise.getContext("2d")!;
  const data = nctx.createImageData(size, size);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = ctx.createPattern(noise, "repeat")!;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Draw mono-caps text with manual letter tracking (canvas letterSpacing is not universal). */
function drawMono(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  size: number,
  color: string,
  fonts: Fonts,
  weight = 500
) {
  const upper = text.toUpperCase();
  ctx.font = `${weight} ${size}px ${fonts.mono}`;
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  const tracking = size * 0.1;
  const widths = Array.from(upper).map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (upper.length - 1);
  let x = centerX - total / 2;
  Array.from(upper).forEach((ch, i) => {
    ctx.fillText(ch, x, y);
    x += widths[i] + tracking;
  });
  return total;
}

/** Wrap mono-caps text into centered lines within maxWidth. Returns next y. */
function drawMonoWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  size: number,
  color: string,
  fonts: Fonts,
  maxWidth: number,
  lineHeight: number
): number {
  const upper = text.toUpperCase();
  ctx.font = `500 ${size}px ${fonts.mono}`;
  const tracking = size * 0.1;
  const measure = (s: string) =>
    Array.from(s).reduce((a, ch) => a + ctx.measureText(ch).width, 0) + tracking * Math.max(0, s.length - 1);

  const words = upper.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (measure(candidate) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  let cy = y;
  for (const l of lines) {
    drawMono(ctx, l, centerX, cy, size, color, fonts);
    cy += lineHeight;
  }
  return cy;
}

/** Fit display text: shrink to fit one line; below threshold, balance onto two lines. */
function fitDisplayLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxSize: number,
  fonts: Fonts
): { lines: string[]; size: number } {
  const upper = text.toUpperCase();
  const measureAt = (s: string, size: number) => {
    ctx.font = `400 ${size}px ${fonts.display}`;
    return ctx.measureText(s).width;
  };
  const fitOne = (s: string) => {
    const w = measureAt(s, maxSize);
    return w <= maxWidth ? maxSize : Math.floor((maxSize * maxWidth) / w);
  };

  const oneLine = fitOne(upper);
  const words = upper.split(/\s+/);
  if (oneLine >= maxSize * 0.55 || words.length < 2) {
    return { lines: [upper], size: Math.max(oneLine, 40) };
  }
  // balance into two lines at the split minimizing the wider line
  let best: { lines: string[]; width: number } | null = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const w = Math.max(measureAt(a, 100), measureAt(b, 100));
    if (!best || w < best.width) best = { lines: [a, b], width: w };
  }
  const size = Math.min(
    maxSize,
    Math.floor((100 * maxWidth) / best!.width)
  );
  return { lines: best!.lines, size: Math.max(size, 40) };
}

function drawDisplayLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  size: number,
  centerX: number,
  y: number,
  color: string,
  fonts: Fonts
): number {
  ctx.font = `400 ${size}px ${fonts.display}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  let cy = y;
  for (const line of lines) {
    ctx.fillText(line, centerX, cy);
    cy += size * 0.95;
  }
  ctx.textAlign = "left";
  return cy - size * 0.95;
}

/** Cover-crop an image into a square region. */
function drawSquareImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  size: number
) {
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - s) / 2;
  const sy = (img.naturalHeight - s) / 2;
  ctx.drawImage(img, sx, sy, s, s, x, y, size, size);
}

/** White-on-black QR with quiet zone, bottom-right. */
function drawQR(ctx: CanvasRenderingContext2D, url: string, size: number, x: number, y: number) {
  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 2; // modules of quiet zone
  const cell = size / (count + quiet * 2);
  ctx.fillStyle = BLACK;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = WHITE;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          x + (c + quiet) * cell,
          y + (r + quiet) * cell,
          Math.ceil(cell),
          Math.ceil(cell)
        );
      }
    }
  }
}

/** Brand stamp: wordmark bottom-center, site host under it, QR bottom-right. */
function drawBrandStamp(
  ctx: CanvasRenderingContext2D,
  fonts: Fonts,
  siteHost: string,
  url: string
) {
  ctx.font = `400 64px ${fonts.display}`;
  ctx.fillStyle = WHITE;
  ctx.textAlign = "center";
  ctx.fillText("ONTURF", W / 2, H - 130);
  ctx.textAlign = "left";
  drawMono(ctx, siteHost, W / 2, H - 82, 20, GREY_1, fonts);
  drawQR(ctx, url, 140, W - PAD - 140, H - PAD - 140);
}

function makeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = BLACK;
  ctx.fillRect(0, 0, W, H);
  return { canvas, ctx };
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("export failed"))), "image/png")
  );
}

export async function renderProfileCard(data: ProfileCardData): Promise<Blob> {
  const fonts = await loadFonts();
  const avatar = data.avatarUrl ? await loadImage(data.avatarUrl) : null;
  const { canvas, ctx } = makeCanvas();

  // top zone
  drawMono(ctx, `ONTURF DIRECTORY — ${data.city}`, W / 2, 150, 26, GREY_1, fonts);

  // avatar
  const avSize = 560;
  const avX = (W - avSize) / 2;
  const avY = 300;
  if (avatar) {
    drawSquareImage(ctx, avatar, avX, avY, avSize);
  } else {
    ctx.strokeStyle = GREY_2;
    ctx.lineWidth = 2;
    ctx.strokeRect(avX, avY, avSize, avSize);
    ctx.font = `400 320px ${fonts.display}`;
    ctx.fillStyle = GREY_2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(data.displayName.slice(0, 1).toUpperCase(), W / 2, avY + avSize / 2 + 20);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // display name
  const fit = fitDisplayLines(ctx, data.displayName, W - PAD * 2, 140, fonts);
  let y = avY + avSize + 110 + fit.size; // baseline of first name line
  drawDisplayLines(ctx, fit.lines, fit.size, W / 2, y, WHITE, fonts);
  y += (fit.lines.length - 1) * fit.size * 0.95;

  // username
  y += 60;
  drawMono(ctx, `@${data.username}`, W / 2, y, 28, GREY_1, fonts);

  // roles
  y += 64;
  y = drawMonoWrapped(ctx, data.roles.join(" / "), W / 2, y, 30, BONE, fonts, W - PAD * 2, 46);

  // genres
  if (data.genres.length > 0) {
    y += 8;
    y = drawMonoWrapped(
      ctx,
      data.genres.slice(0, 4).join(" — "),
      W / 2,
      y,
      22,
      GREY_1,
      fonts,
      W - PAD * 2,
      36
    );
  }

  // founding marker
  if (data.foundingMember) {
    y += 28;
    drawMono(ctx, "FOUNDING MEMBER", W / 2, y, 26, BONE, fonts);
  }

  drawBrandStamp(ctx, fonts, data.siteHost, data.profileUrl);
  drawGrain(ctx);
  return toBlob(canvas);
}

export async function renderShowCard(data: ShowCardData): Promise<Blob> {
  const fonts = await loadFonts();
  const flyer = data.flyerUrl ? await loadImage(data.flyerUrl) : null;
  const { canvas, ctx } = makeCanvas();

  // top zone
  if (data.isTonight) {
    // signal dot + TONIGHT in white, city in grey
    const label = `TONIGHT — ${data.city}`;
    const total = drawMono(ctx, label, W / 2 + 14, 150, 26, WHITE, fonts);
    ctx.fillStyle = SIGNAL;
    ctx.beginPath();
    ctx.arc(W / 2 + 14 - total / 2 - 26, 141, 9, 0, Math.PI * 2);
    ctx.fill();
  } else {
    drawMono(ctx, `LIVE — ${data.city}`, W / 2, 150, 26, GREY_1, fonts);
  }

  let y: number;
  if (flyer) {
    const flySize = 840;
    const flyX = (W - flySize) / 2;
    const flyY = 230;
    drawSquareImage(ctx, flyer, flyX, flyY, flySize);
    y = flyY + flySize + 110;
    const fit = fitDisplayLines(ctx, data.title, W - PAD * 2, 110, fonts);
    drawDisplayLines(ctx, fit.lines, fit.size, W / 2, y + fit.size * 0.85, WHITE, fonts);
    y += fit.size * 0.85 + (fit.lines.length - 1) * fit.size * 0.95 + 80;
  } else {
    // no flyer: type carries it
    y = 480;
    const fit = fitDisplayLines(ctx, data.title, W - PAD * 2, 170, fonts);
    drawDisplayLines(ctx, fit.lines, fit.size, W / 2, y + fit.size * 0.85, WHITE, fonts);
    y += fit.size * 0.85 + (fit.lines.length - 1) * fit.size * 0.95 + 110;
  }

  // date/time
  drawMono(ctx, data.dateLine, W / 2, y, 34, BONE, fonts);
  y += 64;

  // venue + price
  if (data.venueLine) {
    y = drawMonoWrapped(ctx, data.venueLine, W / 2, y, 26, GREY_1, fonts, W - PAD * 2, 42);
    y += 30;
  }

  // lineup
  if (data.lineup.length > 0) {
    const names =
      data.lineup.length > 6
        ? [...data.lineup.slice(0, 5), `+ ${data.lineup.length - 5} MORE`]
        : data.lineup;
    drawMonoWrapped(ctx, names.join(" / "), W / 2, y + 16, 28, WHITE, fonts, W - PAD * 2, 46);
  }

  drawBrandStamp(ctx, fonts, data.siteHost, data.showUrl);
  drawGrain(ctx);
  return toBlob(canvas);
}
