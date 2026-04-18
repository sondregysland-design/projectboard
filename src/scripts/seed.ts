import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  rovSystems,
  projects,
  procedures,
  drawings,
  parts,
  rovSystemParts,
  todos,
  workshopLogs,
} from "../lib/db/schema";

const client = createClient({
  url: process.env.DATABASE_URL || "file:./data/project-dashboard.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client);

async function seed() {
  console.log("Seeding database...");

  // --- ROV Systems ---
  const rovData = [
    {
      name: "Kystdesign Supporter",
      model: "Supporter MK2",
      description:
        "Arbeidklasse ROV for inspeksjon, vedlikehold og lette konstruksjonsoppgaver. Maks dybde 3000m.",
      status: "active" as const,
    },
    {
      name: "Oceaneering Millennium Plus",
      model: "Millennium Plus",
      description:
        "Tungarbeidklasse ROV for dype intervensjoner, borerelatert arbeid og subsea-konstruksjon. Maks dybde 4000m.",
      status: "active" as const,
    },
    {
      name: "Saab Seaeye Cougar XT",
      model: "Cougar XT",
      description:
        "Kompakt observasjonsklasse ROV for inspeksjon og survey. Maks dybde 2000m.",
      status: "active" as const,
    },
    {
      name: "Forum Comanche",
      model: "Comanche 3000",
      description:
        "Allsidig arbeidklasse ROV for subsea-operasjoner, pipeline-inspeksjon og vedlikehold. Maks dybde 3000m.",
      status: "maintenance" as const,
    },
  ];

  const insertedRovs = [];
  for (const rov of rovData) {
    const [r] = await db.insert(rovSystems).values(rov).returning();
    insertedRovs.push(r);
  }
  console.log(`  ${insertedRovs.length} ROV-systemer opprettet`);

  // --- Parts ---
  const partsData = [
    { name: "Hydraulikkslange 1/2\"", sku: "HYD-SL-050", category: "Hydraulikk", quantity: 45, minStock: 10, maxStock: 80, unit: "meter" as const, unitPrice: 350, supplier: "Parker Hannifin", location: "Lager A-01" },
    { name: "Hydraulikkslange 3/4\"", sku: "HYD-SL-075", category: "Hydraulikk", quantity: 30, minStock: 8, maxStock: 60, unit: "meter" as const, unitPrice: 520, supplier: "Parker Hannifin", location: "Lager A-01" },
    { name: "Hydraulikkpumpe 150bar", sku: "HYD-PU-150", category: "Hydraulikk", quantity: 4, minStock: 2, maxStock: 8, unit: "stk" as const, unitPrice: 45000, supplier: "Bosch Rexroth", location: "Lager A-02" },
    { name: "Hydraulikkolje ISO 46", sku: "HYD-OL-046", category: "Hydraulikk", quantity: 200, minStock: 50, maxStock: 400, unit: "liter" as const, unitPrice: 85, supplier: "Shell", location: "Lager A-03" },
    { name: "Thruster motor 15kW", sku: "EL-TH-015", category: "Elektronikk", quantity: 6, minStock: 2, maxStock: 10, unit: "stk" as const, unitPrice: 125000, supplier: "Siemens", location: "Lager B-01" },
    { name: "Thruster motor 25kW", sku: "EL-TH-025", category: "Elektronikk", quantity: 3, minStock: 2, maxStock: 8, unit: "stk" as const, unitPrice: 185000, supplier: "Siemens", location: "Lager B-01" },
    { name: "Undervannsskamera HD", sku: "OPT-KAM-HD", category: "Optikk", quantity: 8, minStock: 3, maxStock: 15, unit: "stk" as const, unitPrice: 75000, supplier: "SubC Imaging", location: "Lager C-01" },
    { name: "Undervannsskamera 4K", sku: "OPT-KAM-4K", category: "Optikk", quantity: 4, minStock: 2, maxStock: 8, unit: "stk" as const, unitPrice: 145000, supplier: "SubC Imaging", location: "Lager C-01" },
    { name: "LED Lyskaster 500W", sku: "OPT-LYS-500", category: "Optikk", quantity: 12, minStock: 4, maxStock: 20, unit: "stk" as const, unitPrice: 28000, supplier: "Deep Sea Power & Light", location: "Lager C-02" },
    { name: "Manipulatorarm 5-funksjon", sku: "MEK-MAN-5F", category: "Mekanisk", quantity: 3, minStock: 1, maxStock: 6, unit: "stk" as const, unitPrice: 350000, supplier: "Schilling Robotics", location: "Lager D-01" },
    { name: "Manipulatorarm 7-funksjon", sku: "MEK-MAN-7F", category: "Mekanisk", quantity: 2, minStock: 1, maxStock: 4, unit: "stk" as const, unitPrice: 580000, supplier: "Schilling Robotics", location: "Lager D-01" },
    { name: "TMS Umbilical 1000m", sku: "KAB-TMS-1K", category: "Kabel", quantity: 2, minStock: 1, maxStock: 4, unit: "stk" as const, unitPrice: 890000, supplier: "Nexans", location: "Lager E-01" },
    { name: "TMS Umbilical 2000m", sku: "KAB-TMS-2K", category: "Kabel", quantity: 1, minStock: 1, maxStock: 3, unit: "stk" as const, unitPrice: 1650000, supplier: "Nexans", location: "Lager E-01" },
    { name: "Kontrollkabel 500m", sku: "KAB-KTR-500", category: "Kabel", quantity: 8, minStock: 3, maxStock: 15, unit: "stk" as const, unitPrice: 42000, supplier: "Nexans", location: "Lager E-02" },
    { name: "Dykkepanel kontroller", sku: "EL-DYK-CTR", category: "Elektronikk", quantity: 5, minStock: 2, maxStock: 10, unit: "stk" as const, unitPrice: 95000, supplier: "Kongsberg Maritime", location: "Lager B-02" },
    { name: "Sonar transponder", sku: "EL-SON-TRP", category: "Elektronikk", quantity: 10, minStock: 4, maxStock: 20, unit: "stk" as const, unitPrice: 38000, supplier: "Kongsberg Maritime", location: "Lager B-03" },
    { name: "Dybdemåler sensor", sku: "EL-DYB-SEN", category: "Elektronikk", quantity: 7, minStock: 3, maxStock: 12, unit: "stk" as const, unitPrice: 22000, supplier: "Valeport", location: "Lager B-04" },
    { name: "O-ring sett ROV", sku: "MEK-ORI-SET", category: "Mekanisk", quantity: 25, minStock: 10, maxStock: 50, unit: "stk" as const, unitPrice: 1200, supplier: "Trelleborg", location: "Lager D-02" },
    { name: "Hydraulikkfilter", sku: "HYD-FIL-001", category: "Hydraulikk", quantity: 18, minStock: 8, maxStock: 30, unit: "stk" as const, unitPrice: 3500, supplier: "Parker Hannifin", location: "Lager A-04" },
    { name: "Ventilblokk 4-veis", sku: "HYD-VEN-4V", category: "Hydraulikk", quantity: 6, minStock: 2, maxStock: 10, unit: "stk" as const, unitPrice: 28000, supplier: "Bosch Rexroth", location: "Lager A-05" },
    { name: "Subsea-kontakt 8-pin", sku: "EL-SUB-8P", category: "Elektronikk", quantity: 15, minStock: 5, maxStock: 25, unit: "stk" as const, unitPrice: 12500, supplier: "Teledyne", location: "Lager B-05" },
    { name: "Subsea-kontakt 24-pin", sku: "EL-SUB-24P", category: "Elektronikk", quantity: 8, minStock: 3, maxStock: 15, unit: "stk" as const, unitPrice: 32000, supplier: "Teledyne", location: "Lager B-05" },
    { name: "Propellblad reservesett", sku: "MEK-PRO-RES", category: "Mekanisk", quantity: 12, minStock: 4, maxStock: 20, unit: "stk" as const, unitPrice: 8500, supplier: "Brunvoll", location: "Lager D-03" },
    { name: "Skrogplate titan", sku: "MEK-SKR-TIT", category: "Mekanisk", quantity: 3, minStock: 1, maxStock: 6, unit: "stk" as const, unitPrice: 165000, supplier: "VSMPO-AVISMA", location: "Lager D-04" },
    { name: "Flotasjonskasse", sku: "MEK-FLO-KAS", category: "Mekanisk", quantity: 8, minStock: 2, maxStock: 12, unit: "stk" as const, unitPrice: 45000, supplier: "Trelleborg", location: "Lager D-05" },
    { name: "Gyrosensor IMU", sku: "EL-GYR-IMU", category: "Elektronikk", quantity: 4, minStock: 2, maxStock: 8, unit: "stk" as const, unitPrice: 68000, supplier: "iXblue", location: "Lager B-06" },
    { name: "Laser skanner undervanns", sku: "OPT-LAS-UND", category: "Optikk", quantity: 2, minStock: 1, maxStock: 4, unit: "stk" as const, unitPrice: 285000, supplier: "2G Robotics", location: "Lager C-03" },
    { name: "Akustisk modem", sku: "EL-AKU-MOD", category: "Elektronikk", quantity: 5, minStock: 2, maxStock: 10, unit: "stk" as const, unitPrice: 55000, supplier: "EvoLogics", location: "Lager B-07" },
    { name: "Batteripakke Li-Ion 48V", sku: "EL-BAT-48V", category: "Elektronikk", quantity: 6, minStock: 3, maxStock: 12, unit: "stk" as const, unitPrice: 92000, supplier: "Corvus Energy", location: "Lager B-08" },
    { name: "Griperverktøy subsea", sku: "MEK-GRI-SUB", category: "Mekanisk", quantity: 4, minStock: 2, maxStock: 8, unit: "stk" as const, unitPrice: 120000, supplier: "Schilling Robotics", location: "Lager D-06" },
  ];

  const insertedParts = [];
  for (const part of partsData) {
    const [p] = await db.insert(parts).values(part).returning();
    insertedParts.push(p);
  }
  console.log(`  ${insertedParts.length} deler opprettet`);

  // --- ROV System Parts (Bill of Materials) ---
  // Map part SKUs to IDs for easy reference
  const partMap = new Map(insertedParts.map((p) => [p.sku, p.id]));
  const rovMap = new Map(insertedRovs.map((r) => [r.name, r.id]));

  const bomData = [
    // Kystdesign Supporter
    { rov: "Kystdesign Supporter", sku: "HYD-SL-050", qty: 20, notes: "Primær hydraulikk" },
    { rov: "Kystdesign Supporter", sku: "HYD-PU-150", qty: 1, notes: "Hovedpumpe" },
    { rov: "Kystdesign Supporter", sku: "EL-TH-015", qty: 4, notes: "Horisontal fremdrift" },
    { rov: "Kystdesign Supporter", sku: "OPT-KAM-HD", qty: 2, notes: "For- og akterkamera" },
    { rov: "Kystdesign Supporter", sku: "OPT-LYS-500", qty: 4, notes: "Hovedbelysning" },
    { rov: "Kystdesign Supporter", sku: "MEK-MAN-5F", qty: 1, notes: "Arbeidsmanipulator" },
    { rov: "Kystdesign Supporter", sku: "KAB-TMS-1K", qty: 1, notes: "Standard TMS" },
    { rov: "Kystdesign Supporter", sku: "MEK-ORI-SET", qty: 2, notes: "Tetningssett" },
    { rov: "Kystdesign Supporter", sku: "HYD-FIL-001", qty: 2, notes: "Hydraulikkfilter" },
    { rov: "Kystdesign Supporter", sku: "EL-DYB-SEN", qty: 1, notes: "Dybdemåling" },
    // Oceaneering Millennium Plus
    { rov: "Oceaneering Millennium Plus", sku: "HYD-SL-075", qty: 25, notes: "Tung hydraulikk" },
    { rov: "Oceaneering Millennium Plus", sku: "HYD-PU-150", qty: 2, notes: "Doble pumper" },
    { rov: "Oceaneering Millennium Plus", sku: "EL-TH-025", qty: 4, notes: "Kraftige thrustere" },
    { rov: "Oceaneering Millennium Plus", sku: "OPT-KAM-4K", qty: 2, notes: "4K kamerasystem" },
    { rov: "Oceaneering Millennium Plus", sku: "OPT-LYS-500", qty: 6, notes: "Full belysning" },
    { rov: "Oceaneering Millennium Plus", sku: "MEK-MAN-7F", qty: 2, notes: "Doble 7-funksjons armer" },
    { rov: "Oceaneering Millennium Plus", sku: "KAB-TMS-2K", qty: 1, notes: "Lang TMS for dyp" },
    { rov: "Oceaneering Millennium Plus", sku: "MEK-ORI-SET", qty: 3, notes: "Tetningssett" },
    { rov: "Oceaneering Millennium Plus", sku: "HYD-FIL-001", qty: 4, notes: "Hydraulikkfilter" },
    { rov: "Oceaneering Millennium Plus", sku: "EL-GYR-IMU", qty: 1, notes: "Navigasjon" },
    { rov: "Oceaneering Millennium Plus", sku: "OPT-LAS-UND", qty: 1, notes: "3D-skanning" },
    { rov: "Oceaneering Millennium Plus", sku: "MEK-GRI-SUB", qty: 1, notes: "Griperverktøy" },
    // Saab Seaeye Cougar XT
    { rov: "Saab Seaeye Cougar XT", sku: "EL-TH-015", qty: 2, notes: "Kompakt fremdrift" },
    { rov: "Saab Seaeye Cougar XT", sku: "OPT-KAM-HD", qty: 1, notes: "Hovedkamera" },
    { rov: "Saab Seaeye Cougar XT", sku: "OPT-LYS-500", qty: 2, notes: "Belysning" },
    { rov: "Saab Seaeye Cougar XT", sku: "KAB-KTR-500", qty: 1, notes: "Kontrollkabel" },
    { rov: "Saab Seaeye Cougar XT", sku: "EL-DYB-SEN", qty: 1, notes: "Dybdemåling" },
    { rov: "Saab Seaeye Cougar XT", sku: "EL-SON-TRP", qty: 2, notes: "Navigasjon" },
    { rov: "Saab Seaeye Cougar XT", sku: "EL-BAT-48V", qty: 2, notes: "Batteridrift" },
    // Forum Comanche
    { rov: "Forum Comanche", sku: "HYD-SL-050", qty: 15, notes: "Hydraulikk" },
    { rov: "Forum Comanche", sku: "HYD-SL-075", qty: 10, notes: "Tung hydraulikk" },
    { rov: "Forum Comanche", sku: "HYD-PU-150", qty: 1, notes: "Hovedpumpe" },
    { rov: "Forum Comanche", sku: "EL-TH-025", qty: 4, notes: "Thrustere" },
    { rov: "Forum Comanche", sku: "OPT-KAM-HD", qty: 2, notes: "Kamerasystem" },
    { rov: "Forum Comanche", sku: "OPT-KAM-4K", qty: 1, notes: "4K inspeksjon" },
    { rov: "Forum Comanche", sku: "OPT-LYS-500", qty: 4, notes: "Belysning" },
    { rov: "Forum Comanche", sku: "MEK-MAN-5F", qty: 1, notes: "Arbeidsmanipulator" },
    { rov: "Forum Comanche", sku: "MEK-MAN-7F", qty: 1, notes: "Presisjonsmanipulator" },
    { rov: "Forum Comanche", sku: "KAB-TMS-1K", qty: 1, notes: "TMS" },
    { rov: "Forum Comanche", sku: "HYD-VEN-4V", qty: 2, notes: "Ventilblokker" },
    { rov: "Forum Comanche", sku: "EL-DYK-CTR", qty: 1, notes: "Kontrollpanel" },
  ];

  let bomCount = 0;
  for (const bom of bomData) {
    const rovId = rovMap.get(bom.rov);
    const partId = partMap.get(bom.sku);
    if (rovId && partId) {
      await db.insert(rovSystemParts).values({
        rovSystemId: rovId,
        partId,
        quantityRequired: bom.qty,
        notes: bom.notes,
      });
      bomCount++;
    }
  }
  console.log(`  ${bomCount} stykkliste-oppføringer opprettet`);

  // --- Procedures ---
  const procData = [
    // Kystdesign Supporter
    { name: "Mobilisering - Kystdesign Supporter", rovSystemId: rovMap.get("Kystdesign Supporter")!, category: "Mobilisering", content: "## Mobiliseringsprosedyre\n\n1. Visuell inspeksjon av ROV-ramme og skrog\n2. Kontroller alle hydraulikkslanger for lekkasje\n3. Test alle thrustere i luft (30 sek per thruster)\n4. Kalibrering av dybdesensor\n5. Funksjonstest kamera og lys\n6. Test manipulatorarm - alle 5 funksjoner\n7. Kontroller TMS-umbilical for skader\n8. Fylling av hydraulikkolje til markering\n9. Oppkobling til kontrollsystem\n10. Full systemtest på dekk", version: "2.1" },
    { name: "Vedlikehold 500-timer - Supporter", rovSystemId: rovMap.get("Kystdesign Supporter")!, category: "Vedlikehold", content: "## 500-timers vedlikehold\n\n1. Bytte hydraulikkfiltre (2 stk)\n2. Skifte hydraulikkolje\n3. Inspeksjon av alle O-ringer\n4. Smøring av manipulatorledd\n5. Kontroll av thruster-lager\n6. Kalibrering av sensorer\n7. Software-oppdatering ved behov\n8. Test av nødprosedyrer", version: "1.3" },
    { name: "Demobilisering - Supporter", rovSystemId: rovMap.get("Kystdesign Supporter")!, category: "Demobilisering", content: "## Demobiliseringsprosedyre\n\n1. Spyling med ferskvann\n2. Drenering av hydraulikksystem\n3. Sikring av manipulatorarm\n4. Frakobling av TMS\n5. Sikring for transport\n6. Utfylling av tilstandsrapport", version: "1.0" },
    // Oceaneering Millennium Plus
    { name: "Mobilisering - Millennium Plus", rovSystemId: rovMap.get("Oceaneering Millennium Plus")!, category: "Mobilisering", content: "## Mobiliseringsprosedyre - Tungklasse\n\n1. Kranløft og plassering på dekk\n2. Visuell inspeksjon av alle systemer\n3. Hydraulikk-oppstart og trykktest til 250bar\n4. Test av alle 4 thrustere under last\n5. Kalibrering av IMU/gyrosensor\n6. 4K kameratest og fokuskalibrering\n7. Laser-skanner funksjonstest\n8. Test av begge 7-funksjons manipulatorer\n9. TMS-test med full umbilical-utlegg\n10. Kommunikasjonstest med overflate\n11. Nødsystemtest\n12. Dokumentasjon og signoff", version: "3.0" },
    { name: "Vedlikehold 250-timer - Millennium", rovSystemId: rovMap.get("Oceaneering Millennium Plus")!, category: "Vedlikehold", content: "## 250-timers vedlikehold\n\n1. Bytte alle 4 hydraulikkfiltre\n2. Oljeanalyse og eventuelt skifte\n3. Inspeksjon av alle O-ringer og tetninger\n4. Grundig manipulator-inspeksjon\n5. Thruster-inspeksjon og lagersjekk\n6. IMU-kalibrering\n7. Laser-skanner kalibrering\n8. Elektrisk isolasjonstest\n9. Oppdatering av vedlikeholdslogg", version: "2.0" },
    { name: "Borebrønn-intervensjon - Millennium", rovSystemId: rovMap.get("Oceaneering Millennium Plus")!, category: "Operasjon", content: "## Prosedyre for borebrønn-intervensjon\n\n1. Pre-dykk sjekkliste\n2. Utsetting via LARS\n3. Navigasjon til brønnhode\n4. Visuell inspeksjon av brønnhode\n5. Tilkobling av intervensjonsverktøy\n6. Gjennomføring av operasjon\n7. Dokumentasjon med 4K video\n8. Frakobling og retrett\n9. Retur og ombordtaking", version: "1.5" },
    // Saab Seaeye Cougar XT
    { name: "Mobilisering - Cougar XT", rovSystemId: rovMap.get("Saab Seaeye Cougar XT")!, category: "Mobilisering", content: "## Mobiliseringsprosedyre - Observasjonsklasse\n\n1. Utpakking og visuell inspeksjon\n2. Batterilading (full lading: 8 timer)\n3. Test av elektriske thrustere\n4. Kameratest og lystest\n5. Sonar-transponder test\n6. Dybdesensor kalibrering\n7. Kontrollkabel-test (500m)\n8. Overflatekontroller-test\n9. Dokumentasjon", version: "1.2" },
    { name: "Inspeksjonsprosedyre - Cougar XT", rovSystemId: rovMap.get("Saab Seaeye Cougar XT")!, category: "Operasjon", content: "## Generell inspeksjonsprosedyre\n\n1. Planlegging av inspeksjonsrute\n2. Utsetting\n3. Systematisk visuell inspeksjon\n4. Video-dokumentasjon\n5. Sonar-logging\n6. Tilstandsvurdering\n7. Retur og ombordtaking\n8. Dataoverføring og rapportering", version: "1.0" },
    { name: "Batterivedlikehold - Cougar XT", rovSystemId: rovMap.get("Saab Seaeye Cougar XT")!, category: "Vedlikehold", content: "## Batterivedlikehold\n\n1. Visuell inspeksjon av batteripakker\n2. Spenningstest per celle\n3. Kapasitetstest (full syklus)\n4. Kontroll av kjølesystem\n5. Rengjøring av kontakter\n6. Oppdatering av batterilogg", version: "1.1" },
    // Forum Comanche
    { name: "Mobilisering - Forum Comanche", rovSystemId: rovMap.get("Forum Comanche")!, category: "Mobilisering", content: "## Mobiliseringsprosedyre\n\n1. Kranløft fra container\n2. Visuell inspeksjon\n3. Hydraulikksystem oppstart\n4. Test av alle thrustere\n5. Kamera- og lystest (HD + 4K)\n6. Test av 5-funksjons manipulator\n7. Test av 7-funksjons manipulator\n8. TMS-test\n9. Kontrollpanel-test\n10. Full systemtest\n11. Dokumentasjon", version: "2.0" },
    { name: "Pipeline-inspeksjon - Comanche", rovSystemId: rovMap.get("Forum Comanche")!, category: "Operasjon", content: "## Pipeline-inspeksjonsprosedyre\n\n1. Mottakelse av inspeksjonsplan\n2. Programmering av rute\n3. Utsetting og navigasjon til startpunkt\n4. Systematisk pipeline-følging\n5. Anode-inspeksjon og logging\n6. Frispenn-dokumentasjon\n7. Korrosjonsvurdering\n8. CP-måling ved utvalgte punkter\n9. Rapportering", version: "1.8" },
    { name: "Vedlikehold 500-timer - Comanche", rovSystemId: rovMap.get("Forum Comanche")!, category: "Vedlikehold", content: "## 500-timers vedlikehold\n\n1. Bytte hydraulikkfiltre\n2. Kontroll av ventilblokker\n3. Inspeksjon av alle O-ringer\n4. Smøring og vedlikehold av manipulatorer\n5. Thruster-inspeksjon\n6. Elektrisk systemsjekk\n7. Kontrollpanel-kalibrering\n8. Software-oppdatering", version: "1.5" },
  ];

  let procCount = 0;
  for (const proc of procData) {
    await db.insert(procedures).values(proc);
    procCount++;
  }
  console.log(`  ${procCount} prosedyrer opprettet`);

  // --- Drawings ---
  const drawingData = [
    { name: "GA-tegning Supporter MK2", rovSystemId: rovMap.get("Kystdesign Supporter")!, fileUrl: "/drawings/supporter-ga.pdf", fileType: "pdf" as const, description: "General arrangement tegning", version: "Rev C" },
    { name: "Hydraulikkskjema Supporter", rovSystemId: rovMap.get("Kystdesign Supporter")!, fileUrl: "/drawings/supporter-hydraulikk.pdf", fileType: "pdf" as const, description: "Hydraulikksystem P&ID", version: "Rev B" },
    { name: "Elektrisk skjema Supporter", rovSystemId: rovMap.get("Kystdesign Supporter")!, fileUrl: "/drawings/supporter-elektrisk.pdf", fileType: "pdf" as const, description: "Elektrisk enlinjeskjema", version: "Rev A" },
    { name: "GA-tegning Millennium Plus", rovSystemId: rovMap.get("Oceaneering Millennium Plus")!, fileUrl: "/drawings/millennium-ga.pdf", fileType: "pdf" as const, description: "General arrangement tegning", version: "Rev D" },
    { name: "Hydraulikkskjema Millennium", rovSystemId: rovMap.get("Oceaneering Millennium Plus")!, fileUrl: "/drawings/millennium-hydraulikk.pdf", fileType: "pdf" as const, description: "Hydraulikksystem P&ID", version: "Rev C" },
    { name: "TMS-tegning Millennium", rovSystemId: rovMap.get("Oceaneering Millennium Plus")!, fileUrl: "/drawings/millennium-tms.dwg", fileType: "dwg" as const, description: "TMS og umbilical arrangement", version: "Rev B" },
    { name: "GA-tegning Cougar XT", rovSystemId: rovMap.get("Saab Seaeye Cougar XT")!, fileUrl: "/drawings/cougar-ga.pdf", fileType: "pdf" as const, description: "General arrangement tegning", version: "Rev B" },
    { name: "Batteriplan Cougar XT", rovSystemId: rovMap.get("Saab Seaeye Cougar XT")!, fileUrl: "/drawings/cougar-batteri.pdf", fileType: "pdf" as const, description: "Batterisystem layout", version: "Rev A" },
    { name: "GA-tegning Comanche 3000", rovSystemId: rovMap.get("Forum Comanche")!, fileUrl: "/drawings/comanche-ga.pdf", fileType: "pdf" as const, description: "General arrangement tegning", version: "Rev C" },
    { name: "Hydraulikkskjema Comanche", rovSystemId: rovMap.get("Forum Comanche")!, fileUrl: "/drawings/comanche-hydraulikk.pdf", fileType: "pdf" as const, description: "Hydraulikksystem P&ID", version: "Rev B" },
    { name: "Manipulator-tegning Comanche", rovSystemId: rovMap.get("Forum Comanche")!, fileUrl: "/drawings/comanche-manipulator.pdf", fileType: "pdf" as const, description: "Manipulatorarm arrangement", version: "Rev A" },
  ];

  let drawCount = 0;
  for (const draw of drawingData) {
    await db.insert(drawings).values(draw);
    drawCount++;
  }
  console.log(`  ${drawCount} tegninger opprettet`);

  // --- Projects ---
  const projectData = [
    { name: "Gullfaks C - Hydraulikkmodul", client: "Equinor", location: "Gullfaks C", status: "planning" as const, priority: "high" as const, assignedTo: "Kari Nordmann", startDate: "2026-04-15", dueDate: "2026-05-20", description: "Bygging og testing av hydraulikkmodul for Gullfaks C subsea-intervensjon" },
    { name: "Johan Sverdrup B - Topside-panel", client: "Equinor", location: "Johan Sverdrup B", rovSystemId: rovMap.get("Oceaneering Millennium Plus"), status: "workshop" as const, priority: "critical" as const, assignedTo: "Ola Hansen", startDate: "2026-04-01", dueDate: "2026-04-25", description: "Modifikasjon av topside kontrollpanel for Millennium Plus ROV" },
    { name: "Statfjord A - BOP-panel", client: "Equinor", location: "Statfjord A", rovSystemId: rovMap.get("Forum Comanche"), status: "offshore" as const, priority: "high" as const, assignedTo: "Erik Johansen", startDate: "2026-03-15", dueDate: "2026-04-20", description: "BOP panel-rigg for subsea-operasjon med Forum Comanche" },
    { name: "Heidrun TLP - Subsea-panel", client: "Equinor", location: "Heidrun TLP", rovSystemId: rovMap.get("Kystdesign Supporter"), status: "invoicing" as const, priority: "medium" as const, assignedTo: "Anna Berg", startDate: "2026-02-10", dueDate: "2026-03-30", description: "Ferdigstilt subsea-panel for Heidrun TLP inspeksjonsoppdrag" },
    { name: "Troll A - Pipeline-inspeksjon", client: "Equinor", location: "Troll A", rovSystemId: rovMap.get("Saab Seaeye Cougar XT"), status: "completed" as const, priority: "medium" as const, assignedTo: "Per Olsen", startDate: "2026-01-15", dueDate: "2026-02-28", completedAt: "2026-02-25", description: "Pipeline-inspeksjon med Cougar XT observasjons-ROV" },
    { name: "Åsgard B - ROV vedlikehold", client: "Equinor", location: "Åsgard B", status: "standby" as const, priority: "low" as const, assignedTo: "Kari Nordmann", startDate: "2026-05-01", dueDate: "2026-06-15", description: "Planlagt vedlikeholdsoppdrag, venter på tilgjengelig ROV" },
  ];

  const insertedProjects = [];
  for (const proj of projectData) {
    const [p] = await db.insert(projects).values(proj).returning();
    insertedProjects.push(p);
  }
  console.log(`  ${insertedProjects.length} prosjekter opprettet`);

  // --- Todos ---
  const todoData = [
    { title: "Bestille hydraulikkslanger for Gullfaks C", projectId: insertedProjects[0].id, assignedTo: "Kari Nordmann", priority: "high" as const, status: "pending" as const, dueDate: "2026-04-18" },
    { title: "Kvalitetskontroll av topside-panel", projectId: insertedProjects[1].id, assignedTo: "Ola Hansen", priority: "high" as const, status: "in_progress" as const, dueDate: "2026-04-20" },
    { title: "Klargjøre verktøysett for offshore", projectId: insertedProjects[2].id, assignedTo: "Erik Johansen", priority: "high" as const, status: "completed" as const, dueDate: "2026-04-10", completedAt: "2026-04-09" },
    { title: "Oppdatere vedlikeholdslogg for Supporter", assignedTo: "Anna Berg", priority: "medium" as const, status: "pending" as const, dueDate: "2026-04-25" },
    { title: "Sende faktura for Heidrun-prosjektet", projectId: insertedProjects[3].id, assignedTo: "Anna Berg", priority: "medium" as const, status: "pending" as const, dueDate: "2026-04-15" },
    { title: "Bestille nye O-ring sett", assignedTo: "Per Olsen", priority: "medium" as const, status: "pending" as const, dueDate: "2026-04-30" },
    { title: "Kalibrere IMU-sensor for Millennium", projectId: insertedProjects[1].id, assignedTo: "Ola Hansen", priority: "high" as const, status: "in_progress" as const, dueDate: "2026-04-18" },
    { title: "Ferdigstille testrapport Troll A", projectId: insertedProjects[4].id, assignedTo: "Per Olsen", priority: "low" as const, status: "completed" as const, dueDate: "2026-03-05", completedAt: "2026-03-03" },
    { title: "Planlegge mobilisering for Åsgard B", projectId: insertedProjects[5].id, assignedTo: "Kari Nordmann", priority: "low" as const, status: "pending" as const, dueDate: "2026-04-28" },
    { title: "Gjennomgang av nye prosedyrer med verkstedet", assignedTo: "Erik Johansen", priority: "medium" as const, status: "pending" as const, dueDate: "2026-04-22" },
    { title: "Oppdatere tegninger etter modifikasjon", projectId: insertedProjects[1].id, assignedTo: "Ola Hansen", priority: "high" as const, status: "pending" as const, dueDate: "2026-04-19" },
    { title: "Lagertellings for Q2", assignedTo: "Per Olsen", priority: "medium" as const, status: "pending" as const, dueDate: "2026-05-01" },
    { title: "Koordinere med Equinor for Gullfaks-oppdraget", projectId: insertedProjects[0].id, assignedTo: "Kari Nordmann", priority: "high" as const, status: "in_progress" as const, dueDate: "2026-04-16" },
    { title: "Sjekke tilgjengelighet av Cougar XT", assignedTo: "Anna Berg", priority: "low" as const, status: "pending" as const, dueDate: "2026-04-30" },
    { title: "Klargjøre dokumentasjon for offshore-team", projectId: insertedProjects[2].id, assignedTo: "Erik Johansen", priority: "high" as const, status: "completed" as const, dueDate: "2026-04-08", completedAt: "2026-04-07" },
  ];

  let todoCount = 0;
  for (const todo of todoData) {
    await db.insert(todos).values(todo);
    todoCount++;
  }
  console.log(`  ${todoCount} gjøremål opprettet`);

  // --- Workshop Logs ---
  const workshopLogData = [
    { projectId: insertedProjects[1].id, message: "Prosjekt mottatt på verkstedet. Starter gjennomgang av tegninger og prosedyrer.", logType: "started" as const, createdBy: "Verksted-Tor" },
    { projectId: insertedProjects[1].id, message: "Topside-panel demontert. Identifisert 3 komponenter som må byttes.", logType: "progress" as const, createdBy: "Verksted-Tor" },
    { projectId: insertedProjects[1].id, message: "Nye komponenter installert. Venter på IMU-kalibrering før test.", logType: "progress" as const, createdBy: "Verksted-Tor" },
    { projectId: insertedProjects[2].id, message: "BOP-panel ferdig bygget og testet. Klar for offshore-mobilisering.", logType: "completed" as const, createdBy: "Verksted-Lars" },
    { projectId: insertedProjects[3].id, message: "Subsea-panel ferdigstilt. Alle tester bestått.", logType: "completed" as const, createdBy: "Verksted-Tor" },
  ];

  let logCount = 0;
  for (const log of workshopLogData) {
    await db.insert(workshopLogs).values(log);
    logCount++;
  }
  console.log(`  ${logCount} verkstedlogger opprettet`);

  console.log("\nSeeding fullført!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed feilet:", err);
    process.exit(1);
  });
