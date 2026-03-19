import type { ProjectStatus } from "./types";

export const STATUSES: { id: ProjectStatus; label: string; color: string }[] = [
  { id: "planning", label: "Planning", color: "#6B7280" },
  { id: "workshop", label: "Workshop", color: "#3B82F6" },
  { id: "offshore", label: "Offshore", color: "#F59E0B" },
  { id: "invoicing", label: "Invoicing", color: "#8B5CF6" },
  { id: "finished", label: "Finished", color: "#10B981" },
];

export const COMPLETED_STATUSES: ProjectStatus[] = ["finished"];

export const ANALYSE_PRESETS: Record<
  string,
  { label: string; prompt: string }
> = {
  inquiry: {
    label: "Inquiry Checklist",
    prompt: `Analyser denne PDF-en (brønnprogram / well program) og trekk ut all informasjon som trengs for å fylle ut Halliburton Customer Inquiry Checklist (FO-SCA-HAL-ST-102).

Returner et JSON-objekt med følgende struktur:
{
  "general": {
    "date": "", "customer": "", "customer_rep": "", "email": "",
    "field_block": "", "project_name": "", "well_number": "",
    "mobilisation_base": "", "lease_parish_county": "",
    "exp_mob_date": "", "rig_name_type": ""
  },
  "application_comments": "",
  "riser_casing": [
    {"size_in": "", "weight": "", "connection": "", "grade": "", "top_depth": "", "bottom_depth": "", "nominal_id": ""}
  ],
  "drill_pipe": [
    {"size_in": "", "weight": "", "grade": "", "conn_type": ""}
  ],
  "well_info": {
    "well_fluid_type_sg": "", "minimum_id_in_well": "",
    "collapsed_casing": "", "sharp_internal_upset": "",
    "negative_test_required": ""
  },
  "rig_info": {
    "max_assembly_length": "", "max_basket_length": "",
    "handling_limitations": ""
  },
  "setting_info": {
    "setting_depth_md": "", "setting_depth_tvd": "",
    "deviation_at_setting_depth": "", "temperature_at_setting_depth": "",
    "test_pressure_bar_psi": "", "v0_rating_required": "",
    "permanent_or_temporary": "", "will_packer_be_drilled_out": "",
    "cement_on_top_or_squeezed": "", "scraper_cleanup_run_prior": ""
  },
  "other_information": ""
}

VIKTIG: Fyll inn alle verdier du finner. Sett til null hvis ikke funnet. Returner KUN JSON.`,
  },
  eowr: {
    label: "EOWR",
    prompt: `Based on the uploaded PDF, write a professional End of Well Report (EOWR) in English. Describe each assembly run chronologically with equipment, depths, circulation parameters, packer setting, pressure tests, and inspection findings. Use technical oilfield terminology. Write ONLY the report text.`,
  },
  casing: {
    label: "Casing & Tubing",
    prompt: `Analyser denne PDF-en og trekk ut all informasjon om casing og tubing. For hver streng, finn: Størrelse (OD), Vekt (lbs/ft), Grade, Connection, Setting depth (MD/TVD), Topp/bunn dybde. Returner som JSON-array. Sett null for manglende verdier. Returner KUN JSON.`,
  },
  dp: {
    label: "Drill Pipe",
    prompt: `Analyser denne PDF-en og trekk ut all informasjon om drill pipe. For hver komponent, finn: Størrelse (OD), Vekt (lbs/ft), Grade, Connection/tool joint, ID, Range. Returner som JSON-array. Sett null for manglende verdier. Returner KUN JSON.`,
  },
  custom: {
    label: "Egendefinert",
    prompt: "",
  },
};
