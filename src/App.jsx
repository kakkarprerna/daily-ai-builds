import React, { useState } from "react";

/*
  Lab Report Translator
  Reads a soil or leaf analysis and returns a plain-language verdict for the farmer.
  Daily AI build. React, calls the Anthropic API directly.
*/

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

.lr-root {
  --ink: #0B2545;
  --ink-soft: #48627F;
  --blue: #1264D6;
  --blue-deep: #0A3D91;
  --blue-tint: #E7F0FE;
  --blue-line: #C9DDFB;
  --page: #F4F7FC;
  --card: #FFFFFF;
  --red: #B4232C;
  --amber: #A96108;
  --green: #16733F;
  font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--ink);
  background: var(--page);
  min-height: 100vh;
  display: flex;
  font-size: 16px;
  line-height: 1.55;
  height: 100vh;
  overflow: hidden;
}
.lr-root *, .lr-root *::before, .lr-root *::after { box-sizing: border-box; }
.lr-root h1, .lr-root h2, .lr-root h3, .lr-root p, .lr-root ul, .lr-root ol { margin: 0; }
.lr-root ul, .lr-root ol { padding-left: 1.1rem; }

/* Sidebar */
.lr-side {
  width: 268px;
  flex: 0 0 268px;
  background: var(--ink);
  color: #fff;
  padding: 28px 20px 32px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
.lr-brand { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.02em; }
.lr-brand-sub { font-size: 0.82rem; color: #A9C2E2; margin-top: 6px; }
.lr-nav { margin-top: 28px; display: flex; flex-direction: column; gap: 6px; }
.lr-navbtn {
  text-align: left;
  background: transparent;
  border: 0;
  color: #DCE8F7;
  padding: 12px 14px;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  transition: background 0.15s ease;
}
.lr-navbtn:hover { background: rgba(255,255,255,0.09); }
.lr-navbtn.is-on { background: var(--blue); color: #fff; }
.lr-navbtn-title { font-weight: 600; display: block; }
.lr-navbtn-desc { display: block; font-size: 0.76rem; color: #A9C2E2; margin-top: 2px; line-height: 1.4; }
.lr-navbtn.is-on .lr-navbtn-desc { color: #D8E7FC; }
.lr-side-foot { margin-top: 28px; font-size: 0.74rem; color: #8FAACB; line-height: 1.5; }

/* Main */
.lr-main { flex: 1; height: 100vh; overflow-y: auto; padding: 44px 40px 80px; }
.lr-inner { max-width: 820px; }
.lr-h1 { font-size: 2rem; font-weight: 700; letter-spacing: -0.025em; }
.lr-lede { color: var(--ink-soft); margin-top: 10px; max-width: 62ch; }
.lr-card {
  background: var(--card);
  border-radius: 20px;
  padding: 26px;
  margin-top: 22px;
  box-shadow: 0 2px 16px rgba(11,37,69,0.07);
}
.lr-card-tint { background: var(--blue-tint); box-shadow: none; }
.lr-h2 { font-size: 1.12rem; font-weight: 600; letter-spacing: -0.01em; }
.lr-h3 { font-size: 0.95rem; font-weight: 600; }
.lr-body { color: var(--ink-soft); margin-top: 8px; }
.lr-label { display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; }
.lr-field { margin-top: 22px; }
.lr-field:first-child { margin-top: 0; }

.lr-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.lr-chip {
  border: 1.5px solid var(--blue-line);
  background: #fff;
  color: var(--ink);
  border-radius: 999px;
  padding: 7px 16px;
  font-size: 0.88rem;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}
.lr-chip:hover { border-color: var(--blue); }
.lr-chip.is-on { background: var(--blue); border-color: var(--blue); color: #fff; font-weight: 500; }
.lr-chip-add { border-style: dashed; color: var(--blue-deep); }
.lr-addrow { display: flex; gap: 8px; margin-top: 10px; align-items: center; flex-wrap: wrap; }
.lr-addrow .lr-input { max-width: 280px; padding: 9px 16px; font-size: 0.88rem; border-radius: 999px; }
.lr-mini { border: 0; background: transparent; color: var(--ink-soft); font-family: inherit; font-size: 0.86rem; cursor: pointer; padding: 6px 8px; }
.lr-mini:hover { color: var(--ink); }

.lr-textarea, .lr-input {
  width: 100%;
  border: 1.5px solid var(--blue-line);
  border-radius: 14px;
  padding: 14px 16px;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--ink);
  background: #fff;
  resize: vertical;
}
.lr-textarea:focus, .lr-input:focus { outline: 2px solid var(--blue); outline-offset: 1px; border-color: transparent; }
.lr-textarea { min-height: 190px; line-height: 1.6; }

.lr-btn {
  background: var(--blue);
  color: #fff;
  border: 0;
  border-radius: 999px;
  padding: 13px 28px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.lr-btn:hover { background: var(--blue-deep); }
.lr-btn:disabled { background: #A8C3EA; cursor: not-allowed; }
.lr-btn-quiet {
  background: #fff;
  color: var(--blue-deep);
  border: 1.5px solid var(--blue-line);
}
.lr-btn-quiet:hover { background: var(--blue-tint); }
.lr-btnrow { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-top: 26px; }
.lr-btn:focus-visible, .lr-chip:focus-visible, .lr-navbtn:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
.lr-main .lr-btn:focus-visible, .lr-main .lr-chip:focus-visible { outline-color: var(--blue-deep); }

/* Result */
.lr-verdict { border-left: 5px solid var(--blue); padding-left: 18px; }
.lr-verdict-text { font-size: 1.18rem; font-weight: 600; line-height: 1.45; }
.lr-conf { display: inline-flex; align-items: center; gap: 7px; font-size: 0.82rem; font-weight: 600; padding: 5px 13px; border-radius: 999px; background: var(--blue-tint); color: var(--blue-deep); }
.lr-dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.lr-finding { border-top: 1px solid #E8EFF9; padding: 16px 0; display: flex; gap: 14px; }
.lr-finding:first-of-type { border-top: 0; padding-top: 6px; }
.lr-finding-body { flex: 1; }
.lr-finding-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.lr-nut { font-weight: 600; }
.lr-reading { font-size: 0.86rem; color: var(--ink-soft); }
.lr-status { font-size: 0.78rem; font-weight: 600; padding: 3px 11px; border-radius: 999px; }
.lr-action { display: flex; gap: 14px; padding: 14px 0; border-top: 1px solid #E8EFF9; }
.lr-action:first-of-type { border-top: 0; padding-top: 4px; }
.lr-when { flex: 0 0 118px; font-size: 0.84rem; font-weight: 600; color: var(--blue-deep); }
.lr-list { margin-top: 10px; color: var(--ink-soft); }
.lr-list li { margin-top: 7px; }

.lr-warn { background: #FDF4E7; border-radius: 14px; padding: 16px 18px; color: #7A4405; font-size: 0.9rem; }
.lr-err { background: #FBEDEE; border-radius: 14px; padding: 16px 18px; color: var(--red); font-size: 0.92rem; margin-top: 18px; }
.lr-spin { display: flex; align-items: center; gap: 12px; color: var(--ink-soft); }
.lr-spinner { width: 18px; height: 18px; border: 2.5px solid var(--blue-line); border-top-color: var(--blue); border-radius: 50%; animation: lr-turn 0.8s linear infinite; }
@keyframes lr-turn { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .lr-spinner { animation-duration: 2.5s; } }

.lr-ex { border-top: 1px solid #E8EFF9; padding: 18px 0; }
.lr-ex:first-of-type { border-top: 0; padding-top: 0; }
.lr-ex-vals { font-size: 0.86rem; color: var(--ink-soft); margin-top: 6px; }
.lr-kv { display: flex; gap: 14px; padding: 9px 0; border-top: 1px solid #E8EFF9; font-size: 0.92rem; }
.lr-kv:first-of-type { border-top: 0; }
.lr-kv-k { flex: 0 0 172px; font-weight: 600; }
.lr-kv-v { color: var(--ink-soft); }

@media (max-width: 880px) {
  .lr-root { flex-direction: column; height: auto; overflow: visible; }
  .lr-side { width: 100%; flex: none; height: auto; position: static; padding: 22px 18px; }
  .lr-nav { flex-direction: row; overflow-x: auto; gap: 8px; padding-bottom: 4px; }
  .lr-navbtn { flex: 0 0 auto; padding: 9px 15px; }
  .lr-navbtn-desc { display: none; }
  .lr-side-foot { display: none; }
  .lr-main { padding: 26px 18px 60px; height: auto; overflow: visible; }
  .lr-h1 { font-size: 1.6rem; }
  .lr-when { flex-basis: 92px; }
  .lr-kv { flex-direction: column; gap: 2px; }
}
`;

const SECTIONS = [
  { id: "read", title: "Read a report", desc: "Paste your lab values and get them in plain words" },
  { id: "examples", title: "Worked examples", desc: "Three real Spanish crop analyses, already read" },
  { id: "method", title: "How it reads", desc: "The logic, the confidence rules, the escalation triggers" },
  { id: "sources", title: "Where numbers come from", desc: "Thresholds, limits and what this cannot do" },
  { id: "notes", title: "Product notes", desc: "Why this exists and what I would measure" },
];

const CROPS = ["Olive", "Citrus", "Cereal (wheat, barley)", "Vineyard", "Almond", "Horticulture"];
const STAGES = {
  Olive: ["Pre-flowering", "Fruit set", "July sampling", "Post-harvest"],
  Citrus: ["Spring flush", "Summer (5 to 7 month leaves)", "Fruit growth", "Post-harvest"],
  "Cereal (wheat, barley)": ["Pre-sowing", "Tillering", "Stem extension", "Flag leaf"],
  Vineyard: ["Pre-sowing", "Flowering", "Veraison", "Post-harvest"],
  Almond: ["Pre-flowering", "Fruit set", "July sampling", "Post-harvest"],
  Horticulture: ["Pre-planting", "Vegetative", "Flowering", "Fruiting"],
};

const GENERIC_STAGES = ["Pre-sowing or pre-planting", "Early growth", "Flowering", "Fruiting or grain fill", "Post-harvest"];
const TYPES = ["Leaf or foliar", "Soil"];
const REGIONS = ["Spain", "Portugal", "France", "Italy", "Germany", "Poland", "United Kingdom"];
const LANGUAGES = ["Match my report", "English", "Español", "Català", "Português", "Français", "Deutsch", "Polski"];

const STATUS_STYLE = {
  deficient: { bg: "#FBEDEE", fg: "#B4232C" },
  low: { bg: "#FDF4E7", fg: "#A96108" },
  adequate: { bg: "#EAF6EF", fg: "#16733F" },
  high: { bg: "#FDF4E7", fg: "#A96108" },
  excess: { bg: "#FBEDEE", fg: "#B4232C" },
  unclear: { bg: "#EEF2F8", fg: "#48627F" },
};

const EXAMPLES = [
  {
    id: "olive",
    name: "Olive leaf analysis, Jaén",
    setup: { type: "leaf", crop: "Olive", stage: "July sampling" },
    text: `Muestra: hoja de olivo, variedad Picual, riego deficitario
Fecha de muestreo: 18 julio
N 1.52 %
P 0.11 %
K 0.62 %
Ca 1.90 %
Mg 0.14 %
B 14 ppm
Fe 92 ppm
Zn 11 ppm
Mn 24 ppm`,
    result: {
      headline:
        "Your trees are short of boron and potassium, and that combination is the most likely reason fruit set and fruit size have been disappointing.",
      confidence: "high",
      confidence_reason:
        "July leaf sampling is the standard timing for olive, so these values can be compared against well established reference ranges.",
      findings: [
        {
          nutrient: "Boron",
          reading: "14 ppm",
          status: "deficient",
          confidence: "high",
          meaning:
            "Olive needs roughly 19 to 150 ppm in a July leaf. Below 19 ppm the flowers set poorly even when the tree flowers heavily, so you can lose a crop that looked promising in spring.",
        },
        {
          nutrient: "Potassium",
          reading: "0.62 %",
          status: "low",
          confidence: "high",
          meaning:
            "Olive wants at least 0.80 %. Low potassium shows up as small fruit, lower oil content and trees that suffer more in a dry summer. Deficit irrigation makes this worse because the roots cannot reach potassium in dry soil.",
        },
        {
          nutrient: "Magnesium",
          reading: "0.14 %",
          status: "adequate",
          confidence: "medium",
          meaning:
            "This sits just above the 0.10 % floor. It is fine for now, but the high calcium reading means magnesium uptake is under pressure, so watch it at the next sampling.",
        },
        {
          nutrient: "Nitrogen",
          reading: "1.52 %",
          status: "adequate",
          confidence: "high",
          meaning:
            "Comfortably inside the 1.4 to 1.7 % range. Adding more nitrogen will not fix the fruit set problem and may push vegetative growth you do not want.",
        },
      ],
      actions: [
        {
          when: "Before flowering",
          do: "Apply a foliar boron spray to the whole block",
          why: "Boron has to be present at flowering to matter. Correcting it in July does nothing for this season's set.",
        },
        {
          when: "After fruit set",
          do: "Move potassium into the fertigation programme rather than one soil application",
          why: "Split doses through irrigation reach the roots in dry soil, where a single broadcast application will sit unused.",
        },
        {
          when: "Next July",
          do: "Sample the same trees on the same date and compare",
          why: "One analysis is a snapshot. The trend across two seasons tells you whether the correction worked.",
        },
      ],
      cannot_tell: [
        "Whether the boron shortage comes from the soil itself or from dry soil blocking uptake. Those need different fixes.",
        "Anything about water status, root health or the previous crop load, all of which affect these readings.",
        "How much fertiliser to buy. Rates depend on your block size, yield target and soil analysis, none of which are in this report.",
      ],
      escalate: [
        "If a boron correction was already applied this season and the leaf still reads under 19 ppm, get an agronomist to check the soil and the water.",
        "If you see the same low potassium across blocks with different irrigation, the cause is probably the soil rather than the schedule.",
      ],
      before_acting: [
        "Was the sample taken from the middle of non-fruiting shoots, at the standard July timing?",
        "Has boron been applied in the last twelve months, and at what rate?",
        "Do you have a recent soil analysis for the same block?",
      ],
    },
  },
  {
    id: "cereal",
    name: "Soil analysis, durum wheat, Castilla y León",
    setup: { type: "soil", crop: "Cereal (wheat, barley)", stage: "Pre-sowing" },
    text: `Analisis de suelo, parcela cereal secano, profundidad 0-30 cm
pH (agua) 8.3
Caliza activa 9 %
Materia organica 1.1 %
Fosforo Olsen 7 ppm
Potasio 155 ppm
Magnesio 210 ppm
CIC 14 meq/100g
Conductividad electrica 0.3 dS/m`,
    result: {
      headline:
        "Phosphorus is the limiting nutrient here, and the high pH with active limestone means a normal broadcast application will mostly be locked up before the crop can use it.",
      confidence: "high",
      confidence_reason:
        "Olsen phosphorus is the correct test for a calcareous soil and the pH and limestone readings interpret it clearly.",
      findings: [
        {
          nutrient: "Phosphorus (Olsen)",
          reading: "7 ppm",
          status: "low",
          confidence: "high",
          meaning:
            "Under 10 ppm is low for cereal. On a soil at pH 8.3 with 9 % active limestone, calcium binds phosphorus quickly, so the amount your crop can actually reach is lower than the number suggests.",
        },
        {
          nutrient: "Organic matter",
          reading: "1.1 %",
          status: "low",
          confidence: "high",
          meaning:
            "This soil holds very little water and releases almost no nitrogen on its own. Everything the crop needs has to be applied, and it holds on to less of it between rains.",
        },
        {
          nutrient: "Potassium",
          reading: "155 ppm",
          status: "adequate",
          confidence: "medium",
          meaning:
            "Sufficient for a rainfed cereal crop at this yield range. Worth rechecking if you move to irrigation or a higher yield target.",
        },
        {
          nutrient: "Salinity",
          reading: "0.3 dS/m",
          status: "adequate",
          confidence: "high",
          meaning: "No salinity problem. Nothing to manage on this front.",
        },
      ],
      actions: [
        {
          when: "At sowing",
          do: "Place phosphorus in a band near the seed instead of broadcasting it",
          why: "Banding concentrates the phosphorus so less of it meets the calcium in the soil. On calcareous soils this is the difference between a response and a wasted application.",
        },
        {
          when: "At sowing",
          do: "Choose an ammonium based nitrogen source rather than a nitrate one",
          why: "Ammonium slightly acidifies the soil right around the roots, which frees up phosphorus and micronutrients that the high pH is holding.",
        },
        {
          when: "Tillering onward",
          do: "Split the nitrogen rather than applying it all up front",
          why: "With 1.1 % organic matter this soil cannot hold nitrogen for long. Splitting matches supply to the crop and cuts what is lost.",
        },
        {
          when: "Over several seasons",
          do: "Plan a route to raise organic matter, through residue retention or organic amendments",
          why: "It is the slowest fix on this list and the one that improves every other number on the report.",
        },
      ],
      cannot_tell: [
        "Available nitrogen. It moves week to week, so a pre-sowing soil test cannot set your nitrogen plan on its own.",
        "Micronutrient status. Iron and zinc are commonly short on soils like this, but they were not tested.",
        "Soil texture and depth, which decide how much water this field can hold and therefore what yield is realistic.",
      ],
      escalate: [
        "If phosphorus has been applied at full rate for several years and the Olsen number is not moving, the placement or the product needs an agronomist's review.",
        "If parts of the field yellow between the veins early in the season, ask about iron chlorosis before adding more fertiliser.",
      ],
      before_acting: [
        "What is your realistic yield target for this field in a normal rainfall year?",
        "What was the previous crop and were residues removed or left?",
        "Was the sample taken across the whole field or from one zone?",
      ],
    },
  },
  {
    id: "citrus",
    name: "Citrus leaf analysis, Valencia",
    setup: { type: "leaf", crop: "Citrus", stage: "Summer (5 to 7 month leaves)" },
    text: `Analisis foliar clementina, hojas de brote de primavera 6 meses, sin fruto
N 2.10 %
P 0.13 %
K 0.71 %
Ca 4.20 %
Mg 0.24 %
Fe 68 ppm
Zn 14 ppm
Mn 18 ppm
B 45 ppm`,
    result: {
      headline:
        "Nitrogen and zinc are both below where clementine wants them, and the zinc shortage is the one you are most likely to see in the tree before you see it in the yield.",
      confidence: "high",
      confidence_reason:
        "The sample matches the standard citrus protocol of five to seven month old spring flush leaves from non-fruiting shoots, which is what the reference ranges are built on.",
      findings: [
        {
          nutrient: "Nitrogen",
          reading: "2.10 %",
          status: "low",
          confidence: "high",
          meaning:
            "Citrus sits best between 2.4 and 2.6 %. At 2.1 % you get less new growth and smaller fruit, though very high nitrogen brings its own problems with rind quality, so the target is a band rather than a maximum.",
        },
        {
          nutrient: "Zinc",
          reading: "14 ppm",
          status: "deficient",
          confidence: "high",
          meaning:
            "Below 25 ppm is deficient. This is what causes the small pointed leaves with pale bands between the veins on the newest growth, and it is very common on the calcareous soils around Valencia.",
        },
        {
          nutrient: "Manganese",
          reading: "18 ppm",
          status: "low",
          confidence: "medium",
          meaning:
            "Slightly under the 25 ppm mark. Manganese and zinc are usually short together on high pH soils, so a correction that covers both is normally more sensible than treating one alone.",
        },
        {
          nutrient: "Iron",
          reading: "68 ppm",
          status: "unclear",
          confidence: "low",
          meaning:
            "This number looks normal, but leaf iron is a poor guide in citrus on limestone soils. Trees can show clear yellowing with an iron reading in range, because much of the iron in the leaf is present but not usable.",
        },
      ],
      actions: [
        {
          when: "On the next flush",
          do: "Apply a foliar zinc and manganese treatment together",
          why: "Soil applied zinc is largely locked up at this pH. The leaf is the route that works, and treating both micronutrients at once saves a pass.",
        },
        {
          when: "Through the season",
          do: "Lift nitrogen through fertigation in small regular doses",
          why: "Small doses through the irrigation match the tree's demand and reduce what is lost past the root zone on sandy irrigated soils.",
        },
        {
          when: "Only if leaves yellow",
          do: "Treat iron based on what you see in the field, not on this number",
          why: "The reading cannot confirm or rule out iron chlorosis here, so visible symptoms are the more reliable trigger.",
        },
      ],
      cannot_tell: [
        "Whether the low nitrogen comes from under fertilising or from roots that cannot take it up. Root or water problems produce the same leaf reading.",
        "Iron availability, for the reason set out above.",
        "Anything about fruit quality, sugar or rind, which this analysis does not measure.",
      ],
      escalate: [
        "If zinc stays under 25 ppm after two seasons of foliar treatment, ask an agronomist to look at soil pH, irrigation water and root health together.",
        "If yellowing appears on whole trees rather than on new growth only, stop and get it diagnosed. That pattern is not a zinc shortage.",
      ],
      before_acting: [
        "Were the leaves taken from shoots without fruit? Fruiting shoots read differently and would change this reading.",
        "What is the bicarbonate level in your irrigation water?",
        "Which micronutrient products were applied this season, and when?",
      ],
    },
  },
];

export default function LabReportTranslator() {
  const [section, setSection] = useState("read");
  const [type, setType] = useState("Leaf or foliar");
  const [typeOpts, setTypeOpts] = useState(TYPES);
  const [crop, setCrop] = useState("Olive");
  const [cropOpts, setCropOpts] = useState(CROPS);
  const [stage, setStage] = useState("July sampling");
  const [customStages, setCustomStages] = useState({});
  const [region, setRegion] = useState("Spain");
  const [regionOpts, setRegionOpts] = useState(REGIONS);
  const [lang, setLang] = useState("Match my report");
  const [langOpts, setLangOpts] = useState(LANGUAGES);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const mainRef = React.useRef(null);

  const stagesFor = (c) => (STAGES[c] || GENERIC_STAGES).concat(customStages[c] || []);

  const pickCrop = (c) => {
    setCrop(c);
    setStage(stagesFor(c)[0]);
  };

  const addStage = (s) => {
    setCustomStages({ ...customStages, [crop]: [...(customStages[crop] || []), s] });
  };

  const loadExample = (ex) => {
    setType(ex.setup.type === "leaf" ? "Leaf or foliar" : "Soil");
    setCrop(ex.setup.crop);
    setStage(ex.setup.stage);
    setRegion("Spain");
    setText(ex.text);
    setResult(ex.result);
    setError("");
    setSection("read");
    if (mainRef.current) mainRef.current.scrollTo({ top: 0 });
  };

  const readReport = async () => {
    if (text.trim().length < 20) {
      setError("Add the values from your report before reading it. Paste them in any format, including straight from a PDF.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, crop, stage, region, lang, text }),
      });
      if (!res.ok) throw new Error("bad response");
      setResult(await res.json());
    } catch (e) {
      setError("The reading did not come back in a usable form. Try again, and if it keeps failing, shorten the pasted report to the nutrient values only.");
    }
    setLoading(false);
  };

  return (
    <div className="lr-root">
      <style>{CSS}</style>

      <aside className="lr-side">
        <div className="lr-brand">Lab Report Translator</div>
        <div className="lr-brand-sub">Soil and leaf analyses, read in plain language</div>
        <nav className="lr-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={"lr-navbtn" + (section === s.id ? " is-on" : "")}
              onClick={() => setSection(s.id)}
            >
              <span className="lr-navbtn-title">{s.title}</span>
              <span className="lr-navbtn-desc">{s.desc}</span>
            </button>
          ))}
        </nav>
        <div className="lr-side-foot">
          A daily AI build by Prerna Kakkar. Guidance only, not a fertiliser prescription.
        </div>
      </aside>

      <main className="lr-main" ref={mainRef}>
        <div className="lr-inner">
          {section === "read" && (
            <Read
              {...{
                type, setType, typeOpts, setTypeOpts,
                crop, pickCrop, cropOpts, setCropOpts,
                stage, setStage, stagesFor, addStage,
                region, setRegion, regionOpts, setRegionOpts,
                lang, setLang, langOpts, setLangOpts,
                text, setText, loading, error, result, readReport,
              }}
            />
          )}
          {section === "examples" && <Examples onLoad={loadExample} />}
          {section === "method" && <Method />}
          {section === "sources" && <Sources />}
          {section === "notes" && <Notes />}
        </div>
      </main>
    </div>
  );
}

function ChipGroup({ label, hint, options, value, onSelect, onAdd, placeholder }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (!v) {
      setAdding(false);
      return;
    }
    if (!options.includes(v)) onAdd(v);
    onSelect(v);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="lr-field">
      <span className="lr-label">
        {label}
        {hint && <span style={{ fontWeight: 400, color: "#48627F" }}> {hint}</span>}
      </span>
      <div className="lr-chips">
        {options.map((o) => (
          <button key={o} className={"lr-chip" + (value === o ? " is-on" : "")} onClick={() => onSelect(o)}>
            {o}
          </button>
        ))}
        <button className="lr-chip lr-chip-add" onClick={() => setAdding((a) => !a)}>
          Add your own
        </button>
      </div>
      {adding && (
        <div className="lr-addrow">
          <input
            className="lr-input"
            autoFocus
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setAdding(false);
                setDraft("");
              }
            }}
          />
          <button className="lr-btn lr-btn-quiet" style={{ padding: "10px 22px" }} onClick={commit}>
            Add
          </button>
          <button
            className="lr-mini"
            onClick={() => {
              setAdding(false);
              setDraft("");
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function Read(props) {
  const {
    type, setType, typeOpts, setTypeOpts,
    crop, pickCrop, cropOpts, setCropOpts,
    stage, setStage, stagesFor, addStage,
    region, setRegion, regionOpts, setRegionOpts,
    lang, setLang, langOpts, setLangOpts,
    text, setText, loading, error, result, readReport,
  } = props;
  return (
    <>
      <h1 className="lr-h1">Read a report</h1>
      <p className="lr-lede">
        Lab analyses arrive as a table of numbers with no explanation. Paste yours here and get back what is short,
        what it means for your crop, and what to do about it.
      </p>

      <div className="lr-card lr-card-tint">
        <h2 className="lr-h2">First time here?</h2>
        <p className="lr-body">
          You do not need to tidy anything up. Copy the values straight from your lab sheet in whatever language and
          whatever order they appear, and pick the language you want the answer in. Tell it which crop and when the
          sample was taken, because the same number means different things for an olive in July and a clementine in
          spring. What comes back is a reading, not a prescription. It will not tell you how many kilos to buy.
        </p>
      </div>

      <div className="lr-card">
        <ChipGroup
          label="What was analysed"
          options={typeOpts}
          value={type}
          onSelect={setType}
          onAdd={(v) => setTypeOpts([...typeOpts, v])}
          placeholder="Water, sap, compost"
        />

        <ChipGroup
          label="Crop"
          hint="not listed? add it"
          options={cropOpts}
          value={crop}
          onSelect={pickCrop}
          onAdd={(v) => setCropOpts([...cropOpts, v])}
          placeholder="Pistachio, avocado, maize"
        />

        <ChipGroup
          label="When the sample was taken"
          options={stagesFor(crop)}
          value={stage}
          onSelect={setStage}
          onAdd={addStage}
          placeholder="Second flush, 40 days after planting"
        />

        <ChipGroup
          label="Region or country"
          hint="thresholds shift with soil type and climate"
          options={regionOpts}
          value={region}
          onSelect={setRegion}
          onAdd={(v) => setRegionOpts([...regionOpts, v])}
          placeholder="Morocco, Andalucía, Emilia-Romagna"
        />

        <ChipGroup
          label="Answer me in"
          hint="paste your report in any language"
          options={langOpts}
          value={lang}
          onSelect={setLang}
          onAdd={(v) => setLangOpts([...langOpts, v])}
          placeholder="Nederlands, Türkçe, हिन्दी"
        />

        <div className="lr-field">
          <label className="lr-label" htmlFor="lr-report">
            Your report values
          </label>
          <textarea
            id="lr-report"
            className="lr-textarea"
            value={text}
            placeholder={"N 1.52 %\nP 0.11 %\nK 0.62 %\nB 14 ppm\nZn 11 ppm"}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="lr-btnrow">
          <button className="lr-btn" onClick={readReport} disabled={loading}>
            {loading ? "Reading" : "Read my report"}
          </button>
          {text && !loading && (
            <button className="lr-btn lr-btn-quiet" onClick={() => setText("")}>
              Clear
            </button>
          )}
        </div>

        {loading && (
          <div className="lr-spin" style={{ marginTop: 20 }}>
            <span className="lr-spinner" />
            <span>Checking each value against the reference range for {crop.toLowerCase()}</span>
          </div>
        )}
        {error && <div className="lr-err">{error}</div>}
      </div>

      {result && <Result r={result} />}
    </>
  );
}

function Result({ r }) {
  return (
    <>
      <div className="lr-card">
        <div className="lr-verdict">
          <p className="lr-verdict-text">{r.headline}</p>
        </div>
        <div style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span className="lr-conf">
            <span className="lr-dot" style={{ background: "#1264D6" }} />
            {r.confidence} confidence in this reading
          </span>
          <span style={{ color: "#48627F", fontSize: "0.88rem" }}>{r.confidence_reason}</span>
        </div>
      </div>

      <div className="lr-card">
        <h2 className="lr-h2">What each value says</h2>
        <div style={{ marginTop: 14 }}>
          {(r.findings || []).map((f, i) => {
            const st = STATUS_STYLE[f.status] || STATUS_STYLE.unclear;
            return (
              <div className="lr-finding" key={i}>
                <span className="lr-dot" style={{ background: st.fg, marginTop: 9 }} />
                <div className="lr-finding-body">
                  <div className="lr-finding-head">
                    <span className="lr-nut">{f.nutrient}</span>
                    <span className="lr-reading">{f.reading}</span>
                    <span className="lr-status" style={{ background: st.bg, color: st.fg }}>
                      {f.status}
                    </span>
                  </div>
                  <p className="lr-body">{f.meaning}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lr-card">
        <h2 className="lr-h2">What to do</h2>
        <div style={{ marginTop: 14 }}>
          {(r.actions || []).map((a, i) => (
            <div className="lr-action" key={i}>
              <div className="lr-when">{a.when}</div>
              <div>
                <div className="lr-h3">{a.do}</div>
                <p className="lr-body">{a.why}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lr-card">
        <h2 className="lr-h2">What this analysis cannot tell you</h2>
        <ul className="lr-list">
          {(r.cannot_tell || []).map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
        <div style={{ marginTop: 22 }}>
          <h3 className="lr-h3">Call an agronomist if</h3>
          <ul className="lr-list">
            {(r.escalate || []).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 22 }}>
          <h3 className="lr-h3">Answer these before you spend anything</h3>
          <ul className="lr-list">
            {(r.before_acting || []).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function Examples({ onLoad }) {
  return (
    <>
      <h1 className="lr-h1">Worked examples</h1>
      <p className="lr-lede">
        Three analyses typical of Spanish growing regions, with the reading already saved. Open one to see the full
        output without needing an API key of your own.
      </p>
      <div className="lr-card">
        {EXAMPLES.map((ex) => (
          <div className="lr-ex" key={ex.id}>
            <h2 className="lr-h2">{ex.name}</h2>
            <p className="lr-ex-vals">
              {ex.setup.type === "leaf" ? "Leaf analysis" : "Soil analysis"}, {ex.setup.stage.toLowerCase()}
            </p>
            <p className="lr-body">{ex.result.headline}</p>
            <div className="lr-btnrow" style={{ marginTop: 14 }}>
              <button className="lr-btn lr-btn-quiet" onClick={() => onLoad(ex)}>
                Open this reading
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Method() {
  const rows = [
    ["What it compares against", "Published sufficiency ranges for the crop, tissue or soil type, and sampling timing you select. Timing matters as much as the number itself, so an olive leaf sampled in July is judged on a different scale from one sampled at flowering."],
    ["Why it asks for the crop and stage", "A potassium reading of 0.7 % is low for olive and near normal for citrus. Without the crop and the sampling date the numbers cannot be judged at all, so those two inputs are required rather than optional."],
    ["How confidence is set", "High when the sampling protocol matches the reference standard. Medium when the value sits near a threshold or the timing is slightly off. Low when the test itself is a weak guide, such as leaf iron on limestone soils."],
    ["Readings it refuses to call", "Values that cannot be interpreted reliably are marked unclear rather than forced into a verdict. Guessing on those is worse than saying nothing, because a farmer acts on it."],
    ["Why it gives no rates", "A rate needs field size, yield target, product and application method, none of which are in a lab report. Placement, timing and product type are answerable from the report. Kilos per hectare are not."],
    ["When it hands over", "Every reading ends with the conditions under which an agronomist should take it on, so the tool has a defined edge rather than an open one."],
  ];
  return (
    <>
      <h1 className="lr-h1">How it reads</h1>
      <p className="lr-lede">
        The interpretation logic, written out, so you can judge whether to trust a given reading rather than take it
        on faith.
      </p>
      <div className="lr-card">
        {rows.map(([k, v]) => (
          <div className="lr-kv" key={k}>
            <div className="lr-kv-k">{k}</div>
            <div className="lr-kv-v">{v}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function Sources() {
  return (
    <>
      <h1 className="lr-h1">Where the numbers come from</h1>
      <p className="lr-lede">What sits behind a reading, and the limits you should hold it to.</p>

      <div className="lr-card">
        <h2 className="lr-h2">The reference ranges</h2>
        <p className="lr-body">
          Sufficiency ranges come from published agronomy references, the kind used in university extension guides and
          lab interpretation sheets. They are general values. They are not any fertiliser company's proprietary
          calibration, and they are not tuned to your variety, rootstock, soil type or irrigation water. Coverage is
          strongest for the main European crops and thinner for crops and regions outside that. When you enter one of
          those, the reading should come back with lower confidence, and if it does not, treat it with more suspicion
          rather than less.
        </p>
      </div>

      <div className="lr-card">
        <h2 className="lr-h2">What the model is doing</h2>
        <p className="lr-body">
          A language model reads your pasted text, matches each value to a nutrient, and compares it to those ranges.
          It can misread a badly formatted paste, confuse units, or apply the wrong range if the crop and timing you
          selected do not match the sample. Check that the values shown back to you are the values on your sheet
          before acting on any of it.
        </p>
      </div>

      <div className="lr-card">
        <h2 className="lr-h2">What it is not</h2>
        <ul className="lr-list">
          <li>Not a fertiliser recommendation. No rates, no products, no purchase advice.</li>
          <li>Not a diagnosis of disease, pests or water stress, all of which produce symptoms that look nutritional.</li>
          <li>Not a substitute for your agronomist or your lab's own interpretation service.</li>
          <li>Not a record. Nothing you paste is stored anywhere.</li>
        </ul>
      </div>

      <div className="lr-card">
        <div className="lr-warn">
          If a reading here contradicts advice from someone who has walked your field, trust the person who has walked
          your field.
        </div>
      </div>
    </>
  );
}

function Notes() {
  return (
    <>
      <h1 className="lr-h1">Product notes</h1>
      <p className="lr-lede">
        Why this build exists, the decisions behind it, and what I would measure if it shipped.
      </p>

      <div className="lr-card">
        <h2 className="lr-h2">The problem</h2>
        <p className="lr-body">
          Soil and leaf analyses are the most widely available agronomic data a farmer already owns, and among the
          least used. The barrier is not access, it is that the output is a table of ppm and percentages with no
          interpretation attached. The value sits in the translation layer, not in the measurement, which makes it a
          software problem rather than a laboratory one.
        </p>
      </div>

      <div className="lr-card">
        <h2 className="lr-h2">Decisions worth defending</h2>
        <ul className="lr-list">
          <li>
            Crop and sampling timing are required inputs, not optional ones. Accepting a bare list of numbers would
            have made onboarding faster and every reading meaningless.
          </li>
          <li>
            No fertiliser rates. The model has no basis for a rate, so producing one would be the most damaging thing
            this tool could do while looking the most useful.
          </li>
          <li>
            An unclear status exists alongside deficient, low and adequate. Leaf iron on calcareous soils is the case
            that forced it, and having somewhere honest to put a weak signal keeps the rest of the output credible.
          </li>
          <li>
            Every reading names its own limits and its escalation conditions. A tool that knows where it stops is
            easier to trust than one that answers everything.
          </li>
        </ul>
      </div>

      <div className="lr-card">
        <h2 className="lr-h2">What I would measure</h2>
        <ul className="lr-list">
          <li>Share of readings where the farmer takes at least one named action, checked at the next sampling.</li>
          <li>Repeat use across seasons, which is the real signal that the reading was worth having.</li>
          <li>Rate of escalation to an agronomist, watched in both directions. Too low means the tool is overreaching.</li>
          <li>Agreement between the tool's reading and an agronomist's, sampled and reviewed rather than assumed.</li>
        </ul>
      </div>

      <div className="lr-card">
        <h2 className="lr-h2">Where it would sit</h2>
        <p className="lr-body">
          This is a companion to lab analysis services rather than a replacement for any of them. It fits next to
          existing precision farming tools that already handle satellite monitoring and variable rate application,
          covering the one input those tools do not interpret. The natural next step is connecting it to lab results
          directly, so the farmer never retypes anything, and holding readings across seasons so the trend becomes the
          product rather than the single snapshot.
        </p>
      </div>
    </>
  );
}
