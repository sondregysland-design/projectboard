# ROV-system administrasjon — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full CRUD + inline editing for ROV systems, with BOM, procedures, and drawings management — accessible under the `(leader)` layout at `/rov-systemer`.

**Architecture:** Extends the existing Next.js App Router project with new pages under `(leader)/rov-systemer/`, new API routes under `api/rov-systems/`, and new components under `components/rov-systems/`. Follows exact patterns from the existing `/prosjekter` feature (ProjectForm, ProjectTable, ProjectStatusBadge). No schema changes needed.

**Tech Stack:** Next.js (App Router), Drizzle ORM + LibSQL/SQLite, Tailwind CSS (project palette), Lucide React icons, TypeScript

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/app/(leader)/rov-systemer/page.tsx` | List page with tabs (active/maintenance/retired), table, create modal |
| `src/app/(leader)/rov-systemer/[id]/page.tsx` | Detail page with system info, BOM editor, procedure editor, drawing editor |
| `src/app/api/rov-systems/[id]/route.ts` | GET/PATCH/DELETE single ROV system |
| `src/app/api/rov-systems/[id]/parts/route.ts` | POST/DELETE BOM entries |
| `src/app/api/rov-systems/[id]/procedures/route.ts` | POST/DELETE procedures for a system |
| `src/app/api/rov-systems/[id]/drawings/route.ts` | POST/DELETE drawings for a system |
| `src/components/rov-systems/RovSystemForm.tsx` | Modal form for create/edit system |
| `src/components/rov-systems/RovSystemTable.tsx` | Table for list page |
| `src/components/rov-systems/BomEditor.tsx` | Inline BOM editing with part selector |
| `src/components/rov-systems/ProcedureEditor.tsx` | Inline procedure list + add form |
| `src/components/rov-systems/DrawingEditor.tsx` | Inline drawing list + add form |

### Modified Files
| File | Change |
|------|--------|
| `src/components/Sidebar.tsx` | Add "ROV-systemer" nav item with Anchor icon |
| `src/lib/constants.ts` | Add ROV_STATUS_LABELS and ROV_STATUS_COLORS |
| `src/app/api/rov-systems/route.ts` | Add POST handler for creating new systems |
| `src/components/projects/RovSystemPicker.tsx` | Filter out retired systems from dropdown |

---

### Task 1: Add ROV status constants

**Files:**
- Modify: `src/lib/constants.ts`

- [ ] **Step 1: Add ROV status label and color constants**

Add to the end of `src/lib/constants.ts`:

```ts
export const ROV_STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  maintenance: "Vedlikehold",
  retired: "Utgått",
};

export const ROV_STATUS_COLORS: Record<string, string> = {
  active: "bg-status-completed/15 text-status-completed",
  maintenance: "bg-status-invoicing/15 text-status-invoicing",
  retired: "bg-warm-sand text-stone",
};
```

- [ ] **Step 2: Verify the file is valid**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to constants.ts

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: add ROV system status constants"
```

---

### Task 2: Add sidebar navigation item

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Add Anchor import**

In `src/components/Sidebar.tsx`, add `Anchor` to the lucide-react import:

```ts
import {
  FolderKanban,
  FileText,
  CheckSquare,
  Package,
  Wrench,
  Menu,
  X,
  LogOut,
  Anchor,
} from "lucide-react";
```

- [ ] **Step 2: Add ROV-systemer nav item**

In the `leaderNav` array, add the ROV entry between Prosjekter and Prosedyrer:

```ts
const leaderNav: NavItem[] = [
  { href: "/prosjekter", label: "Prosjekter", icon: FolderKanban },
  { href: "/rov-systemer", label: "ROV-systemer", icon: Anchor },
  { href: "/prosedyrer", label: "Prosedyrer", icon: FileText },
  { href: "/gjoremal", label: "Gjøremål", icon: CheckSquare },
  { href: "/lager", label: "Lager", icon: Package },
];
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add ROV-systemer to sidebar navigation"
```

---

### Task 3: Add POST handler to existing ROV systems API

**Files:**
- Modify: `src/app/api/rov-systems/route.ts`

- [ ] **Step 1: Add POST handler**

Add this POST function after the existing GET function in `src/app/api/rov-systems/route.ts`:

```ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, model, description } = body;

    if (!name || !model) {
      return Response.json(
        { error: "Name and model are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(rovSystems)
      .values({ name, model, description })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create ROV system:", error);
    return Response.json(
      { error: "Failed to create ROV system" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/rov-systems/route.ts
git commit -m "feat: add POST handler for creating ROV systems"
```

---

### Task 4: Create single ROV system API route (GET/PATCH/DELETE)

**Files:**
- Create: `src/app/api/rov-systems/[id]/route.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/app/api/rov-systems/\[id\]
```

- [ ] **Step 2: Write the route file**

