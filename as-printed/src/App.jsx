import React, { useState, useRef } from "react";

/* ------------------------------------------------------------------ *
 *  As Printed — decodes Spanish medical documents word by word.
 *  It translates, expands abbreviations and restates dosing.
 *  It never says what a result means.
 * ------------------------------------------------------------------ */

// The system prompt lives in shared/prompt.js and is injected by api/decode.js on every
// request, whichever provider is chosen, so the browser never sees or edits it.

const PROVIDERS = [
  { id: "glimmer", name: "Muse Glimmer", note: "Free on this site. Reads pasted text.", model: "Meta Muse Glimmer 30B", byok: false },
  { id: "anthropic", name: "Anthropic", note: "Your key. Reads photos and PDFs too.", model: "claude-sonnet-5", byok: true },
  { id: "openai", name: "OpenAI", note: "Your key. Reads photos and PDFs too.", model: "gpt-5-mini", byok: true },
  { id: "gemini", name: "Gemini", note: "Your key. Reads photos and PDFs too.", model: "gemini-2.5-flash", byok: true }
];

// Vercel caps a function request body at 4.5 MB and base64 adds about a third.
const MAX_FILE_BYTES = 3 * 1024 * 1024;

const EXAMPLES = [
  {
    id: "analitica",
    label: "Blood panel",
    blurb: "A routine analítica from a Spanish health centre",
    source: `HOSPITAL COMARCAL — SERVICIO DE ANÁLISIS CLÍNICOS
Paciente: [nombre]   NHC: 0084412   Fecha: 14/03/2026

HEMOGRAMA
Hematíes            4,62 x10^12/L      (4,20 - 5,40)
Hemoglobina         11,8 g/dL          (12,0 - 16,0)   *
Hematocrito         36,4 %             (36,0 - 46,0)
VCM                 84,1 fL            (80,0 - 99,0)
Leucocitos          6,90 x10^9/L       (4,00 - 11,00)
Plaquetas           268 x10^9/L        (150 - 400)
VSG                 18 mm/h            (0 - 20)

BIOQUÍMICA
Glucosa basal       94 mg/dL           (70 - 100)
Ferritina           11 ng/mL           (13 - 150)      *
TSH                 2,31 µUI/mL        (0,40 - 4,00)`,
    result: {
      doc: "Lab report",
      lang: "Spanish",
      removed: ["patient name", "hospital record number"],
      lines: [
        { es: "Hematíes", en: "Red blood cells", exp: "", val: "4,62 (4.62)", unit: "trillions per litre", ref: "4,20 - 5,40", flag: "none" },
        { es: "Hemoglobina", en: "Haemoglobin", exp: "", val: "11,8 (11.8)", unit: "grams per decilitre", ref: "12,0 - 16,0", flag: "marked" },
        { es: "Hematocrito", en: "Haematocrit", exp: "", val: "36,4 (36.4)", unit: "per cent", ref: "36,0 - 46,0", flag: "none" },
        { es: "VCM", en: "Mean corpuscular volume", exp: "Volumen Corpuscular Medio", val: "84,1 (84.1)", unit: "femtolitres", ref: "80,0 - 99,0", flag: "none" },
        { es: "Leucocitos", en: "White blood cells", exp: "", val: "6,90 (6.90)", unit: "billions per litre", ref: "4,00 - 11,00", flag: "none" },
        { es: "Plaquetas", en: "Platelets", exp: "", val: "268", unit: "billions per litre", ref: "150 - 400", flag: "none" },
        { es: "VSG", en: "Erythrocyte sedimentation rate", exp: "Velocidad de Sedimentación Globular", val: "18", unit: "millimetres per hour", ref: "0 - 20", flag: "none" },
        { es: "Glucosa basal", en: "Fasting glucose", exp: "", val: "94", unit: "milligrams per decilitre", ref: "70 - 100", flag: "none" },
        { es: "Ferritina", en: "Ferritin", exp: "", val: "11", unit: "nanograms per millilitre", ref: "13 - 150", flag: "marked" },
        { es: "TSH", en: "Thyroid stimulating hormone", exp: "Tirotropina", val: "2,31 (2.31)", unit: "micro international units per millilitre", ref: "0,40 - 4,00", flag: "none" }
      ],
      meds: [],
      terms: [
        { t: "Hemograma", d: "The section of a report covering the cells in blood: red cells, white cells and platelets." },
        { t: "Ferritina", d: "A protein that stores iron. Laboratories measure it as an indicator of the body's iron stores." },
        { t: "VSG", d: "How quickly red cells settle in a tube over one hour. It is used as a general marker of inflammation." },
        { t: "Basal", d: "Measured while fasting, usually first thing in the morning before eating." }
      ],
      unclear: ["The comma in Spanish reports is a decimal point. 11,8 means 11.8, not 118."],
      questions: [
        { en: "Two values carry an asterisk on this report. What does that mark mean here?", es: "Dos valores llevan un asterisco en este informe. ¿Qué significa esa marca aquí?" },
        { en: "Do these results change anything about my current treatment?", es: "¿Estos resultados cambian algo de mi tratamiento actual?" },
        { en: "Do I need to repeat this analysis, and when?", es: "¿Tengo que repetir esta analítica, y cuándo?" }
      ]
    }
  },
  {
    id: "receta",
    label: "Prescription",
    blurb: "A receta electrónica printout from a pharmacy",
    source: `RECETA ELECTRÓNICA — SERVICIO ANDALUZ DE SALUD
Paciente: [nombre]   Tarjeta sanitaria: AN000000
Prescriptor: [médico]   Fecha: 02/04/2026

1) AMOXICILINA/ÁC. CLAVULÁNICO 875/125 mg comprimidos
   Pauta: 1 comprimido cada 8 horas
   Duración: 7 días
   Observaciones: tomar con alimentos

2) OMEPRAZOL 20 mg cápsulas
   Pauta: 1 cápsula al día en ayunas
   Duración: 1 mes

3) IBUPROFENO 600 mg comprimidos
   Pauta: 1 comprimido cada 8 horas si dolor
   Duración: 5 días
   Observaciones: no superar 3 comprimidos al día`,
    result: {
      doc: "Prescription",
      lang: "Spanish",
      removed: ["patient name", "health card number", "prescriber name"],
      lines: [],
      meds: [
        { name: "Amoxicilina/ác. clavulánico 875/125 mg", ingredient: "Amoxicillin with clavulanic acid", form: "Tablet (comprimido)", pauta_es: "1 comprimido cada 8 horas", pauta_en: "One tablet every 8 hours", dur: "7 days", label: "Take with food (tomar con alimentos)" },
        { name: "Omeprazol 20 mg", ingredient: "Omeprazole", form: "Capsule (cápsula)", pauta_es: "1 cápsula al día en ayunas", pauta_en: "One capsule a day on an empty stomach", dur: "1 month", label: "" },
        { name: "Ibuprofeno 600 mg", ingredient: "Ibuprofen", form: "Tablet (comprimido)", pauta_es: "1 comprimido cada 8 horas si dolor", pauta_en: "One tablet every 8 hours if in pain", dur: "5 days", label: "Do not exceed 3 tablets a day (no superar 3 comprimidos al día)" }
      ],
      terms: [
        { t: "Pauta", d: "The dosing schedule: how much to take and how often." },
        { t: "En ayunas", d: "On an empty stomach, before eating." },
        { t: "Si dolor", d: "Printed on prescriptions to mean the medicine is taken when the symptom is present rather than on a fixed schedule." },
        { t: "Receta electrónica", d: "In Spain the prescription is held electronically against your health card. The pharmacy reads it from the card rather than from a paper slip." },
        { t: "Comprimido / cápsula", d: "Comprimido is a pressed tablet. Cápsula is a shell containing the medicine." }
      ],
      unclear: [],
      questions: [
        { en: "Should the ibuprofen be taken at the same time as the other two?", es: "¿Debo tomar el ibuprofeno a la vez que los otros dos?" },
        { en: "What should I do if I miss a dose?", es: "¿Qué hago si me salto una dosis?" },
        { en: "Is the omeprazol for the whole month or only while I take the antibiotic?", es: "¿El omeprazol es para todo el mes o solo mientras tomo el antibiótico?" }
      ]
    }
  },
  {
    id: "urgencias",
    label: "A&E letter",
    blurb: "An informe de urgencias handed over on discharge",
    source: `INFORME DE ALTA DE URGENCIAS
Paciente: [nombre]   Fecha: 21/05/2026   Hora de alta: 23:40

MOTIVO DE CONSULTA: dolor abdominal de 12 horas de evolución.
EXPLORACIÓN: consciente y orientada, afebril. TA 128/76. FC 82 lpm.
Abdomen blando, depresible, sin signos de irritación peritoneal.
PRUEBAS COMPLEMENTARIAS: analítica sin hallazgos reseñables.
Ecografía abdominal sin alteraciones.
JUICIO CLÍNICO: dolor abdominal inespecífico.
TRATAMIENTO: se pauta tratamiento sintomático.
RECOMENDACIONES: dieta blanda 48 h. Acudir a su médico de atención
primaria en 48-72 h si no hay mejoría. Volver a urgencias si fiebre,
vómitos persistentes o empeoramiento del dolor.`,
    result: {
      doc: "Discharge summary",
      lang: "Spanish",
      removed: ["patient name"],
      lines: [
        { es: "Motivo de consulta", en: "Reason for the visit", exp: "", val: "Abdominal pain, 12 hours since it started", unit: "", ref: "", flag: "none" },
        { es: "Afebril", en: "No fever recorded", exp: "", val: "", unit: "", ref: "", flag: "none" },
        { es: "TA 128/76", en: "Blood pressure 128 over 76", exp: "Tensión Arterial", val: "128/76", unit: "millimetres of mercury", ref: "", flag: "none" },
        { es: "FC 82 lpm", en: "Heart rate 82 beats per minute", exp: "Frecuencia Cardíaca, latidos por minuto", val: "82", unit: "beats per minute", ref: "", flag: "none" },
        { es: "Pruebas complementarias", en: "Additional tests", exp: "", val: "Blood test and abdominal ultrasound, both recorded as showing nothing notable", unit: "", ref: "", flag: "none" },
        { es: "Juicio clínico", en: "Clinical conclusion recorded by the doctor", exp: "", val: "Non-specific abdominal pain", unit: "", ref: "", flag: "none" },
        { es: "Tratamiento", en: "Treatment given", exp: "", val: "Symptomatic treatment was prescribed", unit: "", ref: "", flag: "none" },
        { es: "Recomendaciones", en: "Instructions on the letter", exp: "", val: "Soft diet for 48 hours. Go to your primary care doctor in 48 to 72 hours if there is no improvement. Return to A&E if fever, persistent vomiting or the pain gets worse.", unit: "", ref: "", flag: "none" }
      ],
      meds: [],
      terms: [
        { t: "Urgencias", d: "The emergency department." },
        { t: "Médico de atención primaria", d: "Your assigned local doctor at a health centre, the usual first point of contact in the Spanish public system." },
        { t: "Juicio clínico", d: "The heading a Spanish report uses for the conclusion the treating doctor recorded at that visit." },
        { t: "Tratamiento sintomático", d: "Treatment aimed at the symptoms rather than at a named cause." },
        { t: "Sin hallazgos reseñables", d: "A standard phrase meaning nothing notable was recorded in that test." }
      ],
      unclear: ["The letter says symptomatic treatment was prescribed but does not print which medicine or dose."],
      questions: [
        { en: "Which medicine was prescribed as symptomatic treatment, and at what dose?", es: "¿Qué medicamento se me ha pautado como tratamiento sintomático y a qué dosis?" },
        { en: "Does a soft diet mean anything specific I should avoid?", es: "¿La dieta blanda significa que debo evitar algo en concreto?" },
        { en: "Do I need to book the primary care appointment now or wait 48 hours?", es: "¿Pido cita con atención primaria ahora o espero 48 horas?" }
      ]
    }
  }
];

