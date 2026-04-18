# Project Dashboard Expansion — Design Spec

**Date:** 2026-04-18
**Status:** Approved

## Overview

Expand the existing project-dashboard Next.js app with:
1. Expandable project rows with detailed info (attachments, tilbud, PO, customer contact, notes)
2. Status change from project list
3. Archive page for completed projects
4. Proofreading page (OpenAI-powered)
5. Global to-do list (already exists — no changes needed)

## 1. Expandable Project Rows

### Behavior
Each row in the `ProjectTable` gets a chevron button on the left. Clicking it expands the row to reveal a detail panel below. Only one row expanded at a time.

### Detail Panel Contents

**Section A — Vedlegg (Attachments)**
- List of uploaded files with name, type, upload date
- "Last opp fil" button opens file picker (accepts any file type, max 5MB)
- Files stored as base64 in DB (suitable for small files in a demo/internal tool)
- Delete button per attachment

**Section B — Tilbud (Quote)**
- Checkbox: "Tilbud mottatt"
- When checked, shows file upload for tilbud PDF
- Stored as a project_attachment with category "tilbud"

**Section C — PO (Purchase Order)**
- Checkbox: "PO mottatt"
- When checked, shows file upload for PO PDF
- Stored as a project_attachment with category "po"

**Section D — Kundekontakt (Customer Contact)**
- Input fields: Kontaktperson (name), E-post (email)
- Saved per project, one contact per project
- Inline save on blur or enter

**Section E — Notater (Notes)**
- Textarea field, auto-saves on blur
- Stored as `notes` column on the projects table

**Section F — Status Change**
- Dropdown showing current status
- Changing it immediately PATCHes the project
- Uses existing status options: planning, workshop, offshore, invoicing, completed, standby
- When changed to "completed", sets `completedAt` timestamp

### Layout
```
┌─────────────────────────────────────────────────────┐
│ ▼ Prosjektnavn | Kunde | Type | ... | Status [dropdown] │
├─────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐    │
│  │ Vedlegg  │ │ Tilbud/PO│ │ Kundekontakt     │    │
│  │ [files]  │ │ ☑ Tilbud │ │ Navn: ________   │    │
│  │ [upload] │ │ ☑ PO     │ │ Epost: ________  │    │
│  └──────────┘ └──────────┘ └──────────────────┘    │
│  ┌──────────────────────────────────────────────┐   │
│  │ Notater                                      │   │
│  │ [textarea]                                    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 2. Database Changes

### New table: `project_attachments`
```sql
CREATE TABLE project_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_data TEXT NOT NULL,          -- base64 encoded
  file_size INTEGER NOT NULL,       -- bytes
  category TEXT NOT NULL DEFAULT 'general',  -- 'general', 'tilbud', 'po'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_project_attachments_project_id ON project_attachments(project_id);
```

### New columns on `projects` table
```sql
ALTER TABLE projects ADD COLUMN notes TEXT;
ALTER TABLE projects ADD COLUMN has_tilbud INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN has_po INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN contact_name TEXT;
ALTER TABLE projects ADD COLUMN contact_email TEXT;
```

Rationale: Contact info and flags are 1:1 with projects, so columns are simpler than a separate table. Attachments are 1:many, so they get their own table.

## 3. API Endpoints

### Attachments
- `GET /api/projects/[id]/attachments` — list attachments for project
- `POST /api/projects/[id]/attachments` — upload attachment (multipart form or JSON with base64)
- `DELETE /api/projects/[id]/attachments/[attachmentId]` — delete attachment

### Project updates (extend existing PATCH)
Extend `PATCH /api/projects/[id]` to accept:
- `notes` (string)
- `hasTilbud` (boolean)
- `hasPo` (boolean)
- `contactName` (string)
- `contactEmail` (string)
- `status` (string) — already supported, but ensure `completedAt` is auto-set when status changes to "completed"

### Proofreading
- `POST /api/proofread` — accepts `{ text: string }`, returns `{ corrected: string }`

## 4. Archive Page

### Route
`/(leader)/arkiv/page.tsx`

### Sidebar
Add "Arkiv" nav item with `Archive` icon from lucide-react, placed after "Lager" in the sidebar.

### Behavior
- Fetches projects with `status=completed`
- Displays in a table similar to ProjectTable but read-only (no expand)
- Shows: name, client, location, completedAt date
- Click row navigates to existing project detail page `/prosjekter/[id]`
- Main `/prosjekter` page filters OUT completed projects

## 5. Proofreading Page (Rettskriving)

### Route
`/(leader)/rettskriving/page.tsx`

### Sidebar
Add "Rettskriving" nav item with `SpellCheck` icon, placed after "Arkiv".

### UI
```
┌─────────────────────────────────────┐
│ Rettskriving                        │
│ Lim inn tekst for korrekturlesing   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Input textarea - large]        │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Rett tekst]                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Output - corrected text]       │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ [Kopier]                            │
└─────────────────────────────────────┘
```

### OpenAI Prompt
```
Du er en korrekturleser. Korriger rettskriving og grammatikk i teksten under.

Regler:
- Behold samme språk som input (norsk inn → norsk ut, engelsk inn → engelsk ut)
- Bruk enkle, naturlige ord. Ikke bytt ut vanlige ord med vanskelige synonymer.
- Ikke endre mening eller tone
- Ikke legg til eller fjern innhold
- Teksten skal lese naturlig, som om et menneske skrev den
- Returner KUN den korrigerte teksten, ingen forklaringer

Tekst:
{input}
```

### API Implementation
- Uses existing `getOpenAI()` from `src/lib/openai.ts`
- Model: `gpt-4o-mini` (fast, cheap, good enough for proofreading)
- Max tokens: 2000
- Temperature: 0.3 (low creativity, high accuracy)

## 6. Files to Create/Modify

### New files
- `src/lib/db/schema.ts` — add `projectAttachments` table + new project columns
- `src/app/(leader)/arkiv/page.tsx` — archive page
- `src/app/(leader)/rettskriving/page.tsx` — proofreading page
- `src/app/api/projects/[id]/attachments/route.ts` — attachments CRUD
- `src/app/api/projects/[id]/attachments/[attachmentId]/route.ts` — delete attachment
- `src/app/api/proofread/route.ts` — proofreading endpoint
- `src/components/projects/ProjectRowExpander.tsx` — expandable row detail panel
- `drizzle/XXXX_migration.sql` — migration for new schema

### Modified files
- `src/lib/db/schema.ts` — add new table + columns
- `src/lib/types.ts` — add new interfaces
- `src/lib/constants.ts` — no changes needed (statuses already cover this)
- `src/components/Sidebar.tsx` — add Arkiv + Rettskriving nav items
- `src/components/projects/ProjectTable.tsx` — add expand/collapse + inline status dropdown
- `src/app/api/projects/route.ts` — filter out completed from default listing
- `src/app/api/projects/[id]/route.ts` — handle new fields in PATCH, auto-set completedAt

## 7. Out of Scope
- File storage service (Vercel Blob, S3, etc.) — base64 in DB is sufficient for this use case
- Multiple contacts per project
- Attachment preview/viewer
- Changes to the existing to-do page (already functional)
- OMT branding changes (keeping existing warm theme)
