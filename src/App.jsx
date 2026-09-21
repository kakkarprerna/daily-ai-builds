import { useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import InputForm from "./components/InputForm";
import ScoreCard from "./components/ScoreCard";
import MethodPage from "./components/MethodPage";
import ExamplesPage from "./components/ExamplesPage";
import { computeScorecard } from "./lib/scoring";
import { BLANK_INPUTS } from "./lib/examples";
import "./App.css";

export default function App() {
  const [view, setView] = useState("score");
  const [accountName, setAccountName] = useState("");
  const [inputs, setInputs] = useState(BLANK_INPUTS);

  const result = useMemo(() => {
    const safe = {
      ...inputs,
      previousOverallScore:
        inputs.previousOverallScore === "" ? null : inputs.previousOverallScore,
    };
    return computeScorecard(safe);
  }, [inputs]);

  const loadExample = (example) => {
    setAccountName(example.accountName);
    setInputs(example.inputs);
    setView("score");
  };

  return (
    <div className="app-shell">
      <Sidebar view={view} onNavigate={setView} />
      <main className="main-column">
        {view === "score" && (
          <div className="score-view">
            <InputForm
              accountName={accountName}
              setAccountName={setAccountName}
              inputs={inputs}
              setInputs={setInputs}
            />
            <ScoreCard accountName={accountName} inputs={inputs} result={result} />
          </div>
        )}
        {view === "method" && <MethodPage />}
        {view === "examples" && <ExamplesPage onLoad={loadExample} />}
      </main>
    </div>
  );
}