Create `src/app/api/rov-systems/[id]/route.ts`:

```ts
import { db } from "@/lib/db";
import {
  rovSystems,
  rovSystemParts,
  parts,
  procedures,
  drawings,
  projects,
} from "@/lib/db/schema";
import { eq, and, notInArray } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const systemId = parseInt(id, 10);

    if (isNaN(systemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const system = await db
      .select()
      .from(rovSystems)
      .where(eq(rovSystems.id, systemId));

    if (system.length === 0) {
      return Response.json({ error: "ROV system not found" }, { status: 404 });
    }

    const [bom, systemProcedures, systemDrawings] = await Promise.all([
      db
        .select({
          id: rovSystemParts.id,
          partId: rovSystemParts.partId,
          quantityRequired: rovSystemParts.quantityRequired,
          notes: rovSystemParts.notes,
          partName: parts.name,
          partSku: parts.sku,
          partCategory: parts.category,
          partQuantity: parts.quantity,
          partMinStock: parts.minStock,
          partUnit: parts.unit,
        })
        .from(rovSystemParts)
        .leftJoin(parts, eq(rovSystemParts.partId, parts.id))
        .where(eq(rovSystemParts.rovSystemId, systemId)),
      db
        .select()
        .from(procedures)
        .where(eq(procedures.rovSystemId, systemId)),
      db
        .select()
        .from(drawings)
        .where(eq(drawings.rovSystemId, systemId)),
    ]);

    // Check if system is used in any project
    const linkedProjects = await db
      .select({ id: projects.id, status: projects.status })
      .from(projects)
      .where(eq(projects.rovSystemId, systemId));

    return Response.json({
      ...system[0],
      parts: bom,
      procedures: systemProcedures,
      drawings: systemDrawings,
      linkedProjects,
    });
  } catch (error) {
    console.error("Failed to fetch ROV system:", error);
    return Response.json(
      { error: "Failed to fetch ROV system" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const systemId = parseInt(id, 10);

    if (isNaN(systemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();

    const result = await db
      .update(rovSystems)
      .set({
        ...body,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(rovSystems.id, systemId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "ROV system not found" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error("Failed to update ROV system:", error);
    return Response.json(
      { error: "Failed to update ROV system" },
      { status: 500 }
    );
  }
}

const ACTIVE_PROJECT_STATUSES = ["planning", "workshop", "offshore", "invoicing"];

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const systemId = parseInt(id, 10);

    if (isNaN(systemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Check for linked projects
    const linkedProjects = await db
      .select({ id: projects.id, status: projects.status })
      .from(projects)
      .where(eq(projects.rovSystemId, systemId));

    const hasActiveProjects = linkedProjects.some((p) =>
      ACTIVE_PROJECT_STATUSES.includes(p.status)
    );

    if (hasActiveProjects) {
      return Response.json(
        {
          error:
            "Kan ikke slette — systemet er tilordnet aktive prosjekter. Sett som utgått i stedet.",
        },
        { status: 409 }
      );
    }

    if (linkedProjects.length > 0) {
      // Soft delete — set status to retired
      const result = await db
        .update(rovSystems)
        .set({ status: "retired", updatedAt: new Date().toISOString() })
        .where(eq(rovSystems.id, systemId))
        .returning();

      return Response.json({
        message: "ROV system set to retired (linked to completed projects)",
        system: result[0],
        softDelete: true,
      });
    }

    // Hard delete — never used in any project
    // Clean up related data first
    await Promise.all([
      db
        .delete(rovSystemParts)
        .where(eq(rovSystemParts.rovSystemId, systemId)),
      db.delete(procedures).where(eq(procedures.rovSystemId, systemId)),
      db.delete(drawings).where(eq(drawings.rovSystemId, systemId)),
    ]);

    const result = await db
      .delete(rovSystems)
      .where(eq(rovSystems.id, systemId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "ROV system not found" }, { status: 404 });
    }

    return Response.json({
      message: "ROV system deleted",
      system: result[0],
      softDelete: false,
    });
  } catch (error) {
    console.error("Failed to delete ROV system:", error);
    return Response.json(
      { error: "Failed to delete ROV system" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/rov-systems/\[id\]/route.ts
git commit -m "feat: add GET/PATCH/DELETE routes for single ROV system"
```

---

### Task 5: Create BOM parts API route

**Files:**
- Create: `src/app/api/rov-systems/[id]/parts/route.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/app/api/rov-systems/\[id\]/parts
```

- [ ] **Step 2: Write the route file**

Create `src/app/api/rov-systems/[id]/parts/route.ts`:

