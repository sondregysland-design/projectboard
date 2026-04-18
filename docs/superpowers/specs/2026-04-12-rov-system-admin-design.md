# ROV-system administrasjon — Design Spec

## Oversikt

Legger til full CRUD + inline redigering for ROV-systemer i prosjekt-dashboardet. Brukere (prosjektledere) kan opprette, redigere og administrere ROV-systemer med tilhørende BOM (Bill of Materials), prosedyrer og tegninger — alt fra én side per system.

## Beslutninger

| Spørsmål | Beslutning | Begrunnelse |
|----------|-----------|-------------|
| Administrasjonsnivå | Enkel CRUD + inline redigering | Balanse mellom enkelhet og brukervennlighet |
| Navigasjon | Egen toppnivå-side `/rov-systemer` | ROV er kjerne-entitet, ikke underfunksjon |
| Tilgangskontroll | Under `(leader)` layout | Følger eksisterende mønster |
| Sletting | Soft delete via "retired" status | Bevarer dataintegritet for prosjekthistorikk |

## Navigasjon

Nytt menypunkt i `Sidebar.tsx` → `leaderNav`:

```ts
{ href: "/rov-systemer", label: "ROV-systemer", icon: Anchor }
```

Plasseres mellom "Prosjekter" og "Prosedyrer".

## Sider

### Listeside — `/rov-systemer`

**Rute:** `src/app/(leader)/rov-systemer/page.tsx`

- **Tabs:** Aktive | Vedlikehold | Utgåtte
- **Tabell:** Navn, Modell, Status (badge), Antall BOM-deler, Opprettet
- **"Legg til ROV-system"** knapp → åpner modal med skjema (navn*, modell*, beskrivelse)
- Klikk på rad → navigerer til detaljside `/rov-systemer/[id]`
- Følger eksakt samme mønster som `/prosjekter` (page.tsx med fetch, tabs, tabell, form-modal)

### Detaljside — `/rov-systemer/[id]`

**Rute:** `src/app/(leader)/rov-systemer/[id]/page.tsx`

Oppdelt i seksjoner med `Card`-komponenter:

#### System-info kort
- Viser: navn, modell, status (badge), beskrivelse
- "Rediger"-knapp → åpner modal for å endre felt
- "Sett som utgått"-knapp → setter status til "retired" (soft delete)
- Kun synlig for systemer som har vært brukt i prosjekter
- Systemer som aldri har vært brukt → viser "Slett"-knapp (hard delete)

#### BOM (Bill of Materials)
- Tabell: Del (navn), SKU, Kategori, Antall påkrevd, Lagerstatus
- "Legg til del"-rad: dropdown (velg fra eksisterende `parts`) + antall-input + lagre-knapp
- Slett-knapp (X) per rad for å fjerne del fra BOM
- Viser lagerstatus med fargekoding (grønn/gul/rød basert på min_stock)

#### Prosedyrer
- Liste: Navn, Kategori, Versjon
- "Legg til prosedyre"-knapp → inline skjema (navn*, kategori, beskrivelse, versjon)
- Slett-knapp per rad

#### Tegninger
- Liste: Navn, Filtype (badge: PDF/DWG/PNG), Versjon
- "Legg til tegning"-knapp → inline skjema (navn*, filtype*, URL*, versjon)
- Slett-knapp per rad

## API-ruter

### Utvide eksisterende rute

**`src/app/api/rov-systems/route.ts`** — legger til POST, PATCH, DELETE:

| Metode | Endepunkt | Beskrivelse |
|--------|----------|-------------|
| GET | `/api/rov-systems` | Liste alle (eksisterer) |
| GET | `/api/rov-systems?id={id}` | Hent én med BOM/prosedyrer/tegninger (eksisterer) |
| POST | `/api/rov-systems` | Opprett nytt system |
| PATCH | `/api/rov-systems?id={id}` | Oppdater system (inkl. status → retired) |
| DELETE | `/api/rov-systems?id={id}` | Slett (kun hvis aldri brukt i prosjekt) |

### Nye ruter

| Metode | Endepunkt | Beskrivelse |
|--------|----------|-------------|
| POST | `/api/rov-systems/[id]/parts` | Legg til del i BOM |
| DELETE | `/api/rov-systems/[id]/parts` | Fjern del fra BOM (body: `{ bomId }`) |
| POST | `/api/rov-systems/[id]/procedures` | Legg til prosedyre |
| DELETE | `/api/rov-systems/[id]/procedures` | Fjern prosedyre (body: `{ procedureId }`) |
| POST | `/api/rov-systems/[id]/drawings` | Legg til tegning |
| DELETE | `/api/rov-systems/[id]/drawings` | Fjern tegning (body: `{ drawingId }`) |

## Slettebeskyttelse

Logikk ved sletting/utgåelse av ROV-system:

1. **Har aktive prosjekter** (status: planning/workshop/offshore/invoicing) → blokkér sletting, vis feilmelding: "Kan ikke slette — systemet er tilordnet aktive prosjekter. Sett som utgått i stedet."
2. **Har kun fullførte/standby prosjekter** → tillat soft delete (status → "retired")
3. **Aldri brukt i prosjekt** → tillat hard delete (fjern fra database)
4. **Retired systemer** → filtreres ut fra `RovSystemPicker` dropdown i prosjekt-tilordning

## Komponenter

### Nye filer

| Fil | Beskrivelse |
|-----|-------------|
| `src/components/rov-systems/RovSystemForm.tsx` | Modal for opprett/rediger system (følger ProjectForm-mønster) |
| `src/components/rov-systems/RovSystemTable.tsx` | Tabell for listesiden |
| `src/components/rov-systems/BomEditor.tsx` | Inline BOM-redigering med del-velger |
| `src/components/rov-systems/ProcedureEditor.tsx` | Inline prosedyre-redigering |
| `src/components/rov-systems/DrawingEditor.tsx` | Inline tegning-redigering |

### Gjenbrukte UI-komponenter

`Card`, `CardContent`, `Button`, `Modal`, `Input`, `Select`, `Textarea`, `Badge`, `Tabs`

## Teknisk stack

Følger eksisterende mønstre i prosjektet:
- **Framework:** Next.js (App Router med route groups)
- **Database:** SQLite via LibSQL + Drizzle ORM
- **Styling:** Tailwind CSS med prosjektets fargepalett (terracotta, warm-sand, ivory, etc.)
- **Ikoner:** Lucide React
- **Språk:** Norsk i UI, engelsk i kode

## Ingen skjemaendringer

Eksisterende database-skjema (`schema.ts`) dekker alle behov. Ingen migrasjoner nødvendig.
