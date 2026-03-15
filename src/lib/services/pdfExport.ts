// PDF Export Service for AgiliFind Schedule Builder
// Uses jsPDF for both fun and plain schedule exports.
//
// MOBILE NOTE: PDF download via blob URL works on desktop browsers.
// On mobile Safari, auto-download is inconsistent. A future enhancement
// could open the PDF in a new tab using doc.output('datauristring') as
// a fallback for mobile users.

import { jsPDF } from "jspdf";

export interface ExportOptions {
  /** PDF title shown in the header */
  title?: string;
  /** Handler / owner name shown in the info bar */
  handlerName?: string;
  showHostingClub?: boolean;
  showClasses?: boolean;
  showRegisterLink?: boolean;
}

const EXPORT_DEFAULTS: Required<ExportOptions> = {
  title: "My Agility Trial Schedule",
  handlerName: "",
  showHostingClub: true,
  showClasses: true,
  showRegisterLink: true,
};

// Actual SavedTrial shape from the app (differs from original spec's unified schema)
interface SavedTrial {
  id: string;
  title: string;
  hosting_club: string | null;
  organization_name: string;
  start_date: string; // ISO date string "YYYY-MM-DD"
  end_date: string;
  venue_name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  source_url: string;
  saved_status: string;
  classes: string[];
}

// Color palette
const COLORS = {
  orange: "#FF6B35",
  green: "#2ECC71",
  blue: "#3498DB",
  textDark: "#1A1A2E",
  white: "#FFFFFF",
  border: "#E8E8E8",
  lightGrey: "#F5F5F5",
  altRow: "#FAFAFA",
  grey: "#CCCCCC",
  mutedText: "#888888",
};

// Org badge colors
const ORG_COLORS: Record<string, string> = {
  AKC: "#00205B",
  USDAA: "#8B0000",
  CPE: "#006400",
  NADAC: "#FF8C00",
  UKI: "#4B0082",
  CKC: "#B8860B",
};

