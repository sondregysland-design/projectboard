import { db } from "@/lib/db";
import {
  projects,
  rovSystems,
  procedures,
  drawings,
  projectPartsUsage,
  parts,
  workshopLogs,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireApiAuth, handleApiError } from "@/lib/api-auth";
import { getOpenAI } from "@/lib/openai";
import { generateProjectReport } from "@/lib/report/generate-docx";
import {
  PROJECT_STATUS_LABELS,
  PRIORITY_LABELS,
  LOG_TYPE_LABELS,
} from "@/lib/constants";
import type { ProjectReportData, ReportContent } from "@/lib/report/types";

function buildSystemPrompt(): string {
  return `Du er en teknisk rapportskribent for et norsk undervannsteknologiselskap som arbeider med ROV-systemer (Remotely Operated Vehicles).
Du skriver profesjonell, klar norsk forretningsprosa til tekniske prosjektrapporter.

STRENGE REGLER:
1. Skriv naturlig, profesjonelt norsk. Bruk fagsprak der det passer.
2. ALDRI bruk bindestreker eller kulepunkter med streker i teksten.
3. ALDRI bruk disse ordene eller lignende AI-aktige formuleringer: "effektivisere", "banebrytende", "somlos", "leverere", "optimalisere", "robust", "skalerbar", "holistisk", "synergi", "paradigme", "i henhold til", "fremover".
4. Bruk konkrete, faktabaserte setninger. Ingen oppblast eller overdrevent formelt sprak.
5. Skriv i tredje person.
6. Hold teksten kortfattet og informativ. Ikke gjenta informasjon unodvendig.
7. Ikke bruk utropstegn.
8. Skriv som en erfaren ingeniorfirma ville formulert seg i en intern eller ekstern prosjektrapport.

Du skal returnere et JSON-objekt med folgende felter:
- projectSummary: 2-4 setninger som oppsummerer prosjektet
- descriptionRewritten: Forbedret versjon av prosjektbeskrivelsen (eller tom streng hvis ingen beskrivelse)
- rovSystemDescription: Kort beskrivelse av ROV-systemet og dets rolle i prosjektet (eller tom streng hvis ikke relevant)
- proceduresSummary: Kort narrativ om prosedyrene som ble brukt (eller tom streng hvis ingen prosedyrer)
- partsNarrative: Kort oppsummering av deleforbruk (eller tom streng hvis ingen deler)
- workshopLogEntries: Array med omskrevne loggoppforinger, hver med { "date", "type", "text" }
- conclusion: Avsluttende avsnitt (2-3 setninger)

Svar KUN med gyldig JSON. Ingen annen tekst.`;
}

function buildUserPrompt(project: ProjectReportData): string {
  const logEntries = project.workshopLogs
    .slice(0, 30)
    .map((log) => ({
      date: log.createdAt,
      type: LOG_TYPE_LABELS[log.logType] || log.logType,
      message: log.message,
      createdBy: log.createdBy,
    }));

  const data = {
    prosjektnavn: project.name,
    klient: project.client,
    lokasjon: project.location,
    status: PROJECT_STATUS_LABELS[project.status] || project.status,
    prioritet: PRIORITY_LABELS[project.priority] || project.priority,
    tildelt: project.assignedTo,
    startdato: project.startDate,
    frist: project.dueDate,
    fullfort: project.completedAt,
    beskrivelse: project.description,
    rovSystem: project.rovSystemName
      ? {
          navn: project.rovSystemName,
          modell: project.rovSystemModel,
        }
      : null,
    prosedyrer: project.procedures.map((p) => ({
      navn: p.name,
      kategori: p.category,
    })),
    delerBrukt: project.partsUsage.map((p) => ({
      navn: p.partName,
      sku: p.partSku,
      kategori: p.partCategory,
      antall: p.quantityUsed,
    })),
    verkstedslogg: logEntries,
  };

  return `Skriv rapportinnhold for folgende prosjekt:\n\n${JSON.stringify(data, null, 2)}`;
}