```ts
import { db } from "@/lib/db";
import { rovSystemParts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rovSystemId = parseInt(id, 10);

    if (isNaN(rovSystemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { partId, quantityRequired, notes } = body;

    if (!partId || !quantityRequired) {
      return Response.json(
        { error: "partId and quantityRequired are required" },
        { status: 400 }
      );
    }

    // Check if this part is already in the BOM
    const existing = await db
      .select()
      .from(rovSystemParts)
      .where(
        and(
          eq(rovSystemParts.rovSystemId, rovSystemId),
          eq(rovSystemParts.partId, partId)
        )
      );

    if (existing.length > 0) {
      return Response.json(
        { error: "Denne delen er allerede i stykklisten" },
        { status: 409 }
      );
    }

    const result = await db
      .insert(rovSystemParts)
      .values({ rovSystemId, partId, quantityRequired, notes })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to add BOM part:", error);
    return Response.json(
      { error: "Failed to add BOM part" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { bomId } = body;

    if (!bomId) {
      return Response.json({ error: "bomId is required" }, { status: 400 });
    }

    const result = await db
      .delete(rovSystemParts)
      .where(eq(rovSystemParts.id, bomId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "BOM entry not found" }, { status: 404 });
    }

    return Response.json({ message: "BOM entry removed", entry: result[0] });
  } catch (error) {
    console.error("Failed to remove BOM part:", error);
    return Response.json(
      { error: "Failed to remove BOM part" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/rov-systems/\[id\]/parts/route.ts
git commit -m "feat: add POST/DELETE routes for ROV system BOM parts"
```

---

### Task 6: Create procedures API route for ROV system

**Files:**
- Create: `src/app/api/rov-systems/[id]/procedures/route.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/app/api/rov-systems/\[id\]/procedures
```

- [ ] **Step 2: Write the route file**

Create `src/app/api/rov-systems/[id]/procedures/route.ts`:

```ts
import { db } from "@/lib/db";
import { procedures } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rovSystemId = parseInt(id, 10);

    if (isNaN(rovSystemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, category, description, version } = body;

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await db
      .insert(procedures)
      .values({
        name,
        category,
        description,
        version: version || "1.0",
        rovSystemId,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to add procedure:", error);
    return Response.json(
      { error: "Failed to add procedure" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { procedureId } = body;

    if (!procedureId) {
      return Response.json(
        { error: "procedureId is required" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(procedures)
      .where(eq(procedures.id, procedureId))
      .returning();

    if (result.length === 0) {
      return Response.json(
        { error: "Procedure not found" },
        { status: 404 }
      );
    }

    return Response.json({
      message: "Procedure removed",
      procedure: result[0],
    });
  } catch (error) {
    console.error("Failed to remove procedure:", error);
    return Response.json(
      { error: "Failed to remove procedure" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/rov-systems/\[id\]/procedures/route.ts
git commit -m "feat: add POST/DELETE routes for ROV system procedures"
```

---

### Task 7: Create drawings API route for ROV system

**Files:**
- Create: `src/app/api/rov-systems/[id]/drawings/route.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/app/api/rov-systems/\[id\]/drawings
```

- [ ] **Step 2: Write the route file**

Create `src/app/api/rov-systems/[id]/drawings/route.ts`:

```ts
import { db } from "@/lib/db";
import { drawings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rovSystemId = parseInt(id, 10);

    if (isNaN(rovSystemId)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, fileUrl, fileType, version } = body;

    if (!name || !fileUrl || !fileType) {
      return Response.json(
        { error: "name, fileUrl, and fileType are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(drawings)
      .values({
        name,
        description,
        fileUrl,
        fileType,
        version: version || "1.0",
        rovSystemId,
      })
      .returning();

    return Response.json(result[0], { status: 201 });
  } catch (error) {
    console.error("Failed to add drawing:", error);
    return Response.json(
      { error: "Failed to add drawing" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { drawingId } = body;

    if (!drawingId) {
      return Response.json(
        { error: "drawingId is required" },
        { status: 400 }
      );
    }

    const result = await db
      .delete(drawings)
      .where(eq(drawings.id, drawingId))
      .returning();

    if (result.length === 0) {
      return Response.json({ error: "Drawing not found" }, { status: 404 });
    }

    return Response.json({ message: "Drawing removed", drawing: result[0] });
  } catch (error) {
    console.error("Failed to remove drawing:", error);
    return Response.json(
      { error: "Failed to remove drawing" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/rov-systems/\[id\]/drawings/route.ts
git commit -m "feat: add POST/DELETE routes for ROV system drawings"
```

---

### Task 8: Create RovSystemForm component

**Files:**
- Create: `src/components/rov-systems/RovSystemForm.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p src/components/rov-systems
```

- [ ] **Step 2: Write the component**

