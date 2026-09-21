// Pulse Check scoring engine
// Every formula here is deliberately deterministic and printed in the
// Method page, no model call, no randomness, same inputs always produce
// the same score.

export const LEVEL_SCORE = { weak: 20, medium: 60, strong: 100 };
export const ROI_SCORE = { none: 20, partial: 60, full: 100 };

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const round = (n) => Math.round(n);

export function band(score) {
  if (score >= 74) return "green";
  if (score >= 56) return "yellow";
  return "red";
}

export const BAND_LABEL = {
  green: "Healthy",
  yellow: "Watch",
  red: "At risk",
};

export const BAND_DOT = {
  green: "🟢",
  yellow: "🟡",
  red: "🔴",
};

function productAdoptionScore(inputs) {
  const { activeUsersPct, coreFeaturesPct, usageTrendPct } = inputs;
  const trendScore =
    usageTrendPct >= 0
      ? 100
      : clamp(100 - 1.5 * Math.abs(usageTrendPct), 0, 100);
  const score = round((activeUsersPct + coreFeaturesPct + trendScore) / 3);
  return { score: clamp(score, 0, 100), trendScore };
}

function businessOutcomesScore(inputs) {
  const { milestonesAchieved, milestonesTotal, roi } = inputs;
  const milestonePct =
    milestonesTotal > 0 ? (milestonesAchieved / milestonesTotal) * 100 : 100;
  const roiScore = ROI_SCORE[roi];
  const score = round((milestonePct + roiScore) / 2);
  return { score: clamp(score, 0, 100), milestonePct, roiScore };
}

function engagementScore(inputs) {
  const { champion, execSponsor, meetingAttendancePct } = inputs;
  const championScore = LEVEL_SCORE[champion];
  const execScore = LEVEL_SCORE[execSponsor];
  const score = round(
    0.25 * championScore + 0.35 * execScore + 0.4 * meetingAttendancePct
  );
  return { score: clamp(score, 0, 100), championScore, execScore };
}

function sentimentScore(inputs) {
  const { csat, nps } = inputs;
  const csatScore = (csat / 5) * 100;
  const npsScore = clamp((nps + 100) / 2, 0, 100);
  const score = round(0.45 * csatScore + 0.55 * npsScore);
  return { score: clamp(score, 0, 100), csatScore, npsScore };
}

function supportScore(inputs) {
  const { openCriticalIssues, openTotalIssues } = inputs;
  const nonCritical = Math.max(0, openTotalIssues - openCriticalIssues);
  const score = clamp(
    round(100 - (openCriticalIssues * 12 + nonCritical * 5)),
    0,
    100
  );
  return { score, nonCritical };
}

const CATEGORY_WEIGHTS = {
  productAdoption: 0.25,
  businessOutcomes: 0.25,
  engagement: 0.2,
  sentiment: 0.15,
  support: 0.15,
};

