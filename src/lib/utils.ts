export function generateId(): string {
  return (
    "p_" +
    Date.now().toString(36) +
    "_" +
    Math.random().toString(36).substring(2, 7)
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function formatNorwegianDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("no-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getStatusLabel(id: string): string {
  const map: Record<string, string> = {
    planning: "Planning",
    workshop: "Workshop",
    offshore: "Offshore",
    invoicing: "Invoicing",
    finished: "Finished",
  };
  return map[id] ?? "Ukjent";
}

export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url, "https://placeholder.com");
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
