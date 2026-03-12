import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function MetricCard({ label, value, delta, tone = "neutral" }) {
  const toneClass =
    tone === "up"
      ? "text-emerald-300"
      : tone === "down"
      ? "text-rose-300"
      : "text-cyan-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className={`mt-2 text-sm ${toneClass}`}>{delta}</div>
    </div>
  );
}

function RaceRow({ race, index, onSelect, isSelected }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(race)}
      className={`grid w-full grid-cols-12 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
        isSelected
          ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
          : "border-white/10 bg-[#111827] text-slate-300 hover:border-cyan-400/40"
      }`}
    >
      <div className="col-span-1 text-slate-400">#{index + 1}</div>
      <div className="col-span-3 font-medium text-white">
        {race.state} {race.office}
      </div>
      <div className="col-span-2 text-slate-300">
        {race.leader?.name || "Unknown"}
      </div>
      <div className="col-span-2 text-center">{race.winProbability}%</div>
      <div className="col-span-2 text-center">{race.confidence}%</div>
      <div className="col-span-2 text-right">{race.rating}</div>
    </button>
  );
}

function RaceDetail({ race }) {
  if (!race) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-sm text-slate-400">
        Select a modeled race to view forecast details.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-300">
            Forecast Detail
          </div>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {race.state} {race.office}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            {race.candidateCount || 0} candidates modeled in this race
          </p>
        </div>

        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          {race.rating}
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Leader
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {race.leader?.name || "Unknown"}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {race.leader?.party || "Unknown Party"}
          </div>
          <div className="mt-3 space-y-1 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">Receipts:</span> $
              {Number(race.leader?.receipts || 0).toLocaleString()}
            </p>
            <p>
              <span className="text-slate-500">Cash on Hand:</span> $
              {Number(race.leader?.cash_on_hand || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Runner-Up
          </div>
          <div className="mt-2 text-lg font-semibold text-white">
            {race.runnerUp?.name || "Unknown"}
          </div>
          <div className="mt-1 text-sm text-slate-400">
            {race.runnerUp?.party || "Unknown Party"}
          </div>
          <div className="mt-3 space-y-1 text-sm text-slate-300">
            <p>
              <span className="text-slate-500">Receipts:</span> $
              {Number(race.runnerUp?.receipts || 0).toLocaleString()}
            </p>
            <p>
              <span className="text-slate-500">Cash on Hand:</span> $
              {Number(race.runnerUp?.cash_on_hand || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Win Probability
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {race.winProbability}%
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Confidence
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {race.confidence}%
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Volatility
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {race.volatility}%
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Receipts Gap
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            ${Number(race.receiptsGap || 0).toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Cash Gap
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            ${Number(race.cashGap || 0).toLocaleString()}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
            Total Receipts
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            ${Number(race.totalReceipts || 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayTierCard({ race }) {
  const fill = race?.fill || "#334155";
  const stroke = race?.stroke || "#94a3b8";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Overlay Pressure
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">
            {race?.overlayScore ?? "N/A"}
          </div>
        </div>

        <span
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: `${fill}22`,
            color: stroke,
            border: `1px solid ${stroke}`
          }}
        >
          {race?.overlayTier || "watch"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">Urgency:</span>{" "}
          {race?.urgency || "Monitor"}
        </p>
        <p>
          <span className="text-slate-500">Finance Weight:</span>{" "}
          {race?.financeWeight ?? "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Competition Weight:</span>{" "}
          {race?.competitionWeight ?? "N/A"}
        </p>
      </div>
    </div>
  );
}

export default function Forecast() {
  const [forecast, setForecast] = useState({ metrics: [], races: [] });
  const [selectedRaceKey, setSelectedRaceKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadForecast() {
      try {
        setLoading(true);
        setError("");

        const data = await api.intelligenceForecast();

        if (!active) return;

        const races = data?.races || [];
        setForecast({
          metrics: data?.metrics || [],
          races
        });

        if (races.length > 0) {
          setSelectedRaceKey(races[0].raceKey);
        }
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load forecast");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadForecast();

    return () => {
      active = false;
    };
  }, []);

  const selectedRace = useMemo(() => {
    return (
      forecast.races.find((race) => race.raceKey === selectedRaceKey) || null
    );
  }, [forecast.races, selectedRaceKey]);

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            VoterSpheres Forecast Engine
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Election Forecast</h1>
          <p className="mt-2 text-sm text-slate-400">
            Live modeled races powered by forecast competitiveness and campaign
            finance data.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            Loading forecast...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {forecast.metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  delta={metric.delta}
                  tone={metric.tone}
                />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
              <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
                <h2 className="mb-4 text-xl font-semibold">Modeled Races</h2>

                <div className="space-y-3">
                  {forecast.races.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      No forecast races available.
                    </div>
                  ) : (
                    forecast.races.map((race, index) => (
                      <RaceRow
                        key={race.raceKey}
                        race={race}
                        index={index}
                        onSelect={(row) => setSelectedRaceKey(row.raceKey)}
                        isSelected={selectedRaceKey === race.raceKey}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <RaceDetail race={selectedRace} />
                <OverlayTierCard race={selectedRace} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
