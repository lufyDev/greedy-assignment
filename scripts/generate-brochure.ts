/**
 * Generates the demo brochure PDF the chatbot shares.
 *
 *   npm run brochure
 *
 * The output is clearly marked as demo material: it is built from the public
 * page content, not an official Greedy Adventures document.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { EXPERIENCE } from "../src/content/experience";
import { SEA_VIEW_SOURCE } from "../src/lib/knowledge/snapshot";

const OUT = path.join(process.cwd(), "public/media/sea-view-skydiving-brochure-demo.pdf");

const INK = rgb(0.05, 0.11, 0.15);
const MUTED = rgb(0.36, 0.42, 0.46);
const ACCENT = rgb(0.96, 0.45, 0.2);
const PAPER = rgb(0.98, 0.97, 0.95);
const DEMO = rgb(0.75, 0.16, 0.12);

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 48;

// Standard PDF fonts only cover WinAnsi, so swap characters they cannot draw.
const ascii = (s: string) => s.replace(/฿/g, "THB ").replace(/[–—]/g, "-").replace(/[’]/g, "'");

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of ascii(text).split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

type Cursor = { page: PDFPage; y: number };

function paragraph(c: Cursor, text: string, font: PDFFont, size: number, color = INK, width = A4[0] - MARGIN * 2, x = MARGIN) {
  for (const line of wrap(text, font, size, width)) {
    c.page.drawText(line, { x, y: c.y, size, font, color });
    c.y -= size * 1.45;
  }
}

function demoBanner(page: PDFPage, bold: PDFFont) {
  page.drawRectangle({ x: 0, y: A4[1] - 26, width: A4[0], height: 26, color: DEMO });
  page.drawText("DEMO MATERIAL - sample brochure generated for a hiring assignment, not an official Greedy Adventures document", {
    x: MARGIN,
    y: A4[1] - 17,
    size: 7.5,
    font: bold,
    color: rgb(1, 1, 1),
  });
}

async function main() {
  const doc = await PDFDocument.create();
  doc.setTitle("Sea View Skydiving - brochure (demo material)");
  doc.setAuthor("Greedy Adventures assignment prototype");
  doc.setSubject("Demo brochure generated from public page content");

  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: cover + packages
  const p1 = doc.addPage(A4);
  p1.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: PAPER });
  demoBanner(p1, bold);

  const heroHeight = 300;
  try {
    const res = await fetch(EXPERIENCE.heroPoster);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const jpg = await doc.embedJpg(new Uint8Array(await res.arrayBuffer()));
    const scale = Math.max(A4[0] / jpg.width, heroHeight / jpg.height);
    p1.drawImage(jpg, {
      x: (A4[0] - jpg.width * scale) / 2,
      y: A4[1] - 26 - heroHeight + (heroHeight - jpg.height * scale) / 2,
      width: jpg.width * scale,
      height: jpg.height * scale,
    });
    // Re-draw the banner over any image overflow.
    p1.drawRectangle({ x: 0, y: A4[1] - 26 - heroHeight - 200, width: A4[0], height: 200, color: PAPER });
    demoBanner(p1, bold);
  } catch (err) {
    console.warn("Hero image skipped:", (err as Error).message);
    p1.drawRectangle({ x: 0, y: A4[1] - 26 - heroHeight, width: A4[0], height: heroHeight, color: INK });
  }

  const c: Cursor = { page: p1, y: A4[1] - 26 - heroHeight - 40 };
  p1.drawText(ascii(EXPERIENCE.eyebrow).toUpperCase(), { x: MARGIN, y: c.y, size: 9, font: bold, color: ACCENT });
  c.y -= 30;
  p1.drawText(`${EXPERIENCE.title}`, { x: MARGIN, y: c.y, size: 30, font: bold, color: INK });
  c.y -= 22;
  p1.drawText(ascii(EXPERIENCE.subtitle), { x: MARGIN, y: c.y, size: 13, font: regular, color: MUTED });
  c.y -= 26;
  paragraph(c, EXPERIENCE.summary, regular, 10.5, INK);
  c.y -= 14;

  const colW = (A4[0] - MARGIN * 2 - 24) / 3;
  const top = c.y;
  EXPERIENCE.packages.forEach((pkg, i) => {
    const x = MARGIN + i * (colW + 12);
    p1.drawRectangle({ x, y: top - 150, width: colW, height: 150, color: rgb(1, 1, 1), borderColor: rgb(0.86, 0.85, 0.82), borderWidth: 1 });
    p1.drawText(pkg.name.toUpperCase(), { x: x + 14, y: top - 26, size: 14, font: bold, color: INK });
    const cc: Cursor = { page: p1, y: top - 44 };
    paragraph(cc, pkg.tagline, regular, 9, MUTED, colW - 28, x + 14);
    p1.drawText(ascii(`฿${pkg.priceThb.toLocaleString("en-US")}`), { x: x + 14, y: top - 92, size: 18, font: bold, color: ACCENT });
    p1.drawText("per person", { x: x + 14, y: top - 106, size: 8, font: regular, color: MUTED });
    const mc: Cursor = { page: p1, y: top - 126 };
    paragraph(mc, pkg.media, bold, 8, INK, colW - 28, x + 14);
  });
  c.y = top - 176;
  p1.drawText("Included in every package", { x: MARGIN, y: c.y, size: 10, font: bold, color: INK });
  c.y -= 16;
  for (const item of EXPERIENCE.inclusions) paragraph(c, `+  ${item}`, regular, 9.5, INK);

  // Page 2: the plan, details, FAQ
  const p2 = doc.addPage(A4);
  p2.drawRectangle({ x: 0, y: 0, width: A4[0], height: A4[1], color: PAPER });
  demoBanner(p2, bold);
  const d: Cursor = { page: p2, y: A4[1] - 70 };

  const heading = (text: string) => {
    d.y -= 6;
    p2.drawText(text.toUpperCase(), { x: MARGIN, y: d.y, size: 9, font: bold, color: ACCENT });
    d.y -= 20;
  };

  heading("The plan");
  EXPERIENCE.plan.forEach((step, i) => {
    p2.drawText(`${i + 1}`, { x: MARGIN, y: d.y, size: 16, font: bold, color: ACCENT });
    p2.drawText(ascii(step.title), { x: MARGIN + 26, y: d.y + 2, size: 11, font: bold, color: INK });
    d.y -= 15;
    paragraph(d, step.detail, regular, 9.5, MUTED, A4[0] - MARGIN * 2 - 26, MARGIN + 26);
    d.y -= 6;
  });
  paragraph(d, EXPERIENCE.stats.map((s) => `${s.label}: ${s.value} ${s.unit}`).join("   |   "), bold, 9, INK);
  d.y -= 14;

  heading("Highlights");
  for (const h of EXPERIENCE.highlights) paragraph(d, `-  ${h}`, regular, 9.5);
  d.y -= 10;

  heading("Where you jump");
  paragraph(d, `${EXPERIENCE.location.name}. ${EXPERIENCE.location.address}. Operated by ${EXPERIENCE.location.operator}.`, regular, 9.5);
  d.y -= 10;

  heading("Good to know");
  for (const f of EXPERIENCE.faq) {
    paragraph(d, f.q, bold, 9.5);
    paragraph(d, f.a, regular, 9.5, MUTED);
    d.y -= 4;
  }

  paragraph(
    { page: p2, y: 70 },
    `Source: ${SEA_VIEW_SOURCE.url} (captured ${SEA_VIEW_SOURCE.capturedAt}). Prices and details may change; check the website before booking. ` +
      "Photo: Greedy Adventures, used from the public page for this demo.",
    regular,
    7.5,
    MUTED,
  );

  await writeFile(OUT, await doc.save());
  console.log(`Wrote ${path.relative(process.cwd(), OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