function getOrgColor(org: string): string {
  const upper = (org || "").toUpperCase();
  for (const key of Object.keys(ORG_COLORS)) {
    if (upper.includes(key)) return ORG_COLORS[key];
  }
  return "#444444";
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function setFill(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setFillColor(r, g, b);
}

function setTextColor(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setTextColor(r, g, b);
}

function setDrawColor(doc: jsPDF, hex: string) {
  const [r, g, b] = hexToRgb(hex);
  doc.setDrawColor(r, g, b);
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(start: string, end: string) {
  if (start === end) return formatDate(start);
  const s = new Date(start + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const e = formatDate(end);
  return `${s} - ${e}`;
}

function sortTrials(trials: SavedTrial[]): SavedTrial[] {
  return [...trials].sort(
    (a, b) =>
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
}

function getYear(trials: SavedTrial[]): string {
  if (trials.length === 0) return new Date().getFullYear().toString();
  return new Date(trials[0].start_date + "T00:00:00")
    .getFullYear()
    .toString();
}

// ─── FUN SCHEDULE PDF ──────────────────────────────────────────────────────────

/**
 * Exports a fun, shareable agility schedule PDF
 * @param scheduleData - Array of trial objects (sorted by start_date)
 * @param dogPhotoBase64 - Base64 data URL of dog photo, or null
 * @param userName - Handler name to display, or null
 */
export async function exportFunSchedule(
  scheduleData: SavedTrial[],
  dogPhotoBase64: string | null,
  userName: string | null,
  options?: ExportOptions
): Promise<void> {
  if (!scheduleData || scheduleData.length === 0) return;

  const opts: Required<ExportOptions> = { ...EXPORT_DEFAULTS, ...options };
  const trials = sortTrials(scheduleData);
  const year = getYear(trials);
  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 60;

  let totalPages = 1;
  // We'll do two passes: first to count pages, second to render.
  // Instead, we track and add pages dynamically.

  // Draw header band
  function drawHeader(doc: jsPDF, isContinued: boolean) {
    const headerH = isContinued ? 40 : 80;
    setFill(doc, COLORS.orange);
    doc.rect(0, 0, pageWidth, headerH, "F");

    setTextColor(doc, COLORS.white);
    if (isContinued) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`${opts.title} - continued`, margin, 26);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(opts.title, margin, 34);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.text(`${year} Season`, margin, 54);
    }

    return headerH;
  }

  // Draw handler info bar
  function drawInfoBar(doc: jsPDF, startY: number): number {
    const barH = 36;
    setFill(doc, COLORS.lightGrey);
    doc.rect(0, startY, pageWidth, barH, "F");

    setTextColor(doc, COLORS.textDark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const items: string[] = [];
    const handlerDisplay = opts.handlerName || userName;
    if (handlerDisplay) items.push(`Handler: ${handlerDisplay}`);
    items.push(
      `Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    );
    items.push(`${trials.length} Trial${trials.length !== 1 ? "s" : ""} Planned`);

    const colW = contentWidth / items.length;
    items.forEach((item, i) => {
      const x = margin + colW * i + colW / 2;
      doc.text(item, x, startY + 22, { align: "center" });
    });

    return startY + barH;
  }

  // Draw footer
  function drawFooter(doc: jsPDF, pageNum: number, totalPagesCount: number) {
    const y = pageHeight - 20;
    setDrawColor(doc, COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 10, pageWidth - margin, y - 10);

    setTextColor(doc, COLORS.mutedText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("* Generated by AgiliFind * agilifind.com *", pageWidth / 2, y, {
      align: "center",
    });
    doc.text(`Page ${pageNum} of ${totalPagesCount}`, pageWidth - margin, y, {
      align: "right",
    });
  }

  // Draw a trial card; returns the new currentY after the card
  function drawTrialCard(
    doc: jsPDF,
    trial: SavedTrial,
    currentY: number,
    isAlt: boolean
  ): number {
    const cardPadding = 10;
    const stripeW = 4;
    const orgColor = getOrgColor(trial.organization_name);

    // Estimate card height
    const classes = trial.classes || [];
    const classDisplay =
      classes.length > 5
        ? `${classes.slice(0, 5).join(", ")} +${classes.length - 5} more`
        : classes.join(", ");
    const lineH = 14;
    let cardLines = 5; // org+name row, club, location, classes, link
    if (!trial.hosting_club || !opts.showHostingClub) cardLines--;
    if (classes.length === 0 || !opts.showClasses) cardLines--;
    if (!trial.source_url || !opts.showRegisterLink) cardLines--;
    const cardH = cardPadding * 2 + cardLines * lineH + 4;

    // Card background
    setFill(doc, isAlt ? COLORS.altRow : COLORS.white);
    doc.rect(margin, currentY, contentWidth, cardH, "F");

    // Left accent stripe
    setFill(doc, orgColor);
    doc.rect(margin, currentY, stripeW, cardH, "F");

    // Border
    setDrawColor(doc, COLORS.border);
    doc.setLineWidth(0.5);
    doc.rect(margin, currentY, contentWidth, cardH, "S");

    let y = currentY + cardPadding + 10;
    const textX = margin + stripeW + 8;
    const badgeW = 38;
    const badgeH = 12;

    // Org badge
    const [or, og, ob] = hexToRgb(orgColor);
    doc.setFillColor(or, og, ob);
    doc.roundedRect(textX, y - 10, badgeW, badgeH, 2, 2, "F");
    setTextColor(doc, COLORS.white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(
      (trial.organization_name || "ORG").toUpperCase().substring(0, 6),
      textX + badgeW / 2,
      y - 1,
      { align: "center" }
    );

    // Trial name
    setTextColor(doc, COLORS.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const nameX = textX + badgeW + 6;
    const nameMaxW = contentWidth - stripeW - badgeW - 20 - 80;
    doc.text(trial.title || "Unknown Trial", nameX, y, {
      maxWidth: nameMaxW,
    });

    // Dates (right-aligned)
    setTextColor(doc, COLORS.orange);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
      formatDateRange(trial.start_date, trial.end_date),
      pageWidth - margin - 8,
      y,
      { align: "right" }
    );

    y += lineH;

    // Hosting club
    if (trial.hosting_club && opts.showHostingClub) {
      setTextColor(doc, COLORS.mutedText);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(trial.hosting_club, nameX, y);
      y += lineH;
    }

    // Location
    setTextColor(doc, COLORS.textDark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const location = [trial.city, trial.state].filter(Boolean).join(", ");
    if (location) {
      doc.text(`[PIN] ${location}`, textX, y);
      y += lineH;
    }

    // Classes
    if (classes.length > 0 && opts.showClasses) {
      setTextColor(doc, COLORS.textDark);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`[CLS] ${classDisplay}`, textX, y, {
        maxWidth: contentWidth - stripeW - 16,
      });
      y += lineH;
    }

    // Register link
    if (trial.source_url && opts.showRegisterLink) {
      setTextColor(doc, COLORS.blue);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.textWithLink("[LINK] Register / Info", textX, y, {
        url: trial.source_url,
      });
      y += lineH;
    }

    return currentY + cardH + 6;
  }

  // --- Attempt to add dog photo on first page ---
  let dogPhotoLoaded = false;
  if (dogPhotoBase64) {
    try {
      // Verify it's a valid image by checking the prefix
      if (
        dogPhotoBase64.startsWith("data:image/") ||
        dogPhotoBase64.startsWith("data:image/jpeg") ||
        dogPhotoBase64.startsWith("data:image/png")
      ) {
        dogPhotoLoaded = true;
      }
    } catch {
      dogPhotoLoaded = false;
    }
  }

  // ── RENDER ──
  let pageNum = 1;
  const pageStarts: number[] = []; // track where each page starts in trial array

  // First page header + info bar
  let headerH = drawHeader(doc, false);

  // Dog photo on first page (overlapping header)
  if (dogPhotoLoaded && dogPhotoBase64) {
    try {
      const photoSize = 70;
      const photoX = pageWidth - margin - photoSize - 8;
      const photoY = 8;

      // White border circle (drawn as filled circle behind photo)
      doc.setFillColor(255, 255, 255);
      doc.circle(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 3, "F");

      // Add the image (rectangular, clipped to circle via roundedRect approximation)
      const fmt = dogPhotoBase64.includes("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(
        dogPhotoBase64,
        fmt,
        photoX,
        photoY,
        photoSize,
        photoSize
      );
    } catch {
      // Photo failed — skip silently, do not fail export
    }
  }

  let currentY = drawInfoBar(doc, headerH) + 12;
  pageStarts.push(0);

  for (let i = 0; i < trials.length; i++) {
    const trial = trials[i];
    const isAlt = i % 2 !== 0;

    // Estimate card height to check page break
    const classes = trial.classes || [];
    let estLines = 3;
    if (trial.hosting_club && opts.showHostingClub) estLines++;
    if (classes.length > 0 && opts.showClasses) estLines++;
    if (trial.source_url && opts.showRegisterLink) estLines++;
    const estCardH = 20 + estLines * 14 + 6;

    if (currentY + estCardH > pageHeight - bottomMargin) {
      // Draw footer on current page before adding new page
      drawFooter(doc, pageNum, 1); // placeholder total, will overwrite
      doc.addPage();
      pageNum++;
      pageStarts.push(i);

      headerH = drawHeader(doc, true);
      currentY = headerH + 12;
    }

    currentY = drawTrialCard(doc, trial, currentY, isAlt);
  }

  // Draw footer on last page (placeholder)
  const finalPageCount = pageNum;

  // Go back and draw proper footers on all pages
  // jsPDF doesn't support retroactive editing of pages easily,
  // so we re-render footers by iterating pages
  for (let p = 1; p <= finalPageCount; p++) {
    doc.setPage(p);
    drawFooter(doc, p, finalPageCount);
  }

  // Save
  doc.save(`AgiliFind-MySchedule-${year}.pdf`);
}

// ─── PLAIN SCHEDULE PDF ────────────────────────────────────────────────────────

/**
 * Exports a plain, printable agility schedule PDF
 * @param scheduleData - Array of trial objects (sorted by start_date)
 * @param userName - Handler name to display, or null
 */
export function exportPlainSchedule(
  scheduleData: SavedTrial[],
  userName: string | null,
  options?: ExportOptions
): void {
  if (!scheduleData || scheduleData.length === 0) return;

  const opts: Required<ExportOptions> = { ...EXPORT_DEFAULTS, ...options };
  const trials = sortTrials(scheduleData);
  const year = getYear(trials);

  const doc = new jsPDF({ unit: "pt", format: "letter" });

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 72; // 1 inch
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 72;
  const lineH = 16;

  let pageNum = 1;
  let totalPages = 1; // filled in after render
  const pageCounts: { page: number; y: number }[] = [];

  function drawPlainFooter(doc: jsPDF, p: number, total: number) {
    const y = pageHeight - 28;
    setDrawColor(doc, COLORS.grey);
    doc.setLineWidth(0.5);
    doc.line(margin, y - 8, pageWidth - margin, y - 8);

    setTextColor(doc, COLORS.mutedText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("AgiliFind  •  agilifind.com", pageWidth / 2, y, {
      align: "center",
    });
    doc.text(`Page ${p} of ${total}`, pageWidth - margin, y, {
      align: "right",
    });
  }

  function ensureSpace(doc: jsPDF, currentY: number, needed: number): number {
    if (currentY + needed > pageHeight - bottomMargin) {
      drawPlainFooter(doc, pageNum, 1); // placeholder
      doc.addPage();
      pageNum++;
      pageCounts.push({ page: pageNum, y: margin });
      return margin;
    }
    return currentY;
  }

  // ── HEADER ──
  setTextColor(doc, COLORS.textDark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(opts.title, margin, margin);

  let currentY = margin + 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const handlerDisplay = opts.handlerName || userName;
  const subtitle = [handlerDisplay, year].filter(Boolean).join(" — ");
  if (subtitle) {
    doc.text(subtitle, margin, currentY);
    currentY += 18;
  }

  setTextColor(doc, COLORS.mutedText);
  doc.setFontSize(9);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    margin,
    currentY
  );
  currentY += 16;

  // Horizontal rule
  setDrawColor(doc, COLORS.grey);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 20;

  // ── TRIALS ──
  for (let i = 0; i < trials.length; i++) {
    const trial = trials[i];
    const classes = (trial.classes || []).join(", ") || null;

    // Estimate space needed
    let needed = lineH * 2; // name + org|dates|location
    if (trial.hosting_club && opts.showHostingClub) needed += lineH;
    if (classes && opts.showClasses) needed += lineH;
    if (trial.source_url && opts.showRegisterLink) needed += lineH;
    needed += 16; // divider + padding

    currentY = ensureSpace(doc, currentY, needed);

    // Trial name
    setTextColor(doc, COLORS.textDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(trial.title || "Unknown Trial", margin, currentY, {
      maxWidth: contentWidth,
    });
    currentY += lineH;

    // Org | Dates | City, State
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const orgDateLoc = [
      trial.organization_name,
      formatDateRange(trial.start_date, trial.end_date),
      [trial.city, trial.state].filter(Boolean).join(", "),
    ]
      .filter(Boolean)
      .join("  |  ");
    doc.text(orgDateLoc, margin, currentY, { maxWidth: contentWidth });
    currentY += lineH;

    // Hosting club
    if (trial.hosting_club && opts.showHostingClub) {
      doc.text(trial.hosting_club, margin, currentY);
      currentY += lineH;
    }

    // Classes
    if (classes && opts.showClasses) {
      doc.text(`Classes: ${classes}`, margin, currentY, {
        maxWidth: contentWidth,
      });
      currentY += lineH;
    }

    // Register URL
    if (trial.source_url && opts.showRegisterLink) {
      setTextColor(doc, COLORS.mutedText);
      doc.setFontSize(9);
      doc.text(trial.source_url, margin, currentY, { maxWidth: contentWidth });
      currentY += lineH;
    }

    // Divider between trials
    if (i < trials.length - 1) {
      currentY += 4;
      setDrawColor(doc, COLORS.grey);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 12;
    }
  }

  totalPages = pageNum;

  // Draw footers on all pages with correct total
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawPlainFooter(doc, p, totalPages);
  }

  doc.save(`AgiliFind-Schedule-${year}.pdf`);
}
