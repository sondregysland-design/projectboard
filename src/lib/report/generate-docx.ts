import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  TabStopType,
  TabStopPosition,
  LevelFormat,
} from "docx";
import type { ProjectReportData, ReportContent } from "./types";
import {
  PROJECT_STATUS_LABELS,
  PRIORITY_LABELS,
  LOG_TYPE_LABELS,
} from "@/lib/constants";

// Design system colors from DESIGN.md — warm, editorial palette
const NEAR_BLACK = "141413";
const TERRACOTTA = "c96442";
const CORAL = "d97757";
const PARCHMENT = "f5f4ed";
const IVORY = "faf9f5";
const WARM_SAND = "e8e6dc";
const CHARCOAL = "4d4c48";
const OLIVE_GRAY = "5e5d59";
const STONE_GRAY = "87867f";
const BORDER_CREAM = "f0eee6";
const WHITE = "ffffff";

// Typography — Georgia as serif fallback (Anthropic Serif unavailable in Word)
const FONT_SERIF = "Georgia";
const FONT_SANS = "Arial";

// Warm, subtle borders matching the design system
const warmBorder = { style: BorderStyle.SINGLE, size: 1, color: WARM_SAND };
const warmBorders = {
  top: warmBorder,
  bottom: warmBorder,
  left: warmBorder,
  right: warmBorder,
};

const noBorder = { style: BorderStyle.NONE, size: 0, color: WHITE };
const noBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Editorial section heading — serif font, terracotta accent
function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 480, after: 120 },
    children: [
      new TextRun({
        text,
        font: FONT_SERIF,
        size: 36,
        color: NEAR_BLACK,
      }),
    ],
  });
}

// Warm terracotta divider line
function divider(): Paragraph {
  return new Paragraph({
    spacing: { after: 240 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 4,
        color: TERRACOTTA,
        space: 1,
      },
    },
    children: [],
  });
}

// Subtle separator between sections — cream border
function subtleSeparator(): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 200 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 2,
        color: WARM_SAND,
        space: 1,
      },
    },
    children: [],
  });
}

// Body text with generous line spacing (editorial feel)
function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 200, line: 384 },
    children: [
      new TextRun({
        text,
        font: FONT_SANS,
        size: 22,
        color: CHARCOAL,
      }),
    ],
  });
}

// Secondary/meta text in olive gray
function metaText(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        font: FONT_SANS,
        size: 20,
        color: OLIVE_GRAY,
      }),
    ],
  });
}

// Info table row — warm sand label, ivory value cell
function infoRow(label: string, value: string, tableWidth: number): TableRow {
  const labelWidth = Math.round(tableWidth * 0.32);
  const valueWidth = tableWidth - labelWidth;
  return new TableRow({
    children: [
      new TableCell({
        width: { size: labelWidth, type: WidthType.DXA },
        borders: warmBorders,
        shading: { fill: WARM_SAND, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 160, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: label,
                font: FONT_SANS,
                size: 20,
                color: CHARCOAL,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        width: { size: valueWidth, type: WidthType.DXA },
        borders: warmBorders,
        shading: { fill: IVORY, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 160, right: 120 },
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: value,
                font: FONT_SANS,
                size: 20,
                color: NEAR_BLACK,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Table header cell — near black bg, ivory text
function headerCell(
  text: string,
  width: number
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: warmBorders,
    shading: { fill: NEAR_BLACK, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 160, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: FONT_SANS,
            size: 20,
            bold: true,
            color: IVORY,
          }),
        ],
      }),
    ],
  });
}

// Data cell — alternating ivory/parchment
function dataCell(
  text: string,
  width: number,
  rowIndex: number
): TableCell {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: warmBorders,
    shading: {
      fill: rowIndex % 2 === 0 ? WHITE : PARCHMENT,
      type: ShadingType.CLEAR,
    },
    margins: { top: 80, bottom: 80, left: 160, right: 120 },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            font: FONT_SANS,
            size: 20,
            color: NEAR_BLACK,
          }),
        ],
      }),
    ],
  });
}