Create `src/components/rov-systems/RovSystemForm.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export interface RovSystemFormData {
  name: string;
  model: string;
  description: string;
}

interface RovSystemFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RovSystemFormData) => void;
  initialData?: Partial<RovSystemFormData>;
}

const defaultForm: RovSystemFormData = {
  name: "",
  model: "",
  description: "",
};

export function RovSystemForm({
  open,
  onClose,
  onSubmit,
  initialData,
}: RovSystemFormProps) {
  const [form, setForm] = useState<RovSystemFormData>(defaultForm);

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...initialData });
    }
  }, [open, initialData]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.model.trim()) return;
    onSubmit(form);
  }

  const isEditing = !!initialData;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Rediger ROV-system" : "Nytt ROV-system"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Systemnavn *"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="F.eks. Kystdesign Supporter"
          required
        />

        <Input
          label="Modell *"
          id="model"
          name="model"
          value={form.model}
          onChange={handleChange}
          placeholder="F.eks. Supporter MK2"
          required
        />

        <Textarea
          label="Beskrivelse"
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Kort beskrivelse av systemet"
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Avbryt
          </Button>
          <Button type="submit" variant="primary">
            {isEditing ? "Lagre endringer" : "Opprett system"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/rov-systems/RovSystemForm.tsx
git commit -m "feat: add RovSystemForm modal component"
```

---

### Task 9: Create RovSystemTable component

