import { formatKz } from "@/lib/format";

interface ExportColumn {
  header: string;
  key: string;
  format?: "currency" | "percent" | "text" | "number";
}

interface ExportOptions {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: Record<string, any>[];
  summary?: { label: string; value: string }[];
  filename: string;
}

const formatValue = (value: any, format?: string) => {
  if (value == null) return "";
  if (format === "currency") return formatKz(Number(value));
  if (format === "percent") return `${value}%`;
  return String(value);
};

export const exportToCSV = (options: ExportOptions) => {
  const { title, subtitle, columns, data, summary, filename } = options;
  const lines: string[] = [];

  lines.push(title);
  if (subtitle) lines.push(subtitle);
  lines.push(`Gerado em: ${new Date().toLocaleDateString("pt-AO")} às ${new Date().toLocaleTimeString("pt-AO", { hour: "2-digit", minute: "2-digit" })}`);
  lines.push("");

  if (summary?.length) {
    summary.forEach(s => lines.push(`${s.label};${s.value}`));
    lines.push("");
  }

  lines.push(columns.map(c => c.header).join(";"));
  data.forEach(row => {
    lines.push(columns.map(c => formatValue(row[c.key], c.format)).join(";"));
  });

  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `${filename}.csv`);
};

export const exportToPDF = (options: ExportOptions) => {
  const { title, subtitle, columns, data, summary, filename } = options;

  const colWidths = columns.map(() => Math.floor(520 / columns.length));
  const rowHeight = 22;
  const headerY = 120 + (summary?.length ? (summary.length * 18 + 30) : 0);
  const pageHeight = 842;
  const marginBottom = 60;

  let currentY = headerY;
  let pageNum = 1;
  const pages: string[] = [];
  let currentPageContent = "";

  const escapeXml = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const startNewPage = () => {
    if (currentPageContent) {
      pages.push(currentPageContent);
    }
    pageNum++;
    currentY = 60;
    currentPageContent = "";
  };

  // Build header content (only first page)
  let headerContent = "";
  // Title bar
  headerContent += `<rect x="40" y="30" width="520" height="45" rx="6" fill="#C8374D"/>`;
  headerContent += `<text x="300" y="58" font-family="Helvetica" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${escapeXml(title)}</text>`;

  if (subtitle) {
    headerContent += `<text x="300" y="95" font-family="Helvetica" font-size="9" fill="#888" text-anchor="middle">${escapeXml(subtitle)} • Gerado em ${new Date().toLocaleDateString("pt-AO")}</text>`;
  }

  // Summary cards
  if (summary?.length) {
    const cardW = Math.floor(520 / summary.length) - 8;
    summary.forEach((s, i) => {
      const cx = 40 + i * (cardW + 8);
      headerContent += `<rect x="${cx}" y="108" width="${cardW}" height="42" rx="5" fill="#FFF5F6" stroke="#F0D0D5" stroke-width="0.5"/>`;
      headerContent += `<text x="${cx + cardW / 2}" y="124" font-family="Helvetica" font-size="7" fill="#999" text-anchor="middle">${escapeXml(s.label)}</text>`;
      headerContent += `<text x="${cx + cardW / 2}" y="140" font-family="Helvetica" font-size="10" font-weight="bold" fill="#C8374D" text-anchor="middle">${escapeXml(s.value)}</text>`;
    });
  }

  // Table header
  let tableHeader = `<rect x="40" y="${currentY}" width="520" height="${rowHeight}" rx="4" fill="#C8374D"/>`;
  let colX = 44;
  columns.forEach((col, ci) => {
    tableHeader += `<text x="${colX}" y="${currentY + 15}" font-family="Helvetica" font-size="8" font-weight="bold" fill="white">${escapeXml(col.header)}</text>`;
    colX += colWidths[ci];
  });
  currentPageContent = tableHeader;
  currentY += rowHeight + 2;

  // Table rows
  data.forEach((row, ri) => {
    if (currentY + rowHeight > pageHeight - marginBottom) {
      startNewPage();
      // Re-add table header on new page
      let th = `<rect x="40" y="${currentY}" width="520" height="${rowHeight}" rx="4" fill="#C8374D"/>`;
      let cx2 = 44;
      columns.forEach((col, ci) => {
        th += `<text x="${cx2}" y="${currentY + 15}" font-family="Helvetica" font-size="8" font-weight="bold" fill="white">${escapeXml(col.header)}</text>`;
        cx2 += colWidths[ci];
      });
      currentPageContent += th;
      currentY += rowHeight + 2;
    }

    const bgColor = ri % 2 === 0 ? "#FAFAFA" : "#FFFFFF";
    currentPageContent += `<rect x="40" y="${currentY}" width="520" height="${rowHeight}" rx="2" fill="${bgColor}"/>`;
    let cx3 = 44;
    columns.forEach((col, ci) => {
      const val = formatValue(row[col.key], col.format);
      const fillColor = col.format === "currency" && Number(row[col.key]) < 0 ? "#DC2626" : "#333";
      currentPageContent += `<text x="${cx3}" y="${currentY + 15}" font-family="Helvetica" font-size="8" fill="${fillColor}">${escapeXml(val)}</text>`;
      cx3 += colWidths[ci];
    });
    currentY += rowHeight;
  });

  // Finalize
  if (currentPageContent) pages.push(currentPageContent);

  // Build SVG pages and convert to printable HTML
  const htmlPages = pages.map((content, i) => {
    const isFirst = i === 0;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="595" height="842" viewBox="0 0 595 842" style="page-break-after: always; display: block; margin: 0 auto;">
      <rect width="595" height="842" fill="white"/>
      ${isFirst ? headerContent : ""}
      ${content}
      <line x1="40" y1="${pageHeight - 40}" x2="560" y2="${pageHeight - 40}" stroke="#eee" stroke-width="0.5"/>
      <text x="300" y="${pageHeight - 25}" font-family="Helvetica" font-size="7" fill="#aaa" text-anchor="middle">GenOmni Salon • Página ${i + 1} de ${pages.length}</text>
    </svg>`;
  });

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>@page{margin:0;size:A4}body{margin:0}svg{page-break-after:always}</style></head><body>${htmlPages.join("")}</body></html>`);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