export async function generateProjectReport(
  project: ProjectReportData,
  content: ReportContent
): Promise<Buffer> {
  const tableWidth = 9360;
  const children: (Paragraph | Table)[] = [];

  // ─── Cover / Title ───
  // Overline label
  children.push(
    new Paragraph({
      spacing: { before: 600, after: 80 },
      children: [
        new TextRun({
          text: "PROSJEKTRAPPORT",
          font: FONT_SANS,
          size: 18,
          color: TERRACOTTA,
          characterSpacing: 80,
        }),
      ],
    })
  );

  // Project name as hero title (serif, large)
  children.push(
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: project.name,
          font: FONT_SERIF,
          size: 56,
          color: NEAR_BLACK,
        }),
      ],
    })
  );

  // Client + date line
  children.push(
    new Paragraph({
      spacing: { after: 40 },
      tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
      children: [
        new TextRun({
          text: project.client,
          font: FONT_SANS,
          size: 24,
          color: OLIVE_GRAY,
        }),
        new TextRun({
          text: `\t${formatDate(new Date().toISOString())}`,
          font: FONT_SANS,
          size: 24,
          color: STONE_GRAY,
        }),
      ],
    })
  );

  // Terracotta divider
  children.push(divider());

  // Project summary (intro paragraph, larger text)
  if (content.projectSummary) {
    children.push(
      new Paragraph({
        spacing: { after: 320, line: 400 },
        children: [
          new TextRun({
            text: content.projectSummary,
            font: FONT_SANS,
            size: 24,
            color: CHARCOAL,
          }),
        ],
      })
    );
  }

  // ─── Project Info Table ───
  children.push(sectionHeading("Prosjektinformasjon"));
  children.push(subtleSeparator());

  const rows: [string, string][] = [
    ["Klient", project.client],
    ["Lokasjon", project.location || "Ikke angitt"],
    ["Status", PROJECT_STATUS_LABELS[project.status] || project.status],
    ["Prioritet", PRIORITY_LABELS[project.priority] || project.priority],
    ["Tildelt", project.assignedTo || "Ikke tildelt"],
    ["Startdato", formatDate(project.startDate) || "Ikke satt"],
    ["Frist", formatDate(project.dueDate) || "Ikke satt"],
  ];

  if (project.completedAt) {
    rows.push(["Fullført", formatDate(project.completedAt)]);
  }

  children.push(
    new Table({
      width: { size: tableWidth, type: WidthType.DXA },
      columnWidths: [
        Math.round(tableWidth * 0.32),
        tableWidth - Math.round(tableWidth * 0.32),
      ],
      rows: rows.map(([label, value]) => infoRow(label, value, tableWidth)),
    })
  );

  // ─── Description ───
  if (content.descriptionRewritten || project.description) {
    children.push(sectionHeading("Prosjektbeskrivelse"));
    children.push(subtleSeparator());
    children.push(
      bodyText(content.descriptionRewritten || project.description || "")
    );
  }

  // ─── ROV System ───
  if (project.rovSystemName) {
    children.push(sectionHeading("ROV-system"));
    children.push(subtleSeparator());

    // ROV info as a compact card-style table
    children.push(
      new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: [
          Math.round(tableWidth * 0.32),
          tableWidth - Math.round(tableWidth * 0.32),
        ],
        rows: [
          infoRow("System", project.rovSystemName, tableWidth),
          ...(project.rovSystemModel
            ? [infoRow("Modell", project.rovSystemModel, tableWidth)]
            : []),
        ],
      })
    );

    if (content.rovSystemDescription) {
      children.push(
        new Paragraph({ spacing: { before: 200 }, children: [] })
      );
      children.push(bodyText(content.rovSystemDescription));
    }
  }

  // ─── Procedures ───
  if (project.procedures.length > 0) {
    children.push(sectionHeading("Prosedyrer"));
    children.push(subtleSeparator());

    if (content.proceduresSummary) {
      children.push(bodyText(content.proceduresSummary));
    }

    const procColWidths = [
      Math.round(tableWidth * 0.65),
      tableWidth - Math.round(tableWidth * 0.65),
    ];

    children.push(
      new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: procColWidths,
        rows: [
          new TableRow({
            children: [
              headerCell("Prosedyre", procColWidths[0]),
              headerCell("Kategori", procColWidths[1]),
            ],
          }),
          ...project.procedures.map(
            (proc, i) =>
              new TableRow({
                children: [
                  dataCell(proc.name, procColWidths[0], i),
                  dataCell(proc.category || "", procColWidths[1], i),
                ],
              })
          ),
        ],
      })
    );
  }

  // ─── Parts Used ───
  if (project.partsUsage.length > 0) {
    children.push(sectionHeading("Deler brukt"));
    children.push(subtleSeparator());

    if (content.partsNarrative) {
      children.push(bodyText(content.partsNarrative));
    }

    const partsColWidths = [
      Math.round(tableWidth * 0.35),
      Math.round(tableWidth * 0.2),
      Math.round(tableWidth * 0.25),
      tableWidth -
        Math.round(tableWidth * 0.35) -
        Math.round(tableWidth * 0.2) -
        Math.round(tableWidth * 0.25),
    ];

    const headerLabels = ["Del", "SKU", "Kategori", "Antall"];

    children.push(
      new Table({
        width: { size: tableWidth, type: WidthType.DXA },
        columnWidths: partsColWidths,
        rows: [
          new TableRow({
            children: headerLabels.map((label, i) =>
              headerCell(label, partsColWidths[i])
            ),
          }),
          ...project.partsUsage.map(
            (usage, rowIdx) =>
              new TableRow({
                children: [
                  usage.partName || "Ukjent",
                  usage.partSku || "",
                  usage.partCategory || "",
                  String(usage.quantityUsed),
                ].map((text, colIdx) =>
                  dataCell(text, partsColWidths[colIdx], rowIdx)
                ),
              })
          ),
        ],
      })
    );
  }

  // ─── Workshop Log ───
  if (project.workshopLogs.length > 0) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
    children.push(sectionHeading("Verkstedslogg"));
    children.push(subtleSeparator());

    const aiLogMap = new Map<number, string>();
    content.workshopLogEntries.forEach((entry, i) => {
      aiLogMap.set(i, entry.text);
    });

    project.workshopLogs.forEach((log, i) => {
      const typeLabel = LOG_TYPE_LABELS[log.logType] || log.logType;
      const dateStr = formatDateTime(log.createdAt);
      const logText = aiLogMap.get(i) || log.message;
      const createdBy = log.createdBy ? ` (${log.createdBy})` : "";

      // Date + type header for each log entry
      children.push(
        new Paragraph({
          spacing: { before: 240, after: 40 },
          children: [
            new TextRun({
              text: dateStr,
              font: FONT_SANS,
              size: 18,
              bold: true,
              color: TERRACOTTA,
            }),
            new TextRun({
              text: `  ${typeLabel}${createdBy}`,
              font: FONT_SANS,
              size: 18,
              color: STONE_GRAY,
            }),
          ],
        })
      );

      // Log message body
      children.push(
        new Paragraph({
          spacing: { after: 80, line: 360 },
          children: [
            new TextRun({
              text: logText,
              font: FONT_SANS,
              size: 20,
              color: CHARCOAL,
            }),
          ],
        })
      );

      // Subtle separator between log entries (except last)
      if (i < project.workshopLogs.length - 1) {
        children.push(
          new Paragraph({
            spacing: { after: 80 },
            border: {
              bottom: {
                style: BorderStyle.SINGLE,
                size: 1,
                color: BORDER_CREAM,
                space: 1,
              },
            },
            children: [],
          })
        );
      }
    });
  }

  // ─── Conclusion ───
  if (content.conclusion) {
    children.push(sectionHeading("Oppsummering"));
    children.push(subtleSeparator());
    children.push(bodyText(content.conclusion));
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT_SANS, size: 22 },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 720, hanging: 360 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                spacing: { after: 120 },
                border: {
                  bottom: {
                    style: BorderStyle.SINGLE,
                    size: 2,
                    color: WARM_SAND,
                    space: 4,
                  },
                },
                tabStops: [
                  { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
                ],
                children: [
                  new TextRun({
                    text: project.name,
                    font: FONT_SERIF,
                    size: 18,
                    color: STONE_GRAY,
                  }),
                  new TextRun({
                    text: `\t${project.client}`,
                    font: FONT_SANS,
                    size: 18,
                    color: STONE_GRAY,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                spacing: { before: 120 },
                border: {
                  top: {
                    style: BorderStyle.SINGLE,
                    size: 2,
                    color: WARM_SAND,
                    space: 4,
                  },
                },
                tabStops: [
                  { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
                ],
                children: [
                  new TextRun({
                    text: "Prosjektrapport",
                    font: FONT_SANS,
                    size: 16,
                    color: STONE_GRAY,
                  }),
                  new TextRun({
                    text: "\tSide ",
                    font: FONT_SANS,
                    size: 16,
                    color: STONE_GRAY,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_SANS,
                    size: 16,
                    color: STONE_GRAY,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer as Buffer;
}
