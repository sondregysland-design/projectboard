"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  Upload,
  Trash2,
  FileText,
  Paperclip,
  Loader2,
  Download,
} from "lucide-react";

interface Attachment {
  id: number;
  name: string;
  fileType: string;
  fileSize: number;
  category: string;
  createdAt: string;
}

interface ProjectDetails {
  id: number;
  notes: string | null;
  hasTilbud: number;
  hasPo: number;
  contactName: string | null;
  contactEmail: string | null;
}

export function ProjectRowExpander({
  project,
  onProjectUpdated,
}: {
  project: ProjectDetails;
  onProjectUpdated: () => void;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState(project.notes || "");
  const [hasTilbud, setHasTilbud] = useState(!!project.hasTilbud);
  const [hasPo, setHasPo] = useState(!!project.hasPo);
  const [contactName, setContactName] = useState(project.contactName || "");
  const [contactEmail, setContactEmail] = useState(project.contactEmail || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tilbudInputRef = useRef<HTMLInputElement>(null);
  const poInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
  }, [project.id]);

  async function fetchAttachments() {
    try {
      const res = await fetch(`/api/projects/${project.id}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (err) {
      console.error("Kunne ikke hente vedlegg:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    category: "general" | "tilbud" | "po"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Filen er for stor. Maks 5MB.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const res = await fetch(`/api/projects/${project.id}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            fileType: file.type,
            fileData: base64,
            fileSize: file.size,
            category,
          }),
        });

        if (res.ok) {
          await fetchAttachments();
          if (category === "tilbud") {
            await patchProject({ hasTilbud: true });
            setHasTilbud(true);
          } else if (category === "po") {
            await patchProject({ hasPo: true });
            setHasPo(true);
          }
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }

    e.target.value = "";
  }

  async function handleDeleteAttachment(attachmentId: number) {
    try {
      const res = await fetch(
        `/api/projects/${project.id}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await fetchAttachments();
      }
    } catch (err) {
      console.error("Kunne ikke slette vedlegg:", err);
    }
  }

  async function handleDownloadAttachment(attachmentId: number) {
    try {
      const res = await fetch(
        `/api/projects/${project.id}/attachments/${attachmentId}`
      );
      if (res.ok) {
        const data = await res.json();
        const link = document.createElement("a");
        link.href = `data:${data.fileType};base64,${data.fileData}`;
        link.download = data.name;
        link.click();
      }
    } catch (err) {
      console.error("Kunne ikke laste ned vedlegg:", err);
    }
  }

  async function patchProject(updates: Record<string, unknown>) {
    try {
      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      onProjectUpdated();
    } catch (err) {
      console.error("Kunne ikke oppdatere prosjekt:", err);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const generalAttachments = attachments.filter(
    (a) => a.category === "general"
  );
  const tilbudAttachments = attachments.filter(
    (a) => a.category === "tilbud"
  );
  const poAttachments = attachments.filter((a) => a.category === "po");

  return (
    <div className="px-4 py-4 bg-warm-sand/20 border-t border-border-cream space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Vedlegg */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-stone uppercase tracking-wide">
            Vedlegg
          </h4>
          {loading ? (
            <div className="text-xs text-stone flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Laster...
            </div>
          ) : (
            <>
              {generalAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 text-xs bg-ivory rounded px-2 py-1.5"
                >
                  <Paperclip className="h-3 w-3 text-stone shrink-0" />
                  <span className="truncate flex-1 text-charcoal">
                    {att.name}
                  </span>
                  <span className="text-stone shrink-0">
                    {formatFileSize(att.fileSize)}
                  </span>
                  <button
                    onClick={() => handleDownloadAttachment(att.id)}
                    className="text-terracotta hover:text-terracotta/80 shrink-0"
                    title="Last ned"
                  >
                    <Download className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteAttachment(att.id)}
                    className="text-error hover:text-error/80 shrink-0"
                    title="Slett"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileUpload(e, "general")}
              />
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                Last opp fil
              </Button>
            </>
          )}
        </div>

        {/* Tilbud + PO */}
        <div className="space-y-3">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-stone uppercase tracking-wide">
              Tilbud
            </h4>
            <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={hasTilbud}
                onChange={async (e) => {
                  setHasTilbud(e.target.checked);
                  await patchProject({ hasTilbud: e.target.checked });
                }}
                className="rounded border-border-cream"
              />
              Tilbud mottatt
            </label>
            {hasTilbud && (
              <div className="space-y-1">
                {tilbudAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 text-xs bg-ivory rounded px-2 py-1.5"
                  >
                    <FileText className="h-3 w-3 text-stone shrink-0" />
                    <span className="truncate flex-1 text-charcoal">
                      {att.name}
                    </span>
                    <button
                      onClick={() => handleDownloadAttachment(att.id)}
                      className="text-terracotta hover:text-terracotta/80 shrink-0"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="text-error hover:text-error/80 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <input
                  ref={tilbudInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "tilbud")}
                />
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-xs"
                  onClick={() => tilbudInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-3 w-3" />
                  Last opp tilbud
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-stone uppercase tracking-wide">
              PO
            </h4>
            <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer">
              <input
                type="checkbox"
                checked={hasPo}
                onChange={async (e) => {
                  setHasPo(e.target.checked);
                  await patchProject({ hasPo: e.target.checked });
                }}
                className="rounded border-border-cream"
              />
              PO mottatt
            </label>
            {hasPo && (
              <div className="space-y-1">
                {poAttachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 text-xs bg-ivory rounded px-2 py-1.5"
                  >
                    <FileText className="h-3 w-3 text-stone shrink-0" />
                    <span className="truncate flex-1 text-charcoal">
                      {att.name}
                    </span>
                    <button
                      onClick={() => handleDownloadAttachment(att.id)}
                      className="text-terracotta hover:text-terracotta/80 shrink-0"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteAttachment(att.id)}
                      className="text-error hover:text-error/80 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <input
                  ref={poInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "po")}
                />
                <Button
                  variant="ghost"
                  className="px-2 py-1 text-xs"
                  onClick={() => poInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-3 w-3" />
                  Last opp PO
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Kundekontakt */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-stone uppercase tracking-wide">
            Kundekontakt
          </h4>
          <Input
            placeholder="Kontaktperson"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            onBlur={() => patchProject({ contactName })}
            onKeyDown={(e) => {
              if (e.key === "Enter") patchProject({ contactName });
            }}
          />
          <Input
            type="email"
            placeholder="E-post"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            onBlur={() => patchProject({ contactEmail })}
            onKeyDown={(e) => {
              if (e.key === "Enter") patchProject({ contactEmail });
            }}
          />
        </div>
      </div>

      {/* Notater */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-stone uppercase tracking-wide">
          Notater
        </h4>
        <Textarea
          placeholder="Legg til notater..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => patchProject({ notes })}
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
}