**Files:**
- Create: `src/components/rov-systems/RovSystemTable.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/rov-systems/RovSystemTable.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ROV_STATUS_LABELS, ROV_STATUS_COLORS } from "@/lib/constants";
import { Anchor } from "lucide-react";

interface RovSystem {
  id: number;
  name: string;
  model: string;
  status: string;
  bomCount: number;
  createdAt: string;
}

interface RovSystemTableProps {
  systems: RovSystem[];
}

export function RovSystemTable({ systems }: RovSystemTableProps) {
  const router = useRouter();

  if (systems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-warm-sand p-4 mb-4">
          <Anchor className="h-8 w-8 text-stone" />
        </div>
        <p className="text-lg font-medium text-charcoal">
          Ingen ROV-systemer funnet
        </p>
        <p className="text-sm text-stone mt-1">
          Opprett et nytt ROV-system for å komme i gang.
        </p>
      </div>
    );
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {systems.map((system) => (
          <div
            key={system.id}
            onClick={() => router.push(`/rov-systemer/${system.id}`)}
            className="rounded-lg border border-border-cream p-3 cursor-pointer hover:bg-warm-sand/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-medium text-near-black truncate">
                  {system.name}
                </p>
                <p className="text-xs text-charcoal mt-0.5">{system.model}</p>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                  ROV_STATUS_COLORS[system.status] || ""
                }`}
              >
                {ROV_STATUS_LABELS[system.status] || system.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone">
              <span>{system.bomCount} deler i BOM</span>
              <span>&middot;</span>
              <span>{formatDate(system.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-cream text-left">
              <th className="pb-3 pt-1 font-medium text-stone">Navn</th>
              <th className="pb-3 pt-1 font-medium text-stone">Modell</th>
              <th className="pb-3 pt-1 font-medium text-stone">Status</th>
              <th className="pb-3 pt-1 font-medium text-stone hidden md:table-cell">
                BOM-deler
              </th>
              <th className="pb-3 pt-1 font-medium text-stone hidden lg:table-cell">
                Opprettet
              </th>
            </tr>
          </thead>
          <tbody>
            {systems.map((system) => (
              <tr
                key={system.id}
                onClick={() => router.push(`/rov-systemer/${system.id}`)}
                className="border-b border-border-cream last:border-b-0 cursor-pointer hover:bg-warm-sand/30 transition-colors"
              >
                <td className="py-3 pr-4">
                  <span className="font-medium text-near-black">
                    {system.name}
                  </span>
                </td>
                <td className="py-3 pr-4 text-charcoal">{system.model}</td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                      ROV_STATUS_COLORS[system.status] || ""
                    }`}
                  >
                    {ROV_STATUS_LABELS[system.status] || system.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-charcoal hidden md:table-cell">
                  {system.bomCount}
                </td>
                <td className="py-3 text-charcoal hidden lg:table-cell">
                  {formatDate(system.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/rov-systems/RovSystemTable.tsx
git commit -m "feat: add RovSystemTable component"
```

---

### Task 10: Create ROV systems list page

**Files:**
- Create: `src/app/(leader)/rov-systemer/page.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "src/app/(leader)/rov-systemer"
```

- [ ] **Step 2: Write the page**

Create `src/app/(leader)/rov-systemer/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { RovSystemTable } from "@/components/rov-systems/RovSystemTable";
import {
  RovSystemForm,
  type RovSystemFormData,
} from "@/components/rov-systems/RovSystemForm";
import { Plus, Loader2 } from "lucide-react";

interface RovSystemListItem {
  id: number;
  name: string;
  model: string;
  status: string;
  bomCount: number;
  createdAt: string;
}

type TabId = "active" | "maintenance" | "retired";

export default function RovSystemsPage() {
  const [systems, setSystems] = useState<RovSystemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("active");
  const [formOpen, setFormOpen] = useState(false);

  const fetchSystems = useCallback(async () => {
    try {
      const res = await fetch("/api/rov-systems");
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();

      // Fetch BOM counts for each system
      const enriched: RovSystemListItem[] = await Promise.all(
        data.map(async (system: { id: number; name: string; model: string; status: string; createdAt: string }) => {
          const detailRes = await fetch(`/api/rov-systems/${system.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            return { ...system, bomCount: detail.parts?.length || 0 };
          }
          return { ...system, bomCount: 0 };
        })
      );

      setSystems(enriched);
    } catch (err) {
      console.error("Kunne ikke hente ROV-systemer:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const activeSystems = systems.filter((s) => s.status === "active");
  const maintenanceSystems = systems.filter((s) => s.status === "maintenance");
  const retiredSystems = systems.filter((s) => s.status === "retired");

  const filteredSystems =
    activeTab === "active"
      ? activeSystems
      : activeTab === "maintenance"
        ? maintenanceSystems
        : retiredSystems;

  const tabs = [
    { id: "active", label: "Aktive", count: activeSystems.length },
    {
      id: "maintenance",
      label: "Vedlikehold",
      count: maintenanceSystems.length,
    },
    { id: "retired", label: "Utgåtte", count: retiredSystems.length },
  ];

  async function handleCreateSystem(data: RovSystemFormData) {
    try {
      const res = await fetch("/api/rov-systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Feil ved opprettelse");
      setFormOpen(false);
      await fetchSystems();
    } catch (err) {
      console.error("Kunne ikke opprette ROV-system:", err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-2xl font-serif font-bold text-near-black">
          ROV-systemer
        </h1>
        <Button variant="primary" onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          Legg til ROV-system
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        defaultTab="active"
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* System table */}
      <Card>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-stone">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Laster ROV-systemer...
            </div>
          ) : (
            <RovSystemTable systems={filteredSystems} />
          )}
        </CardContent>
      </Card>

      {/* Create form modal */}
      <RovSystemForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreateSystem}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add "src/app/(leader)/rov-systemer/page.tsx"
git commit -m "feat: add ROV systems list page with tabs and create modal"
```

---

### Task 11: Create BomEditor component

**Files:**
- Create: `src/components/rov-systems/BomEditor.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/rov-systems/BomEditor.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { getStockStatus, STOCK_STATUS } from "@/lib/constants";
import { Plus, X, Package } from "lucide-react";

interface BomEntry {
  id: number;
  partId: number;
  quantityRequired: number;
  notes: string | null;
  partName: string | null;
  partSku: string | null;
  partCategory: string | null;
  partQuantity: number | null;
  partMinStock: number | null;
  partUnit: string | null;
}

interface AvailablePart {
  id: number;
  name: string;
  sku: string;
  category: string | null;
}

interface BomEditorProps {
  rovSystemId: number;
  entries: BomEntry[];
  onUpdate: () => void;
}

export function BomEditor({ rovSystemId, entries, onUpdate }: BomEditorProps) {
  const [adding, setAdding] = useState(false);
  const [availableParts, setAvailableParts] = useState<AvailablePart[]>([]);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [quantity, setQuantity] = useState("1");

  useEffect(() => {
    if (adding) {
      fetch("/api/parts")
        .then((res) => res.json())
        .then((data) => setAvailableParts(data))
        .catch((err) => console.error("Kunne ikke hente deler:", err));
    }
  }, [adding]);

  async function handleAdd() {
    if (!selectedPartId || !quantity) return;

    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partId: parseInt(selectedPartId, 10),
          quantityRequired: parseInt(quantity, 10),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Feil ved tillegging");
        return;
      }

      setAdding(false);
      setSelectedPartId("");
      setQuantity("1");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke legge til del:", err);
    }
  }

  async function handleRemove(bomId: number) {
    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/parts`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bomId }),
      });

      if (!res.ok) throw new Error("Feil");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke fjerne del:", err);
    }
  }

  // Filter out parts already in the BOM
  const existingPartIds = new Set(entries.map((e) => e.partId));
  const selectableParts = availableParts.filter(
    (p) => !existingPartIds.has(p.id)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-terracotta" />
          <h3 className="text-sm font-medium text-near-black">
            Stykkliste (BOM) ({entries.length})
          </h3>
        </div>
        {!adding && (
          <Button variant="ghost" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Legg til del
          </Button>
        )}
      </div>

      {entries.length === 0 && !adding && (
        <p className="text-sm text-stone py-4 text-center">
          Ingen deler i stykklisten ennå.
        </p>
      )}

      {entries.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {entries.map((entry) => {
            const stockStatus =
              entry.partQuantity !== null && entry.partMinStock !== null
                ? getStockStatus(entry.partQuantity, entry.partMinStock)
                : null;

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-warm-sand/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-near-black font-medium truncate">
                    {entry.partName || "Ukjent del"}
                  </span>
                  {entry.partSku && (
                    <span className="text-xs text-stone">{entry.partSku}</span>
                  )}
                  {entry.partCategory && (
                    <span className="text-xs text-stone hidden sm:inline">
                      {entry.partCategory}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-charcoal">
                    x{entry.quantityRequired}
                  </span>
                  {stockStatus && (
                    <span
                      className={`text-xs font-medium ${STOCK_STATUS[stockStatus].color}`}
                    >
                      {entry.partQuantity} på lager
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="p-1 rounded text-stone hover:text-error hover:bg-error/10 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {adding && (
        <div className="rounded-lg border border-border-cream p-3 space-y-3">
          <Select
            label="Del"
            id="bom-part"
            name="partId"
            value={selectedPartId}
            onChange={(e) => setSelectedPartId(e.target.value)}
            options={selectableParts.map((p) => ({
              value: String(p.id),
              label: `${p.name} (${p.sku})`,
            }))}
          />
          <Input
            label="Antall påkrevd"
            id="bom-qty"
            name="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                setSelectedPartId("");
                setQuantity("1");
              }}
            >
              Avbryt
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Legg til
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/rov-systems/BomEditor.tsx
git commit -m "feat: add BomEditor component with inline add/remove"
```

---

### Task 12: Create ProcedureEditor component

**Files:**
- Create: `src/components/rov-systems/ProcedureEditor.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/rov-systems/ProcedureEditor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Plus, X, FileText } from "lucide-react";

interface Procedure {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  version: string | null;
}

interface ProcedureEditorProps {
  rovSystemId: number;
  procedures: Procedure[];
  onUpdate: () => void;
}

export function ProcedureEditor({
  rovSystemId,
  procedures,
  onUpdate,
}: ProcedureEditorProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0");

  async function handleAdd() {
    if (!name.trim()) return;

    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/procedures`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category: category || null,
          description: description || null,
          version,
        }),
      });

      if (!res.ok) throw new Error("Feil");

      setAdding(false);
      setName("");
      setCategory("");
      setDescription("");
      setVersion("1.0");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke legge til prosedyre:", err);
    }
  }

  async function handleRemove(procedureId: number) {
    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/procedures`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ procedureId }),
      });

      if (!res.ok) throw new Error("Feil");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke fjerne prosedyre:", err);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-terracotta" />
          <h3 className="text-sm font-medium text-near-black">
            Prosedyrer ({procedures.length})
          </h3>
        </div>
        {!adding && (
          <Button variant="ghost" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Legg til prosedyre
          </Button>
        )}
      </div>

      {procedures.length === 0 && !adding && (
        <p className="text-sm text-stone py-4 text-center">
          Ingen prosedyrer ennå.
        </p>
      )}

      {procedures.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {procedures.map((proc) => (
            <div
              key={proc.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-warm-sand/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 text-stone shrink-0" />
                <span className="text-near-black truncate">{proc.name}</span>
                {proc.category && <Badge>{proc.category}</Badge>}
                {proc.version && (
                  <span className="text-xs text-stone">v{proc.version}</span>
                )}
              </div>
              <button
                onClick={() => handleRemove(proc.id)}
                className="p-1 rounded text-stone hover:text-error hover:bg-error/10 transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="rounded-lg border border-border-cream p-3 space-y-3">
          <Input
            label="Prosedyrenavn *"
            id="proc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. Oppstart av hydraulikksystem"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Kategori"
              id="proc-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="F.eks. Hydraulikk"
            />
            <Input
              label="Versjon"
              id="proc-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0"
            />
          </div>
          <Textarea
            label="Beskrivelse"
            id="proc-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kort beskrivelse av prosedyren"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                setName("");
                setCategory("");
                setDescription("");
                setVersion("1.0");
              }}
            >
              Avbryt
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Legg til
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/rov-systems/ProcedureEditor.tsx
git commit -m "feat: add ProcedureEditor component with inline add/remove"
```

---

### Task 13: Create DrawingEditor component

**Files:**
- Create: `src/components/rov-systems/DrawingEditor.tsx`

- [ ] **Step 1: Write the component**

Create `src/components/rov-systems/DrawingEditor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus, X, PenTool } from "lucide-react";

interface Drawing {
  id: number;
  name: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  version: string | null;
}

interface DrawingEditorProps {
  rovSystemId: number;
  drawings: Drawing[];
  onUpdate: () => void;
}

const fileTypeOptions = [
  { value: "pdf", label: "PDF" },
  { value: "dwg", label: "DWG" },
  { value: "png", label: "PNG" },
];

export function DrawingEditor({
  rovSystemId,
  drawings,
  onUpdate,
}: DrawingEditorProps) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [fileType, setFileType] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [version, setVersion] = useState("1.0");

  async function handleAdd() {
    if (!name.trim() || !fileType || !fileUrl.trim()) return;

    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/drawings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, fileType, fileUrl, version }),
      });

      if (!res.ok) throw new Error("Feil");

      setAdding(false);
      setName("");
      setFileType("");
      setFileUrl("");
      setVersion("1.0");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke legge til tegning:", err);
    }
  }

  async function handleRemove(drawingId: number) {
    try {
      const res = await fetch(`/api/rov-systems/${rovSystemId}/drawings`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawingId }),
      });

      if (!res.ok) throw new Error("Feil");
      onUpdate();
    } catch (err) {
      console.error("Kunne ikke fjerne tegning:", err);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4 text-terracotta" />
          <h3 className="text-sm font-medium text-near-black">
            Tegninger ({drawings.length})
          </h3>
        </div>
        {!adding && (
          <Button variant="ghost" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" />
            Legg til tegning
          </Button>
        )}
      </div>

      {drawings.length === 0 && !adding && (
        <p className="text-sm text-stone py-4 text-center">
          Ingen tegninger ennå.
        </p>
      )}

      {drawings.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {drawings.map((drawing) => (
            <div
              key={drawing.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-warm-sand/20"
            >
              <div className="flex items-center gap-2 min-w-0">
                <PenTool className="h-3.5 w-3.5 text-stone shrink-0" />
                <span className="text-near-black truncate">{drawing.name}</span>
                <span className="text-xs text-stone uppercase font-medium">
                  {drawing.fileType}
                </span>
                {drawing.version && (
                  <span className="text-xs text-stone">v{drawing.version}</span>
                )}
              </div>
              <button
                onClick={() => handleRemove(drawing.id)}
                className="p-1 rounded text-stone hover:text-error hover:bg-error/10 transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div className="rounded-lg border border-border-cream p-3 space-y-3">
          <Input
            label="Tegningsnavn *"
            id="drawing-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="F.eks. Hydraulikkskjema hovedsystem"
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Filtype *"
              id="drawing-filetype"
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              options={fileTypeOptions}
            />
            <Input
              label="Versjon"
              id="drawing-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0"
            />
          </div>
          <Input
            label="Fil-URL *"
            id="drawing-url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://... eller /files/..."
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAdding(false);
                setName("");
                setFileType("");
                setFileUrl("");
                setVersion("1.0");
              }}
            >
              Avbryt
            </Button>
            <Button variant="primary" onClick={handleAdd}>
              Legg til
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/rov-systems/DrawingEditor.tsx
git commit -m "feat: add DrawingEditor component with inline add/remove"
```

---

### Task 14: Create ROV system detail page

**Files:**
- Create: `src/app/(leader)/rov-systemer/[id]/page.tsx`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p "src/app/(leader)/rov-systemer/[id]"
```

- [ ] **Step 2: Write the page**

Create `src/app/(leader)/rov-systemer/[id]/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  RovSystemForm,
  type RovSystemFormData,
} from "@/components/rov-systems/RovSystemForm";
import { BomEditor } from "@/components/rov-systems/BomEditor";
import { ProcedureEditor } from "@/components/rov-systems/ProcedureEditor";
import { DrawingEditor } from "@/components/rov-systems/DrawingEditor";
import { ROV_STATUS_LABELS, ROV_STATUS_COLORS } from "@/lib/constants";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Anchor,
  Archive,
  Trash2,
} from "lucide-react";