function buildRisks(inputs, parts) {
  const candidates = [];
  const { productAdoption, businessOutcomes, engagement, sentiment, support } =
    parts;
  const { usageTrendPct, coreFeaturesPct } = inputs;

  // Adoption: one combined line so a declining trend and weak core adoption
  // don't double count as two separate risks.
  const coreLow = coreFeaturesPct < 70;
  const trendDown = usageTrendPct < -5;
  if (coreLow && trendDown) {
    candidates.push({
      text: `Core feature adoption declining (usage down ${Math.abs(
        usageTrendPct
      )}%, only ${coreFeaturesPct}% of core features active)`,
      severity: Math.abs(usageTrendPct) * 2 + (70 - coreFeaturesPct),
    });
  } else if (trendDown) {
    candidates.push({
      text: `Overall usage trending down (${usageTrendPct}%)`,
      severity: Math.abs(usageTrendPct) * 2,
    });
  } else if (coreLow) {
    candidates.push({
      text: `Core feature adoption below target (${coreFeaturesPct}% active)`,
      severity: (70 - coreFeaturesPct) * 1.5,
    });
  }

  // Business outcomes
  if (inputs.milestonesAchieved < inputs.milestonesTotal) {
    candidates.push({
      text: `${inputs.milestonesAchieved} of ${inputs.milestonesTotal} success milestones overdue`,
      severity: (100 - businessOutcomes.milestonePct) * 0.8,
    });
  }
  if (inputs.roi !== "full") {
    candidates.push({
      text:
        inputs.roi === "none"
          ? "No ROI demonstrated to stakeholders yet"
          : "ROI only partially demonstrated to stakeholders",
      severity: inputs.roi === "none" ? 50 : 25,
    });
  }

  // Engagement
  if (engagement.execScore < engagement.championScore) {
    candidates.push({
      text: "Executive sponsor engagement weaker than champion relationship",
      severity: (engagement.championScore - engagement.execScore) * 0.9,
    });
  }
  if (inputs.meetingAttendancePct < 75) {
    candidates.push({
      text: `Meeting attendance slipping (${inputs.meetingAttendancePct}%)`,
      severity: (75 - inputs.meetingAttendancePct) * 1.2,
    });
  }
  if (inputs.champion === "weak") {
    candidates.push({
      text: "No strong champion identified on the account",
      severity: 45,
    });
  }

  // Sentiment
  if (sentiment.npsScore < 55) {
    candidates.push({
      text: `NPS signals limited advocacy (score ${inputs.nps})`,
      severity: (55 - sentiment.npsScore) * 1.2,
    });
  }
  if (sentiment.csatScore < 70) {
    candidates.push({
      text: `CSAT below healthy range (${inputs.csat}/5)`,
      severity: 70 - sentiment.csatScore,
    });
  }

  // Support
  if (inputs.openCriticalIssues > 0) {
    candidates.push({
      text: `${inputs.openCriticalIssues} critical support issue${
        inputs.openCriticalIssues > 1 ? "s" : ""
      } still open`,
      severity: inputs.openCriticalIssues * 15,
    });
  }
  if (support.nonCritical > 5) {
    candidates.push({
      text: `Elevated open ticket volume (${inputs.openTotalIssues} total)`,
      severity: (support.nonCritical - 5) * 3,
    });
  }

  candidates.sort((a, b) => b.severity - a.severity);
  return candidates.slice(0, 3).map((c) => c.text);
}

function nextBestAction(parts) {
  const { productAdoption, businessOutcomes, engagement, sentiment, support } =
    parts;

  if (businessOutcomes.score < 60 && engagement.score < 85) {
    return "Schedule an executive value review and agree recovery milestones.";
  }
  if (support.score < 60) {
    return "Escalate open critical issues to support leadership before the next renewal conversation.";
  }
  if (productAdoption.score < 60) {
    return "Run a feature adoption or re-onboarding session with the champion.";
  }
  if (sentiment.score < 60) {
    return "Schedule a listening call to address satisfaction concerns directly.";
  }
  const overall =
    CATEGORY_WEIGHTS.productAdoption * productAdoption.score +
    CATEGORY_WEIGHTS.businessOutcomes * businessOutcomes.score +
    CATEGORY_WEIGHTS.engagement * engagement.score +
    CATEGORY_WEIGHTS.sentiment * sentiment.score +
    CATEGORY_WEIGHTS.support * support.score;
  if (overall < 74) {
    return "Schedule a proactive check-in to monitor the trend before it hardens.";
  }
  return "No urgent action needed. Keep the regular cadence and re-check next cycle.";
}

export function computeScorecard(inputs) {
  const productAdoption = productAdoptionScore(inputs);
  const businessOutcomes = businessOutcomesScore(inputs);
  const engagement = engagementScore(inputs);
  const sentiment = sentimentScore(inputs);
  const support = supportScore(inputs);

  const overall = round(
    CATEGORY_WEIGHTS.productAdoption * productAdoption.score +
      CATEGORY_WEIGHTS.businessOutcomes * businessOutcomes.score +
      CATEGORY_WEIGHTS.engagement * engagement.score +
      CATEGORY_WEIGHTS.sentiment * sentiment.score +
      CATEGORY_WEIGHTS.support * support.score
  );

  const parts = { productAdoption, businessOutcomes, engagement, sentiment, support };

  const trendDelta =
    inputs.previousOverallScore === null ||
    inputs.previousOverallScore === undefined ||
    inputs.previousOverallScore === ""
      ? null
      : overall - Number(inputs.previousOverallScore);

  return {
    overall,
    overallBand: band(overall),
    trendDelta,
    categories: {
      productAdoption: { ...productAdoption, band: band(productAdoption.score) },
      businessOutcomes: { ...businessOutcomes, band: band(businessOutcomes.score) },
      engagement: { ...engagement, band: band(engagement.score) },
      sentiment: { ...sentiment, band: band(sentiment.score) },
      support: { ...support, band: band(support.score) },
    },
    risks: buildRisks(inputs, parts),
    nextAction: nextBestAction(parts),
  };
}

export const CATEGORY_WEIGHTS_PUBLIC = CATEGORY_WEIGHTS;
