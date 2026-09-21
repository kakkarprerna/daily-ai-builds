import {
  PulseIcon,
  TargetIcon,
  UsersIcon,
  SmileIcon,
  LifeBuoyIcon,
} from "./Icons";

function ChipSelect({ label, value, onChange, options }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="chip-row">
        {options.map((opt) => (
          <button
            type="button"
            key={opt.value}
            className={`chip${value === opt.value ? " chip-selected" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, min = 0, max = 100, unit = "%" }) {
  return (
    <div className="field">
      <div className="field-label-row">
        <label>{label}</label>
        <span className="field-value">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, step = 1, suffix }) {
  return (
    <div className="field field-inline">
      <label>{label}</label>
      <div className="number-input-wrap">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
        {suffix && <span className="suffix">{suffix}</span>}
      </div>
    </div>
  );
}

const LEVEL_OPTIONS = [
  { value: "weak", label: "Weak" },
  { value: "medium", label: "Medium" },
  { value: "strong", label: "Strong" },
];

const ROI_OPTIONS = [
  { value: "none", label: "None" },
  { value: "partial", label: "Partial" },
  { value: "full", label: "Full" },
];

export default function InputForm({ accountName, setAccountName, inputs, setInputs }) {
  const set = (key) => (val) => setInputs((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="input-form">
      <div className="field">
        <label>Account name</label>
        <input
          type="text"
          className="text-input"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="e.g. Acme Corp"
        />
      </div>

      <section className="form-section">
        <h3>
          <PulseIcon /> Product adoption
        </h3>
        <SliderField
          label="Active users"
          value={inputs.activeUsersPct}
          onChange={set("activeUsersPct")}
        />
        <SliderField
          label="Core features active"
          value={inputs.coreFeaturesPct}
          onChange={set("coreFeaturesPct")}
        />
        <SliderField
          label="Usage trend vs last period"
          value={inputs.usageTrendPct}
          onChange={set("usageTrendPct")}
          min={-60}
          max={60}
        />
      </section>

      <section className="form-section">
        <h3>
          <TargetIcon /> Business outcomes
        </h3>
        <div className="two-col">
          <NumberField
            label="Milestones achieved"
            value={inputs.milestonesAchieved}
            onChange={set("milestonesAchieved")}
            min={0}
          />
          <NumberField
            label="Milestones total"
            value={inputs.milestonesTotal}
            onChange={set("milestonesTotal")}
            min={1}
          />
        </div>
        <ChipSelect
          label="ROI demonstrated"
          value={inputs.roi}
          onChange={set("roi")}
          options={ROI_OPTIONS}
        />
      </section>

      <section className="form-section">
        <h3>
          <UsersIcon /> Engagement
        </h3>
        <ChipSelect
          label="Champion strength"
          value={inputs.champion}
          onChange={set("champion")}
          options={LEVEL_OPTIONS}
        />
        <ChipSelect
          label="Executive sponsor engagement"
          value={inputs.execSponsor}
          onChange={set("execSponsor")}
          options={LEVEL_OPTIONS}
        />
        <SliderField
          label="Meeting attendance"
          value={inputs.meetingAttendancePct}
          onChange={set("meetingAttendancePct")}
        />
      </section>

      <section className="form-section">
        <h3>
          <SmileIcon /> Sentiment
        </h3>
        <div className="two-col">
          <NumberField
            label="CSAT"
            value={inputs.csat}
            onChange={set("csat")}
            min={0}
            max={5}
            step={0.1}
            suffix="/ 5"
          />
          <NumberField
            label="NPS"
            value={inputs.nps}
            onChange={set("nps")}
            min={-100}
            max={100}
          />
        </div>
      </section>

      <section className="form-section">
        <h3>
          <LifeBuoyIcon /> Support
        </h3>
        <div className="two-col">
          <NumberField
            label="Open critical issues"
            value={inputs.openCriticalIssues}
            onChange={set("openCriticalIssues")}
            min={0}
          />
          <NumberField
            label="Open total issues"
            value={inputs.openTotalIssues}
            onChange={set("openTotalIssues")}
            min={0}
          />
        </div>
      </section>

      <section className="form-section">
        <h3>Trend (optional)</h3>
        <NumberField
          label="Last quarter's overall score"
          value={inputs.previousOverallScore}
          onChange={set("previousOverallScore")}
          min={0}
          max={100}
        />
      </section>
    </div>
  );
}
