import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function StatCard({ label, value, delta, tone = "neutral" }) {
  const toneClass =
    tone === "up"
      ? "text-emerald-600"
      : tone === "down"
      ? "text-rose-600"
      : "text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className={`mt-2 text-sm ${toneClass}`}>{delta}</div>
    </div>
  );
}

function RaceCard({ race }) {
  const momentumUp = !String(race.change || "").startsWith("-");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold text-slate-900">{race.race}</div>
          <div className="mt-1 text-sm text-slate-500">
            {race.rating || "Competitive"} • {race.status || "Watch"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-semibold text-slate-900">
            {race.winProb}%
          </div>
          <div
            className={`mt-1 text-sm ${
              momentumUp ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {race.change}
          </div>
        </div>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#0176D3]"
          style={{ width: `${Number(race.winProb || 0)}%` }}
        />
      </div>
    </div>
  );
}

function ScenarioCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold text-slate-900">{item.title}</div>
        <div className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs font-semibold text-[#0176D3]">
          {item.probability}
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-600">{item.summary}</div>
    </div>
  );
}

function NoteCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="font-semibold text-slate-900">{item.title}</div>
      <div className="mt-2 text-sm text-slate-600">{item.detail}</div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "Tracked Races", value: "12", delta: "Live modeled states", tone: "up" },
    { label: "High Confidence", value: "5", delta: "Stable lanes", tone: "up" },
    { label: "Toss-ups", value: "3", delta: "Competitive map", tone: "down" },
    { label: "Battlegrounds", value: "7", delta: "Priority states", tone: "up" }
  ],
  races: [
    { race: "GA Senate", winProb: 57, change: "+2.4", rating: "Lean D", status: "Improving" },
    { race: "PA Senate", winProb: 54, change: "+1.8", rating: "Lean D", status: "Competitive" },
    { race: "AZ Senate", winProb: 51, change: "+1.1", rating: "Toss-up", status: "Watch" }
  ],
  scenarios: [
    {
      title: "Base Case",
      probability: "46%",
      summary: "Suburban turnout holds, affordability message remains dominant."
    },
    {
      title: "Upside Breakout",
      probability: "24%",
      summary: "Education contrast sticks and mail execution improves late vote returns."
    }
  ],
  notes: [
    {
      title: "Georgia remains the clearest upside path",
      detail: "Metro persuasion plus turnout quality is the strongest route to control."
    }
  ]
};

export default function ElectionForecast() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forecastData, setForecastData] = useState(fallbackData);

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadForecast() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/intelligence/forecast", {
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackData;

        setForecastData({
          metrics: payload.metrics?.length ? payload.metrics : fallbackData.metrics,
          races: payload.races?.length ? payload.races : fallbackData.races,
          scenarios: payload.scenarios?.length
            ? payload.scenarios
            : fallbackData.scenarios,
          notes: payload.notes?.length ? payload.notes : fallbackData.notes
        });
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.error || err?.message || "Failed to load forecast"
        );
        setForecastData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadForecast();

    return () => {
      active = false;
    };
  }, []);

  const races = useMemo(() => forecastData.races || [], [forecastData.races]);
  const scenarios = useMemo(
    () => forecastData.scenarios || [],
    [forecastData.scenarios]
  );
  const notes = useMemo(() => forecastData.notes || [], [forecastData.notes]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              Election Forecast
            </div>

            {demoMode ? (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Demo Mode
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Forecast the races that will decide control.
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Track modeled win probability, battleground movement, scenario ranges, and the variables most likely to change the map.
          </p>

          {demoMode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo forecast mode is active. Battleground movement, race probabilities, and scenario paths are preloaded for presentation.
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(forecastData.metrics || []).map((metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              tone={metric.tone}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr,1fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">
                Race Probability Board
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Top battlegrounds requiring active campaign attention.
              </p>
            </div>

            <div className="space-y-4">
              {loading ? (
                <EmptyState text="Loading forecast races..." />
              ) : !races.length ? (
                <EmptyState text="No forecast race data available." />
              ) : (
                races.map((race) => (
                  <RaceCard key={`${race.race}-${race.status}`} race={race} />
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">
                Scenario Deck
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Most likely modeled paths over the next phase of the cycle.
              </p>
            </div>

            <div className="space-y-4">
              {loading ? (
                <EmptyState text="Loading scenario paths..." />
              ) : !scenarios.length ? (
                <EmptyState text="No forecast scenarios available." />
              ) : (
                scenarios.map((item) => (
                  <ScenarioCard key={`${item.title}-${item.probability}`} item={item} />
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Forecast Notes</h2>
            <p className="mt-1 text-sm text-slate-500">
              Highest-signal interpretation from the forecast layer.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {loading ? (
              <EmptyState text="Loading forecast notes..." />
            ) : !notes.length ? (
              <EmptyState text="No forecast notes available." />
            ) : (
              notes.map((item) => (
                <NoteCard key={item.title} item={item} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