interface BomEntry {
  id: number;
  partId: number;
  quantityRequired: number;
  notes: string | null;
  partName: string | null;
  partSku: string | null;
  partCategory: string | null;
  partQuantity: number | null;
  partMinStock: number | null;
  partUnit: string | null;
}

interface Procedure {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  version: string | null;
}

interface Drawing {
  id: number;
  name: string;
  description: string | null;
  fileUrl: string;
  fileType: string;
  version: string | null;
}

interface LinkedProject {
  id: number;
  status: string;
}

interface RovSystemDetail {
  id: number;
  name: string;
  model: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  parts: BomEntry[];
  procedures: Procedure[];
  drawings: Drawing[];
  linkedProjects: LinkedProject[];
}

export default function RovSystemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [system, setSystem] = useState<RovSystemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchSystem = useCallback(async () => {
    try {
      const res = await fetch(`/api/rov-systems/${id}`);
      if (!res.ok) throw new Error("Feil");
      const data = await res.json();
      setSystem(data);
    } catch (err) {
      console.error("Kunne ikke hente ROV-system:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSystem();
  }, [fetchSystem]);

  async function handleEditSubmit(data: RovSystemFormData) {
    try {
      const res = await fetch(`/api/rov-systems/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Feil ved oppdatering");
      setEditOpen(false);
      await fetchSystem();
    } catch (err) {
      console.error("Kunne ikke oppdatere ROV-system:", err);
    }
  }

  async function handleRetire() {
    if (!confirm("Er du sikker på at du vil sette systemet som utgått?"))
      return;

    try {
      const res = await fetch(`/api/rov-systems/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "retired" }),
      });
      if (!res.ok) throw new Error("Feil");
      await fetchSystem();
    } catch (err) {
      console.error("Kunne ikke sette system som utgått:", err);
    }
  }

  async function handleDelete() {
    if (!confirm("Er du sikker på at du vil slette dette ROV-systemet?"))
      return;

    try {
      const res = await fetch(`/api/rov-systems/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "Feil ved sletting");
        return;
      }

      router.push("/rov-systemer");
    } catch (err) {
      console.error("Kunne ikke slette ROV-system:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-stone">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Laster ROV-system...
      </div>
    );
  }

  if (!system) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/rov-systemer")}>
          <ArrowLeft className="h-4 w-4" />
          Tilbake
        </Button>
        <div className="text-center py-16">
          <p className="text-lg font-medium text-charcoal">
            ROV-systemet ble ikke funnet
          </p>
        </div>
      </div>
    );
  }

  const hasLinkedProjects = system.linkedProjects.length > 0;
  const editInitialData: Partial<RovSystemFormData> = {
    name: system.name,
    model: system.model,
    description: system.description || "",
  };

  return (
    <div className="space-y-6">
      {/* Back button + title */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push("/rov-systemer")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til ROV-systemer
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-serif font-bold text-near-black">
            {system.name}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
              Rediger
            </Button>
            {system.status !== "retired" && hasLinkedProjects && (
              <Button variant="secondary" onClick={handleRetire}>
                <Archive className="h-4 w-4" />
                Sett som utgått
              </Button>
            )}
            {!hasLinkedProjects && (
              <Button variant="secondary" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Slett
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* System info card */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-warm-sand p-2">
              <Anchor className="h-5 w-5 text-terracotta" />
            </div>
            <div>
              <p className="font-medium text-near-black">{system.name}</p>
              <p className="text-sm text-stone">Modell: {system.model}</p>
            </div>
            <span
              className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                ROV_STATUS_COLORS[system.status] || ""
              }`}
            >
              {ROV_STATUS_LABELS[system.status] || system.status}
            </span>
          </div>
          {system.description && (
            <p className="text-sm text-charcoal border-t border-border-cream pt-3">
              {system.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* BOM Editor */}
      <Card>
        <CardContent>
          <BomEditor
            rovSystemId={system.id}
            entries={system.parts}
            onUpdate={fetchSystem}
          />
        </CardContent>
      </Card>

      {/* Procedure Editor */}
      <Card>
        <CardContent>
          <ProcedureEditor
            rovSystemId={system.id}
            procedures={system.procedures}
            onUpdate={fetchSystem}
          />
        </CardContent>
      </Card>

      {/* Drawing Editor */}
      <Card>
        <CardContent>
          <DrawingEditor
            rovSystemId={system.id}
            drawings={system.drawings}
            onUpdate={fetchSystem}
          />
        </CardContent>
      </Card>

      {/* Edit form modal */}
      <RovSystemForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={editInitialData}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add "src/app/(leader)/rov-systemer/[id]/page.tsx"
git commit -m "feat: add ROV system detail page with inline editors"
```

---

### Task 15: Filter retired systems from RovSystemPicker

**Files:**
- Modify: `src/components/projects/RovSystemPicker.tsx`

- [ ] **Step 1: Read the current RovSystemPicker**

Read the file to find the fetch and rendering logic.

- [ ] **Step 2: Add filter for retired systems**

In the `RovSystemPicker.tsx`, after fetching the ROV systems list, filter out retired systems. Find the line where systems are fetched and stored in state (likely `setSystems(data)` or similar), and add a filter:

```ts
// Change from:
setSystems(data);
// Change to:
setSystems(data.filter((s: { status: string }) => s.status !== "retired"));
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/projects/RovSystemPicker.tsx
git commit -m "feat: filter retired ROV systems from project picker"
```

---

### Task 16: Verify full build

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit --pretty`
Expected: No errors

- [ ] **Step 2: Run Next.js build**

Run: `npx next build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Manual smoke test**

Start the dev server: `npx next dev -p 30099`

Verify:
1. Sidebar shows "ROV-systemer" link between "Prosjekter" and "Prosedyrer"
2. `/rov-systemer` loads with tabs (Aktive/Vedlikehold/Utgåtte) and existing seeded systems
3. "Legg til ROV-system" opens modal, can create a new system
4. Clicking a system navigates to `/rov-systemer/[id]`
5. Detail page shows system info, BOM, procedures, drawings
6. Can add/remove BOM entries, procedures, drawings
7. Can edit system details via modal
8. Delete/retire buttons work according to rules
9. Retired systems don't appear in RovSystemPicker on project pages

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete ROV system administration feature"
```
