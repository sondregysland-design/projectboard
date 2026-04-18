export interface ReportContent {
  projectSummary: string;
  descriptionRewritten: string;
  rovSystemDescription: string;
  proceduresSummary: string;
  partsNarrative: string;
  workshopLogEntries: {
    date: string;
    type: string;
    text: string;
  }[];
  conclusion: string;
}

export interface ProjectReportData {
  id: number;
  name: string;
  description: string | null;
  client: string;
  location: string | null;
  rovSystemName: string | null;
  rovSystemModel: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  procedures: { id: number; name: string; category: string | null }[];
  drawings: { id: number; name: string; fileType: string }[];
  partsUsage: {
    partName: string | null;
    partSku: string | null;
    partCategory: string | null;
    quantityUsed: number;
  }[];
  workshopLogs: {
    message: string;
    logType: string;
    createdBy: string | null;
    createdAt: string;
  }[];
}
