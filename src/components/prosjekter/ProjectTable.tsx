"use client";

import { useState, useMemo, Fragment } from "react";
import type { Project, ProjectTab, ProjectStatus } from "@/lib/types";
import { COMPLETED_STATUSES } from "@/lib/constants";
import { generateId, getStatusLabel } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/components/ui/Toaster";
import { StatusBadge } from "./StatusBadge";
import { UtstyrChips } from "./UtstyrChips";
import { ProjectDetailPanel } from "./ProjectDetailPanel";

interface ProjectTableProps {
  projects: Project[];
  standInProjects: Project[];
}

const tabs: { id: ProjectTab; label: string }[] = [
  { id: "active", label: "Aktive" },
  { id: "completed", label: "Fullforte" },
  { id: "standin", label: "Stand-inn" },
];

function emptyProject(isStandin: boolean): Project {
  return {
    id: generateId(),
    name: "",
    status: "planning",
    date: new Date().toISOString().split("T")[0],
    field: "",
    felt: [],
    links: [],
    ecompletionUrl: "",
    bsaUrl: "",
    so: "",
    ce: false,
    po: false,
    notes: "",
    contactName: "",
    contactInfo: "",
    shippingAddress: "",
    files: [],
    isStandin,
  };
}

export function ProjectTable({
  projects: initialProjects,
  standInProjects: initialStandIn,
}: ProjectTableProps) {
  const [tab, setTab] = useState<ProjectTab>("active");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [standInProjects, setStandInProjects] = useState<Project[]>(initialStandIn);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const displayProjects = useMemo(() => {
    let list: Project[];
    if (tab === "standin") {
      list = standInProjects;
    } else if (tab === "completed") {
      list = projects.filter((p) =>
        COMPLETED_STATUSES.includes(p.status as ProjectStatus)
      );
    } else {
      list = projects.filter(
        (p) => !COMPLETED_STATUSES.includes(p.status as ProjectStatus)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.field.toLowerCase().includes(q) ||
          p.felt.some((f) => f.toLowerCase().includes(q))
      );
    }

    return list;
  }, [tab, projects, standInProjects, search]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateProject(id: string, field: string, value: unknown) {
    const setter = tab === "standin" ? setStandInProjects : setProjects;
    setter((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  }

  function toRow(p: Project) {
    return {
      id: p.id,
      name: p.name || '',
      status: p.status || 'planning',
      date: p.date || '',
      field: p.field || '',
      felt: p.felt || [],
      links: p.links || [],
      ecompletion_url: p.ecompletionUrl || '',
      bsa_url: p.bsaUrl || '',
      so: p.so || '',
      ce: !!p.ce,
      po: !!p.po,
      notes: p.notes || '',
      contact_name: p.contactName || '',
      contact_info: p.contactInfo || '',
      shipping_address: p.shippingAddress || '',
      files: p.files || [],
      is_standin: !!p.isStandin,
    };
  }

  async function saveProject(project: Project) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("pb_projects")
        .upsert(toRow(project), { onConflict: "id" });

      if (error) {
        showToast("Feil: " + (error.message || error.details || error.hint || JSON.stringify(error)));
        console.error("Supabase error:", JSON.stringify(error, null, 2));
        return;
      }
      showToast("Prosjekt lagret");
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const msg = e?.message || e?.details || e?.hint || JSON.stringify(err);
      console.error("Save error:", JSON.stringify(err, null, 2));
      showToast("Feil: " + String(msg));
    } finally {
      setSaving(false);
    }
  }

  async function addProject() {
    const isStandin = tab === "standin";
    const newProject = emptyProject(isStandin);

    if (isStandin) {
      setStandInProjects((prev) => [...prev, newProject]);
    } else {
      setProjects((prev) => [...prev, newProject]);
    }

    await saveProject(newProject);
    setExpanded((prev) => new Set(prev).add(newProject.id));
  }

  async function deleteProject(id: string) {
    setSaving(true);
    try {
      const { error } = await supabase.from("pb_projects").delete().eq("id", id);
      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== id));
      setStandInProjects((prev) => prev.filter((p) => p.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showToast("Prosjekt slettet");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Feil ved sletting");
    } finally {
      setSaving(false);
    }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Slett ${selected.size} prosjekter?`)) return;

    setSaving(true);
    try {
      const ids = Array.from(selected);
      const { error } = await supabase
        .from("pb_projects")
        .delete()
        .in("id", ids);
      if (error) throw error;

      setProjects((prev) => prev.filter((p) => !selected.has(p.id)));
      setStandInProjects((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
      showToast(`${ids.length} prosjekter slettet`);
    } catch (err) {
      console.error("Bulk delete error:", err);
      showToast("Feil ved sletting");
    } finally {
      setSaving(false);
    }
  }

  function handleFieldBlur(project: Project) {
    saveProject(project);
  }

  return (
    <div className="space-y-4">
      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                setSelected(new Set());
              }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-light hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              type="button"
              onClick={bulkDelete}
              disabled={saving}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Slett ({selected.size})
            </button>
          )}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-light"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sok..."
              className="w-64 rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="w-10 px-3 py-3" />
              <th className="w-10 px-3 py-3" />
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-text-light">
                Dato
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-text-light">
                Rigg
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-text-light">
                Felt
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-text-light">
                Utstyr
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-text-light">
                Kabal
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-text-light">
                Custom
              </th>
              <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-text-light">
                Status
              </th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {displayProjects.map((project) => {
              const isExpanded = expanded.has(project.id);
              const isSelected = selected.has(project.id);
              const firstLink = project.links[0];

              return (
                <Fragment key={project.id}>
                  <tr
                    className={`border-b border-gray-50 transition hover:bg-gray-50/50 ${
                      isSelected ? "bg-blue-50/30" : ""
                    }`}
                  >
                    {/* Expand */}
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleExpand(project.id)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded text-text-light hover:bg-gray-100 transition"
                      >
                        <svg
                          className={`h-4 w-4 transition ${isExpanded ? "rotate-90" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>

                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(project.id)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>

                    {/* Dato */}
                    <td className="px-3 py-3">
                      <input
                        type="date"
                        value={project.date}
                        onChange={(e) =>
                          updateProject(project.id, "date", e.target.value)
                        }
                        onBlur={() => handleFieldBlur(project)}
                        className="rounded border-0 bg-transparent px-1 py-0.5 text-sm text-text focus:bg-white focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* Rigg */}
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={project.name}
                        onChange={(e) =>
                          updateProject(project.id, "name", e.target.value)
                        }
                        onBlur={() => handleFieldBlur(project)}
                        placeholder="Riggnavn..."
                        className="w-full rounded border-0 bg-transparent px-1 py-0.5 text-sm font-medium text-text focus:bg-white focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* Felt */}
                    <td className="px-3 py-3">
                      <input
                        type="text"
                        value={project.field}
                        onChange={(e) =>
                          updateProject(project.id, "field", e.target.value)
                        }
                        onBlur={() => handleFieldBlur(project)}
                        placeholder="Felt..."
                        className="w-full rounded border-0 bg-transparent px-1 py-0.5 text-sm text-text focus:bg-white focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* Utstyr (read-only, synced from detail panel links) */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {project.felt.length > 0 ? (
                          project.felt.map((name, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-primary"
                            >
                              {name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </div>
                    </td>

                    {/* Kabal (first link) */}
                    <td className="px-3 py-3 text-xs text-text-light">
                      {firstLink?.kabalUrl ? (
                        <a
                          href={firstLink.kabalUrl.startsWith("http") ? firstLink.kabalUrl : `https://${firstLink.kabalUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate block max-w-[120px]"
                        >
                          Kabal
                        </a>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>

                    {/* Custom (first link) */}
                    <td className="px-3 py-3 text-xs text-text-light">
                      {firstLink?.modemUrl ? (
                        <a
                          href={firstLink.modemUrl.startsWith("http") ? firstLink.modemUrl : `https://${firstLink.modemUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate block max-w-[120px]"
                        >
                          Custom
                        </a>
                      ) : (
                        <span className="text-gray-300">--</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <StatusBadge
                        status={project.status}
                        onChange={(status) => {
                          updateProject(project.id, "status", status);
                          const updated = { ...project, status };
                          saveProject(updated);
                        }}
                      />
                    </td>

                    {/* Delete */}
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Slett dette prosjektet?")) {
                            deleteProject(project.id);
                          }
                        }}
                        disabled={saving}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition disabled:opacity-50"
                        title="Slett prosjekt"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={10} className="px-4 py-4">
                        <ProjectDetailPanel
                          project={project}
                          onUpdate={(field, value) => {
                            updateProject(project.id, field, value);
                            let updated = { ...project, [field]: value };
                            // Sync felt[] from links when links change
                            if (field === "links") {
                              const linkNames = (value as Project["links"])
                                .map((l) => l.utstyr)
                                .filter(Boolean);
                              updateProject(project.id, "felt", linkNames);
                              updated = { ...updated, felt: linkNames };
                            }
                            saveProject(updated);
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}

            {displayProjects.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  className="px-6 py-12 text-center text-sm text-text-light"
                >
                  {search
                    ? "Ingen prosjekter funnet for dette soket."
                    : "Ingen prosjekter enna. Legg til et nytt prosjekt."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={addProject}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-text-light hover:border-primary hover:text-primary transition disabled:opacity-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Legg til nytt prosjekt
      </button>
    </div>
  );
}