function fallbackContent(project: ProjectReportData): ReportContent {
  return {
    projectSummary: project.description || "",
    descriptionRewritten: project.description || "",
    rovSystemDescription: project.rovSystemName
      ? `Prosjektet bruker ROV-systemet ${project.rovSystemName}${project.rovSystemModel ? ` (modell: ${project.rovSystemModel})` : ""}.`
      : "",
    proceduresSummary: "",
    partsNarrative: "",
    workshopLogEntries: project.workshopLogs.map((log) => ({
      date: log.createdAt,
      type: LOG_TYPE_LABELS[log.logType] || log.logType,
      text: log.message,
    })),
    conclusion: "",
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireApiAuth();
    const { id } = await params;
    const projectId = parseInt(id, 10);

    if (isNaN(projectId)) {
      return Response.json({ error: "Ugyldig prosjekt-ID" }, { status: 400 });
    }

    // Fetch project data (same pattern as GET handler)
    const projectResult = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        client: projects.client,
        location: projects.location,
        rovSystemId: projects.rovSystemId,
        rovSystemName: rovSystems.name,
        rovSystemModel: rovSystems.model,
        status: projects.status,
        priority: projects.priority,
        assignedTo: projects.assignedTo,
        startDate: projects.startDate,
        dueDate: projects.dueDate,
        completedAt: projects.completedAt,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .leftJoin(rovSystems, eq(projects.rovSystemId, rovSystems.id))
      .where(eq(projects.id, projectId));

    if (projectResult.length === 0) {
      return Response.json(
        { error: "Prosjektet ble ikke funnet" },
        { status: 404 }
      );
    }

    const project = projectResult[0];

    const [projectProcedures, projectDrawings, partsUsage, logs] =
      await Promise.all([
        project.rovSystemId
          ? db
              .select({ id: procedures.id, name: procedures.name, category: procedures.category })
              .from(procedures)
              .where(eq(procedures.rovSystemId, project.rovSystemId))
          : Promise.resolve([]),
        project.rovSystemId
          ? db
              .select({ id: drawings.id, name: drawings.name, fileType: drawings.fileType })
              .from(drawings)
              .where(eq(drawings.rovSystemId, project.rovSystemId))
          : Promise.resolve([]),
        db
          .select({
            partName: parts.name,
            partSku: parts.sku,
            partCategory: parts.category,
            quantityUsed: projectPartsUsage.quantityUsed,
          })
          .from(projectPartsUsage)
          .leftJoin(parts, eq(projectPartsUsage.partId, parts.id))
          .where(eq(projectPartsUsage.projectId, projectId)),
        db
          .select({
            message: workshopLogs.message,
            logType: workshopLogs.logType,
            createdBy: workshopLogs.createdBy,
            createdAt: workshopLogs.createdAt,
          })
          .from(workshopLogs)
          .where(eq(workshopLogs.projectId, projectId)),
      ]);

    const reportData: ProjectReportData = {
      ...project,
      procedures: projectProcedures,
      drawings: projectDrawings,
      partsUsage,
      workshopLogs: logs,
    };

    // Call ChatGPT for text improvement
    let aiContent: ReportContent;
    try {
      const completion = await getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: buildUserPrompt(reportData) },
        ],
        temperature: 0.4,
        max_tokens: 3000,
      });

      const responseText = completion.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("Tom respons fra OpenAI");
      }
      aiContent = JSON.parse(responseText) as ReportContent;
    } catch (aiError) {
      console.error("OpenAI-kall feilet, bruker fallback-tekst:", aiError);
      aiContent = fallbackContent(reportData);
    }

    // Generate DOCX
    const buffer = await generateProjectReport(reportData, aiContent);

    // Sanitize filename
    const safeName = project.name
      .replace(/[^a-zA-Z0-9æøåÆØÅ\s]/g, "")
      .replace(/\s+/g, "_")
      .substring(0, 50);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}_rapport.docx"`,
      },
    });
  } catch (error) {
    return handleApiError(error, "Kunne ikke generere rapport");
  }
}
