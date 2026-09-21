import { EXAMPLES } from "../lib/examples";
import { computeScorecard, BAND_DOT } from "../lib/scoring";
import { ArrowRightIcon } from "./Icons";

export default function ExamplesPage({ onLoad }) {
  return (
    <div className="examples-page">
      <div className="page-intro">
        <h2>Worked examples</h2>
        <p>
          Three accounts, pre-filled. Load one to see the score, top risks and
          recommended action generated live from its inputs.
        </p>
      </div>

      <div className="example-grid">
        {EXAMPLES.map((ex) => {
          const result = computeScorecard(ex.inputs);
          return (
            <div className="example-card" key={ex.id}>
              <div className="example-card-top">
                <span className="example-tag">{ex.tag}</span>
                <span className="example-score">
                  {BAND_DOT[result.overallBand]} {result.overall}
                </span>
              </div>
              <h4>{ex.accountName}</h4>
              <p>{ex.blurb}</p>
              <button className="load-btn" onClick={() => onLoad(ex)}>
                Load this account <ArrowRightIcon />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