const SECTIONS = [
  { id: "read", label: "Read a document", desc: "Paste or upload a document and see it decoded line by line" },
  { id: "examples", label: "Worked examples", desc: "Three document types with results already saved" },
  { id: "rules", label: "What it will not do", desc: "The rules it follows, and where the line sits" },
  { id: "data", label: "Your data", desc: "Where the text goes and what gets stripped out" }
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
.ap { --ink:#0C2430; --p900:#0A3F52; --p700:#0E5C77; --p600:#12718F; --p300:#8CC6D9;
      --p100:#D7EAF2; --p050:#EFF7FA; --page:#F4F8FA; --card:#FFFFFF; --line:#DEE8ED;
      --muted:#4F6874; --amber:#B4690E; --green:#17835A; --red:#C0342B;
      font-family:'Outfit',ui-sans-serif,system-ui,sans-serif; color:var(--ink);
      background:var(--page); display:flex; height:100vh; max-height:100vh; overflow:hidden; }
.ap *{box-sizing:border-box;}
.ap-side{width:262px;flex:0 0 262px;height:100%;overflow-y:auto;background:var(--p900);color:#fff;padding:26px 20px;display:flex;flex-direction:column;gap:26px;}
.ap-brand{font-size:26px;font-weight:700;letter-spacing:-0.02em;line-height:1.1;}
.ap-brand span{display:block;font-size:13px;font-weight:400;color:var(--p300);margin-top:6px;letter-spacing:0;}
.ap-nav{display:flex;flex-direction:column;gap:6px;}
.ap-navbtn{text-align:left;background:transparent;border:0;border-radius:14px;padding:11px 13px;color:#fff;cursor:pointer;font-family:inherit;}
.ap-navbtn:hover{background:rgba(255,255,255,0.08);}
.ap-navbtn.on{background:var(--p600);}
.ap-navbtn b{display:block;font-size:14.5px;font-weight:600;}
.ap-navbtn small{display:block;font-size:11.5px;color:var(--p300);margin-top:3px;line-height:1.35;}
.ap-navbtn.on small{color:#D9DFFA;}
.ap-foot{font-size:11.5px;color:var(--p300);line-height:1.5;}
.ap-keybox{margin-top:auto;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.14);border-radius:16px;padding:14px;}
.ap-keybox h4{margin:0 0 6px;font-size:13.5px;font-weight:600;}
.ap-keybox p{margin:0 0 10px;font-size:11.5px;line-height:1.5;color:var(--p300);}
.ap-keyin{width:100%;border:1px solid rgba(255,255,255,0.22);background:rgba(0,0,0,0.22);color:#fff;border-radius:10px;padding:9px 11px;font-family:inherit;font-size:12.5px;}
.ap-keyin::placeholder{color:rgba(255,255,255,0.45);}
.ap-keyin:focus{outline:2px solid var(--p300);outline-offset:1px;}
.ap-keybtn{width:100%;margin-top:8px;border:0;border-radius:999px;padding:9px 14px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;background:var(--p600);color:#fff;}
.ap-keybtn.alt{background:transparent;border:1px solid rgba(255,255,255,0.28);}
.ap-keystat{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--p300);margin-top:10px;}
.ap-provs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;}
.ap-prov{border:1px solid rgba(255,255,255,0.22);background:transparent;color:#fff;border-radius:999px;padding:7px 8px;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer;}
.ap-prov:hover{background:rgba(255,255,255,0.08);}
.ap-prov.on{background:var(--p600);border-color:var(--p600);font-weight:600;}
.ap-prov:focus-visible{outline:2px solid var(--p300);outline-offset:1px;}
.ap-keybox p.ap-provnote{margin:0 0 10px;font-size:11.5px;color:var(--p300);}
.ap-dot{width:8px;height:8px;border-radius:50%;background:var(--p300);flex:0 0 auto;}
.ap-dot.on{background:var(--green);}
.ap-main{flex:1;overflow-y:auto;padding:34px 38px 60px;}
.ap-wrap{max-width:760px;}
.ap-h1{font-size:29px;font-weight:700;letter-spacing:-0.02em;margin:0 0 8px;}
.ap-lede{font-size:15.5px;color:var(--muted);line-height:1.6;margin:0 0 24px;max-width:64ch;}
.ap-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px;box-shadow:0 2px 10px rgba(17,22,52,0.05);margin-bottom:18px;}
.ap-card h3{margin:0 0 10px;font-size:17px;font-weight:600;}
.ap-card p{margin:0 0 10px;font-size:14.5px;line-height:1.6;color:var(--muted);}
.ap-note{background:var(--p050);border:1px solid var(--p100);border-radius:18px;padding:18px 20px;margin-bottom:20px;}
.ap-note h3{margin:0 0 8px;font-size:16px;font-weight:600;color:var(--p700);}
.ap-note p{margin:0;font-size:14px;line-height:1.6;color:var(--p900);}
.ap-ta{width:100%;min-height:180px;border:1px solid var(--line);border-radius:16px;padding:15px;font-family:inherit;font-size:14px;line-height:1.6;resize:vertical;background:#fff;color:var(--ink);}
.ap-ta:focus{outline:2px solid var(--p600);outline-offset:1px;}
.ap-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:14px;}
.ap-btn{border:0;border-radius:999px;padding:11px 22px;font-family:inherit;font-size:14.5px;font-weight:600;cursor:pointer;background:var(--p600);color:#fff;}
.ap-btn:hover{background:var(--p700);}
.ap-btn:disabled{background:var(--p300);cursor:not-allowed;}
.ap-ghost{background:#fff;color:var(--p700);border:1px solid var(--p100);}
.ap-ghost:hover{background:var(--p050);}
.ap-chip{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 16px;font-family:inherit;font-size:13.5px;cursor:pointer;color:var(--ink);}
.ap-chip.on{background:var(--p600);color:#fff;border-color:var(--p600);}
.ap-file{font-size:13px;color:var(--muted);}
.ap-tbl{width:100%;border-collapse:collapse;font-size:13.5px;}
.ap-tbl th{text-align:left;font-weight:600;font-size:12.5px;color:var(--muted);padding:0 10px 8px 0;border-bottom:1px solid var(--line);}
.ap-tbl td{padding:11px 10px 11px 0;border-bottom:1px solid var(--line);vertical-align:top;line-height:1.5;}
.ap-es{font-weight:600;}
.ap-exp{display:block;color:var(--muted);font-size:12.5px;margin-top:2px;}
.ap-mark{display:inline-block;background:#FCF1E1;color:var(--amber);border-radius:999px;padding:3px 10px;font-size:11.5px;font-weight:600;white-space:nowrap;}
.ap-med{border:1px solid var(--line);border-radius:16px;padding:16px;margin-bottom:12px;}
.ap-med h4{margin:0 0 4px;font-size:15.5px;font-weight:600;}
.ap-med dl{display:grid;grid-template-columns:130px 1fr;gap:6px 12px;margin:10px 0 0;font-size:13.5px;}
.ap-med dt{color:var(--muted);}
.ap-med dd{margin:0;}
.ap-term{padding:11px 0;border-bottom:1px solid var(--line);font-size:14px;line-height:1.55;}
.ap-term:last-child{border-bottom:0;}
.ap-term b{font-weight:600;}
.ap-q{padding:12px 0;border-bottom:1px solid var(--line);font-size:14px;line-height:1.55;}
.ap-q:last-child{border-bottom:0;}
.ap-q i{display:block;font-style:normal;color:var(--muted);margin-top:3px;}
.ap-warn{background:#FDF3EA;border:1px solid #F2DFC7;color:#7A4708;border-radius:16px;padding:14px 16px;font-size:13.5px;line-height:1.55;margin-bottom:16px;}
.ap-err{background:#FCEDEC;border:1px solid #F3D3D0;color:var(--red);border-radius:16px;padding:14px 16px;font-size:13.5px;margin-bottom:16px;}
.ap-src{white-space:pre-wrap;font-family:inherit;font-size:12.5px;line-height:1.6;background:var(--p050);border:1px solid var(--p100);border-radius:16px;padding:16px;color:var(--p900);max-height:260px;overflow:auto;}
.ap-list{margin:0;padding-left:18px;font-size:14.5px;line-height:1.7;color:var(--muted);}
.ap-list li{margin-bottom:7px;}
.ap-list b{color:var(--ink);font-weight:600;}
.ap-sec-h{font-size:13px;font-weight:600;color:var(--muted);margin:26px 0 10px;}
@media (max-width:760px){
 .ap{flex-direction:column;height:100vh;max-height:100vh;}
 .ap-side{width:100%;flex:0 0 auto;height:auto;overflow:visible;padding:18px 16px;gap:16px;}
 .ap-nav{flex-direction:row;overflow-x:auto;gap:8px;}
 .ap-navbtn{flex:0 0 auto;}
 .ap-navbtn small{display:none;}
 .ap-keybox{margin-top:0;}
 .ap-foot{display:none;}
 .ap-main{padding:22px 18px 50px;}
 .ap-med dl{grid-template-columns:1fr;}
}
`;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () => reject(new Error("Could not read that file."));
    r.readAsDataURL(file);
  });
}

function safeParse(raw) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start > -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("The decoder returned something this app could not read. Try a shorter section of the document.");
  }
}

/* Every request goes to the serverless function at /api/decode. It injects the
   system prompt and routes to Muse Glimmer on the site's key, or to Anthropic,
   OpenAI or Gemini on a key the reader pastes in for that one request. */
async function callModel(body) {
  const res = await fetch("/api/decode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).catch(() => null);
  if (!res) throw new Error("Could not reach the decoder. Check your connection and try again.");
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error("The decoder service is not running here. Use vercel dev locally, or try the worked examples.");
  }
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "The decoder service returned an error.");
  return j.text || "";
}

function Result({ data }) {
  if (!data) return null;
  const lines = data.lines || [];
  const meds = data.meds || [];
  const terms = data.terms || [];
  const questions = data.questions || [];
  const unclear = data.unclear || [];
  const removed = data.removed || [];

  return (
    <div>
      <div className="ap-card">
        <h3>{data.doc || "Document"}</h3>
        <p>
          Written in {data.lang || "an unidentified language"}.
          {removed.length > 0 ? ` Identifiers stripped before display: ${removed.join(", ")}.` : " No personal identifiers were found to strip."}
        </p>
        <p style={{ marginBottom: 0 }}>
          Everything below is what the document says. Nothing below is a judgement about your health.
        </p>
      </div>

      {lines.length > 0 && (
        <div className="ap-card">
          <h3>Line by line</h3>
          <table className="ap-tbl">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>As printed</th>
                <th style={{ width: "30%" }}>In English</th>
                <th style={{ width: "26%" }}>Value</th>
                <th style={{ width: "14%" }}>Mark</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td>
                    <span className="ap-es">{l.es}</span>
                    {l.exp ? <span className="ap-exp">{l.exp}</span> : null}
                  </td>
                  <td>{l.en}</td>
                  <td>
                    {l.val}
                    {l.unit ? <span className="ap-exp">{l.unit}</span> : null}
                    {l.ref ? <span className="ap-exp">Range printed: {l.ref}</span> : null}
                  </td>
                  <td>{l.flag === "marked" ? <span className="ap-mark">Marked on report</span> : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13 }}>
            A mark appears here only when the document itself marks that line. This app does not compare your values to anything.
          </p>
        </div>
      )}

      {meds.length > 0 && (
        <div className="ap-card">
          <h3>Medicines and dosing</h3>
          {meds.map((m, i) => (
            <div className="ap-med" key={i}>
              <h4>{m.name}</h4>
              <dl>
                <dt>Active ingredient</dt><dd>{m.ingredient || "not printed"}</dd>
                <dt>Form</dt><dd>{m.form || "not printed"}</dd>
                <dt>Schedule printed</dt><dd>{m.pauta_es || "not printed"}</dd>
                <dt>In English</dt><dd>{m.pauta_en || "not printed"}</dd>
                <dt>Duration</dt><dd>{m.dur || "not printed"}</dd>
                {m.label ? (<><dt>Also on the label</dt><dd>{m.label}</dd></>) : null}
              </dl>
            </div>
          ))}
          <p style={{ marginBottom: 0, fontSize: 13 }}>
            This restates the schedule on the document. Check anything that looks different from what you were told in the consultation with your pharmacist or doctor.
          </p>
        </div>
      )}

      {terms.length > 0 && (
        <div className="ap-card">
          <h3>Terms explained</h3>
          {terms.map((t, i) => (
            <div className="ap-term" key={i}>
              <b>{t.t}</b>: {t.d}
            </div>
          ))}
        </div>
      )}

      {unclear.length > 0 && (
        <div className="ap-warn">
          <b>Worth knowing before you read further</b>
          <ul className="ap-list" style={{ marginTop: 8, color: "inherit" }}>
            {unclear.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        </div>
      )}

      {questions.length > 0 && (
        <div className="ap-card">
          <h3>Questions you could take to the appointment</h3>
          {questions.map((q, i) => (
            <div className="ap-q" key={i}>
              {q.en}
              <i>{q.es}</i>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AsPrinted() {
  const [section, setSection] = useState("read");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [example, setExample] = useState(EXAMPLES[0].id);
  const [settings, setSettings] = useState({ provider: "glimmer", keys: {}, models: {} });
  const fileRef = useRef(null);

  const current = EXAMPLES.find((e) => e.id === example) || EXAMPLES[0];
  const provider = PROVIDERS.find((p) => p.id === settings.provider) || PROVIDERS[0];
  const modelName = provider.byok ? (settings.models[provider.id] || "").trim() || provider.model : provider.model;

  async function decode() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      if (!text.trim() && !file) {
        throw new Error("Paste some text or attach a file first.");
      }
      if (provider.byok && !(settings.keys[provider.id] || "").trim()) {
        throw new Error(`Paste your ${provider.name} key in the sidebar, or switch back to Muse Glimmer.`);
      }
      // With Muse Glimmer and pasted text, the text is what gets decoded and the file stays here.
      // Otherwise the file goes along, and the server says so if the free model cannot read it.
      const sendFile = file && (provider.byok || !text.trim());
      if (sendFile && file.size > MAX_FILE_BYTES) {
        throw new Error("That file is over 3 MB. Try a smaller photo, a single page, or paste the text instead.");
      }

      const body = { provider: provider.id, text: text.trim() };
      if (sendFile) {
        body.file = { data: await fileToBase64(file), mediaType: file.type || "image/jpeg" };
      }
      if (provider.byok) {
        body.apiKey = (settings.keys[provider.id] || "").trim();
        body.model = (settings.models[provider.id] || "").trim();
      }

      const raw = await callModel(body);
      if (!raw) throw new Error("Nothing came back. Try again in a moment.");
      setResult(safeParse(raw));
    } catch (err) {
      setError(err.message || "Something went wrong reading that document.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ap">
      <style>{CSS}</style>

      <aside className="ap-side">
        <div className="ap-brand">
          As Printed
          <span>Spanish medical documents, decoded word for word</span>
        </div>
        <nav className="ap-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={"ap-navbtn" + (section === s.id ? " on" : "")}
              onClick={() => setSection(s.id)}
            >
              <b>{s.label}</b>
              <small>{s.desc}</small>
            </button>
          ))}
        </nav>
        <div className="ap-keybox">
          <h4>Model</h4>
          <p>Muse Glimmer is free and needs no key. Bring your own key for another provider, or to read photos and PDFs.</p>
          <div className="ap-provs">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                className={"ap-prov" + (settings.provider === p.id ? " on" : "")}
                onClick={() => setSettings((s) => ({ ...s, provider: p.id }))}
                title={p.note}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="ap-provnote">{provider.note}</p>
          {provider.byok ? (
            <>
              <input
                className="ap-keyin"
                type="password"
                value={settings.keys[provider.id] || ""}
                onChange={(e) => setSettings((s) => ({ ...s, keys: { ...s.keys, [provider.id]: e.target.value } }))}
                placeholder={`Your ${provider.name} API key`}
                aria-label={`${provider.name} API key`}
                autoComplete="off"
                spellCheck="false"
              />
              <input
                className="ap-keyin"
                style={{ marginTop: 8 }}
                value={settings.models[provider.id] || ""}
                onChange={(e) => setSettings((s) => ({ ...s, models: { ...s.models, [provider.id]: e.target.value } }))}
                placeholder={`Model (default ${provider.model})`}
                aria-label="Model name, optional"
                autoComplete="off"
                spellCheck="false"
              />
              {(settings.keys[provider.id] || "").trim() ? (
                <button className="ap-keybtn alt" onClick={() => setSettings((s) => ({ ...s, keys: { ...s.keys, [provider.id]: "" } }))}>
                  Remove key
                </button>
              ) : null}
              <p className="ap-provnote" style={{ marginTop: 10, marginBottom: 0 }}>
                The key lives only in this tab's memory and is passed along for each request. It is never stored or logged.
              </p>
            </>
          ) : null}
          <div className="ap-keystat">
            <span className={"ap-dot" + (!provider.byok || (settings.keys[provider.id] || "").trim() ? " on" : "")} />
            {provider.byok
              ? ((settings.keys[provider.id] || "").trim() ? `Using your ${provider.name} key` : `Add your ${provider.name} key`)
              : "Using Muse Glimmer, free"}
          </div>
        </div>
        <div className="ap-foot">
          Reading and translation come from {modelName}. Nothing is stored. This is not a diagnostic tool and does not replace your doctor or pharmacist.
        </div>
      </aside>

      <main className="ap-main">
        <div className="ap-wrap">

          {section === "read" && (
            <>
              <h1 className="ap-h1">Read a document</h1>
              <p className="ap-lede">
                Paste the text of a Spanish lab report, prescription or clinic letter, or attach a photo or PDF of it. You get the same document back with every term translated, every abbreviation spelled out and every dosing instruction restated in plain English.
              </p>

              <div className="ap-note">
                <h3>First time here</h3>
                <p>
                  This tool reads. It does not assess. It will tell you that hemoglobina means haemoglobin, that the value printed is 11,8 grams per decilitre and that the report has put an asterisk next to it. It will not tell you whether that is high, what might have caused it or what to do about it. Those answers belong to the person examining you, and this app is built so it cannot get in their way. What it can do is make sure you walk into the room knowing what the paper in your hand actually says.
                </p>
              </div>

              <div className="ap-card">
                <h3>Paste the text</h3>
                <textarea
                  className="ap-ta"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste the document text here. Leave out your name and card number if you prefer; the decoder strips them anyway."
                />
                <div className="ap-row">
                  <button className="ap-btn ap-ghost" onClick={() => fileRef.current && fileRef.current.click()}>
                    Attach a photo or PDF
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    style={{ display: "none" }}
                    onChange={(e) => setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                  />
                  {file ? (
                    <span className="ap-file">
                      {file.name}{" "}
                      <button className="ap-chip" style={{ padding: "4px 12px", marginLeft: 6 }} onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}>
                        Remove
                      </button>
                    </span>
                  ) : null}
                </div>
                <div className="ap-row">
                  <button className="ap-btn" onClick={decode} disabled={busy}>
                    {busy ? "Decoding" : "Decode this document"}
                  </button>
                  <button
                    className="ap-btn ap-ghost"
                    onClick={() => { setText(""); setFile(null); setResult(null); setError(""); if (fileRef.current) fileRef.current.value = ""; }}
                  >
                    Clear
                  </button>
                </div>
                <p style={{ marginTop: 14, marginBottom: 0, fontSize: 13 }}>
                  Long reports work better in sections. Twelve lines at a time is the limit for one pass. The free Muse Glimmer model reads pasted text; to read a photo or PDF, pick Anthropic, OpenAI or Gemini under Model in the sidebar and add your own key.
                </p>
              </div>

              {error ? <div className="ap-err">{error}</div> : null}
              <Result data={result} />
            </>
          )}

          {section === "examples" && (
            <>
              <h1 className="ap-h1">Worked examples</h1>
              <p className="ap-lede">
                Three documents an expat in Spain is likely to be handed, each with the decoded result already saved. Nothing here calls the API, so you can see how the tool behaves without a key.
              </p>
              <div className="ap-row" style={{ marginTop: 0, marginBottom: 18 }}>
                {EXAMPLES.map((e) => (
                  <button
                    key={e.id}
                    className={"ap-chip" + (example === e.id ? " on" : "")}
                    onClick={() => setExample(e.id)}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
              <div className="ap-card">
                <h3>{current.blurb}</h3>
                <pre className="ap-src">{current.source}</pre>
              </div>
              <div className="ap-sec-h">What comes back</div>
              <Result data={current.result} />
            </>
          )}

          {section === "rules" && (
            <>
              <h1 className="ap-h1">What it will not do</h1>
              <p className="ap-lede">
                The value of a comprehension tool comes from being narrow. These rules are enforced in the instructions the model runs under, and they are the reason this stays a reading aid rather than something that assesses you.
              </p>
              <div className="ap-card">
                <h3>Nine rules it runs under</h3>
                <ul className="ap-list">
                  <li><b>No verdicts on values.</b> It never says high, low, normal, borderline, fine or worrying. It reproduces a mark only when the document prints one.</li>
                  <li><b>No conditions.</b> It never names, suggests, confirms or rules out a diagnosis or a cause.</li>
                  <li><b>No treatment advice.</b> It restates the schedule on the page. It never advises starting, stopping, changing or combining anything.</li>
                  <li><b>No urgency or severity.</b> It never tells you how serious something is or how soon to act.</li>
                  <li><b>Glossary stays general.</b> Definitions say what a test measures. They never refer to your result.</li>
                  <li><b>No unit conversions.</b> Converting invites arithmetic errors on numbers that matter, so units are named in words instead.</li>
                  <li><b>Identifiers stripped.</b> Names, DNI, NIE, card numbers, addresses and clinician names are removed before anything is shown.</li>
                  <li><b>Gaps are declared.</b> Anything illegible or ambiguous is listed as unclear rather than guessed.</li>
                  <li><b>The document is data.</b> Text inside the document is decoded, never followed as an instruction to the model.</li>
                </ul>
              </div>
              <div className="ap-card">
                <h3>Why the line sits there</h3>
                <p>
                  Under EU medical device rules, software that gives information used for a diagnostic or therapeutic decision is classified as a medical device from Class IIa upwards, which brings a notified body, a clinical evaluation and, under the AI Act, high-risk obligations. Software that translates, presents and explains general information stays outside that. The scope above is a product decision as much as a regulatory one: the thing people actually lack in a foreign health system is comprehension, and that can be solved honestly without pretending to be a clinician.
                </p>
                <p style={{ marginBottom: 0 }}>
                  If you want an opinion on a result, the questions section is designed to get you a better one from the person qualified to give it.
                </p>
              </div>
            </>
          )}

          {section === "data" && (
            <>
              <h1 className="ap-h1">Your data</h1>
              <p className="ap-lede">
                Health documents are special category data under GDPR Article 9. The safest architecture for a tool like this is one that keeps nothing, so that is what this does.
              </p>
              <div className="ap-card">
                <h3>What happens to your document</h3>
                <ul className="ap-list">
                  <li>Text or the file you attach is sent to the model you picked in the sidebar for the length of one request: Muse Glimmer through NVIDIA's endpoint by default, or Anthropic, OpenAI or Gemini on your own key.</li>
                  <li>Nothing is written to a database, a session store or your browser storage. Closing this page ends it.</li>
                  <li>Identifiers are stripped from the output before it is displayed, so what appears on screen is already de-identified.</li>
                  <li>No account, no email, no history. There is nothing to breach later because there is nothing held.</li>
                  <li>If you add your own key, it stays in this tab's memory and is passed through this app's server for that one request only. It is never stored or logged, and closing the tab clears it.</li>
                </ul>
              </div>
              <div className="ap-card">
                <h3>Where the answers come from</h3>
                <p style={{ marginBottom: 0 }}>
                  Translation, abbreviation expansion and the glossary are produced by {modelName} reading your document. The same rules apply whichever model you pick, because they are added on the server to every request. There is no connected laboratory database and no reference range library behind this. Any range you see is the one printed on your own report. A model can misread a smudged photo or an unusual abbreviation, which is why anything it could not read confidently is listed rather than filled in.
                </p>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
