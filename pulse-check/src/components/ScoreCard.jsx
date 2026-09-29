import {
  PulseIcon,
  TargetIcon,
  UsersIcon,
  SmileIcon,
  LifeBuoyIcon,
  TrendUpIcon,
  TrendDownIcon,
  AlertIcon,
  ArrowRightIcon,
} from "./Icons";
import { BAND_DOT } from "../lib/scoring";

const CATEGORY_META = {
  productAdoption: {
    label: "Product adoption",
    icon: PulseIcon,
    rows: (c, inputs) => [
      ["Active users", `${inputs.activeUsersPct}%`],
      ["Core features active", `${inputs.coreFeaturesPct}%`],
      [
        "Usage trend",
        `${inputs.usageTrendPct > 0 ? "↑" : inputs.usageTrendPct < 0 ? "↓" : "→"} ${Math.abs(
          inputs.usageTrendPct
        )}%`,
      ],
    ],
  },
  businessOutcomes: {
    label: "Business outcomes",
    icon: TargetIcon,
    rows: (c, inputs) => [
      ["Success milestones", `${inputs.milestonesAchieved}/${inputs.milestonesTotal}`],
      [
        "ROI demonstrated",
        inputs.roi.charAt(0).toUpperCase() + inputs.roi.slice(1),
      ],
    ],
  },
  engagement: {
    label: "Engagement",
    icon: UsersIcon,
    rows: (c, inputs) => [
      ["Champion", cap(inputs.champion)],
      ["Executive sponsor", cap(inputs.execSponsor)],
      ["Meeting attendance", `${inputs.meetingAttendancePct}%`],
    ],
  },
  sentiment: {
    label: "Sentiment",
    icon: SmileIcon,
    rows: (c, inputs) => [
      ["CSAT", `${inputs.csat}/5`],
      ["NPS", `${inputs.nps > 0 ? "+" : ""}${inputs.nps}`],
    ],
  },
  support: {
    label: "Support",
    icon: LifeBuoyIcon,
    rows: (c, inputs) => [
      ["Open critical issues", `${inputs.openCriticalIssues}`],
      ["Open total issues", `${inputs.openTotalIssues}`],
    ],
  },
};

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function CategoryBlock({ id, category, inputs }) {
  const meta = CATEGORY_META[id];
  const Icon = meta.icon;
  return (
    <div className={`category-block band-${category.band}`}>
      <div className="category-head">
        <span className="category-icon">
          <Icon />
        </span>
        <span className="category-label">{meta.label}</span>
        <span className="category-score">
          {category.score} {BAND_DOT[category.band]}
        </span>
      </div>
      <div className="category-rows">
        {meta.rows(category, inputs).map(([k, v]) => (
          <div className="category-row" key={k}>
            <span>{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScoreCard({ accountName, inputs, result }) {
  const { overall, overallBand, trendDelta, categories, risks, nextAction } = result;

  return (
    <div className="scorecard">
      <div className="scorecard-header">
        <span className="scorecard-label">Account</span>
        <h2>{accountName || "Untitled account"}</h2>
      </div>

      <div className="health-block">
        <div className="health-label">Health</div>
        <div className="health-score">
          <span className="health-dot">{BAND_DOT[overallBand]}</span>
          <span className="health-number">{overall}</span>
          <span className="health-max">/ 100</span>
        </div>
        {trendDelta !== null && (
          <div className={`health-trend ${trendDelta >= 0 ? "trend-up" : "trend-down"}`}>
            {trendDelta >= 0 ? <TrendUpIcon /> : <TrendDownIcon />}
            {trendDelta >= 0 ? "+" : ""}
            {trendDelta} points vs last quarter
          </div>
        )}
      </div>

      <div className="category-grid">
        {Object.entries(categories).map(([id, category]) => (
          <CategoryBlock key={id} id={id} category={category} inputs={inputs} />
        ))}
      </div>

      <div className="risks-block">
        <h3>
          <AlertIcon /> Top risks
        </h3>
        {risks.length === 0 ? (
          <p className="no-risks">No material risks detected this cycle.</p>
        ) : (
          <ol>
            {risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        )}
      </div>

      <div className="action-block">
        <h3>
          <ArrowRightIcon /> Next best action
        </h3>
        <p>{nextAction}</p>
      </div>
    </div>
  );
}
