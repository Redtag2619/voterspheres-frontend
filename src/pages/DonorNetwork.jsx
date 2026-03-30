import { useEffect, useState } from "react";
import { intelligenceApi } from "../services/api";

function MetricCard({ label, value, delta }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-emerald-300">{delta}</div>
    </div>
  );
}

function LeaderboardRow({ row }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm">
      <div className="col-span-1 text-slate-400">#{row.rank}</div>
      <div className="col-span-4 font-medium text-white">{row.name}</div>
      <div className="col-span-2 text-slate-300">{row.state || "N/A"}</div>
      <div className="col-span-2 text-slate-300">{row.office || "N/A"}</div>
      <div className="col-span-3 text-right text-emerald-300">
        ${Number(row.receipts || 0).toLocaleString()}
      </div>
    </div>
  );
}

function LiveFundraisingCard({ item }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{item.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
            {item.party || "Unknown Party"}
          </p>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-300">
          {item.state || "Unknown State"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">Office:</span> {item.office || "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Receipts:</span> $
          {Number(item?.totals?.receipts || 0).toLocaleString()}
        </p>
        <p>
          <span className="text-slate-500">Cash on hand:</span> $
          {Number(item?.totals?.cash_on_hand_end_period || 0).toLocaleString()}
        </p>
        <p>
          <span className="text-slate-500">Disbursements:</span> $
          {Number(item?.totals?.disbursements || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function DonorNetwork() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [liveRows, setLiveRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [leaderboardData, liveData] = await Promise.all([
          intelligenceApi.fundraisingLeaderboard(),
          intelligenceApi.liveFundraising()
        ]);

        if (!active) return;

        setLeaderboard(leaderboardData?.leaderboard || []);
        setLiveRows(liveData?.results || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load donor network");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const totalReceipts = leaderboard.reduce(
    (sum, row) => sum + Number(row.receipts || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            VoterSpheres Finance Intelligence
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Donor Network</h1>
          <p className="mt-2 text-sm text-slate-400">
            Live fundraising intelligence powered by FEC-backed campaign data.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            Loading donor network...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                label="Tracked Finance Leaders"
                value={leaderboard.length}
                delta="FEC-backed candidates"
              />
              <MetricCard
                label="Modeled Receipts"
                value={`$${(totalReceipts / 1000000).toFixed(1)}M`}
                delta="Live leaderboard total"
              />
              <MetricCard
                label="Live Finance Rows"
                value={liveRows.length}
                delta="Current ingestion sample"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
              <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
                <h2 className="mb-4 text-xl font-semibold">Fundraising Leaderboard</h2>
                <div className="space-y-3">
                  {leaderboard.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      No fundraising leaderboard data available.
                    </div>
                  ) : (
                    leaderboard.map((row) => (
                      <LeaderboardRow key={`${row.rank}-${row.candidate_id}`} row={row} />
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
                <h2 className="mb-4 text-xl font-semibold">Live FEC Snapshot</h2>
                <div className="grid gap-4">
                  {liveRows.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      No live fundraising snapshot available.
                    </div>
                  ) : (
                    liveRows.map((item) => (
                      <LiveFundraisingCard
                        key={item.candidate_id || item.name}
                        item={item}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
