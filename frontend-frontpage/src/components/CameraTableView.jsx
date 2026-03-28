import React, { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE, API_HINT } from '../api';

/** Blackjack card value for display (no suits). A=11, J/Q/K=10, 2–10 as-is. */
function rankToValue(rank) {
  const r = String(rank);
  if (r === 'A') return '11';
  if (['J', 'Q', 'K'].includes(r)) return '10';
  return r;
}

function PlayingCard({ rank }) {
  const value = rankToValue(rank);
  return (
    <div
      className="rounded-lg border-2 border-white/25 bg-white w-[4.25rem] h-[5.75rem] sm:w-[4.5rem] sm:h-24 flex items-center justify-center shadow-lg shrink-0 text-neutral-900"
      title={`Detected rank: ${rank} (shown as blackjack value)`}
    >
      <span className="text-3xl font-black leading-none font-sans tabular-nums">{value}</span>
    </div>
  );
}

const POLL_MS = 400;
const SNAPSHOT_MS = 90;

const CameraTableView = ({ onBack }) => {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [streamOk, setStreamOk] = useState(true);
  const [useLiveMjpeg, setUseLiveMjpeg] = useState(false);
  const [frameTick, setFrameTick] = useState(0);
  const bootstrapped = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/card-state`);
      const data = await res.json();
      if (!data.success) {
        setError('Camera API returned an error.');
        return;
      }
      setState(data);
      setError(null);
    } catch {
      setError(
        `Cannot reach the Python backend at ${API_HINT}. Start server.py, then refresh. For IP Webcam, set CAMERA_URL in .env next to server.py.`,
      );
      setState(null);
    }
  }, []);

  useEffect(() => {
    if (!bootstrapped.current) {
      bootstrapped.current = true;
      queueMicrotask(() => {
        void refresh();
      });
    }
    const t = setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (useLiveMjpeg) return undefined;
    const id = setInterval(() => {
      setFrameTick((n) => n + 1);
    }, SNAPSHOT_MS);
    return () => clearInterval(id);
  }, [useLiveMjpeg]);

  const resetCount = async () => {
    try {
      await fetch(`${API_BASE}/camera-reset`, { method: 'POST' });
    } catch {
      /* ignore */
    }
    refresh();
  };

  const committed = state?.committed_cards ?? [];
  const count = state?.count ?? 0;
  const cardsSeen = state?.cards_seen ?? 0;

  const streamUrl = `${API_BASE}/stream`;
  const frameUrl = `${API_BASE}/frame?t=${frameTick}`;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-white/90 hover:text-white underline-offset-4 hover:underline"
        >
          ← Back to menu
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide text-center flex-1 min-w-[12rem]">
          Live camera &amp; detection
        </h2>
        <button
          type="button"
          onClick={resetCount}
          className="text-xs sm:text-sm font-bold uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-2 text-white"
        >
          Reset count / session
        </button>
      </div>

      <p className="text-[11px] sm:text-xs text-gray-400 leading-snug w-full border-l-2 border-white/20 pl-3">
        <span className="text-gray-500 font-bold uppercase tracking-wider">About</span>
        {' — '}
        Video comes from your Python server (phone or webcam). Detected cards show as numbers only (A=11,
        J/Q/K=10); the model still outputs rank labels. Hi‑Lo count uses those commits as before.
      </p>

      {error && (
        <div className="w-full rounded-xl bg-red-900/40 border border-red-500/40 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        <div className="rounded-2xl overflow-hidden border border-white/15 bg-black flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-black/60 border-b border-white/10">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              Video preview
            </span>
            <label className="flex items-center gap-2 text-[11px] text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useLiveMjpeg}
                onChange={(e) => {
                  setUseLiveMjpeg(e.target.checked);
                  setStreamOk(true);
                }}
                className="rounded border-white/30"
              />
              MJPEG stream (experimental)
            </label>
          </div>

          <div className="relative w-full min-h-[260px] sm:min-h-[320px] bg-black flex items-center justify-center p-1">
            <img
              src={useLiveMjpeg ? streamUrl : frameUrl}
              alt=""
              className="max-h-[min(65vh,520px)] w-full h-full object-contain"
              onLoad={() => setStreamOk(true)}
              onError={() => setStreamOk(false)}
            />
          </div>

          {!streamOk && (
            <p className="text-xs text-amber-200/90 px-3 py-2 border-t border-white/10">
              Image did not load — is <code className="text-amber-100/90">python server.py</code> running on
              port 8000? Backend: <code className="text-amber-100/90">{API_BASE}</code>
            </p>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 text-[11px] text-gray-500 bg-black/40">
            <a
              href={streamUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400/90 hover:underline"
            >
              Open MJPEG in new tab
            </a>
            <span className="text-gray-600">|</span>
            <a
              href={frameUrl}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400/90 hover:underline"
            >
              Open one frame
            </a>
            {!useLiveMjpeg && (
              <span className="text-gray-500 w-full sm:w-auto">
                Snapshot mode refreshes ~{Math.round(1000 / SNAPSHOT_MS)}/s (works best with the dev server).
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-[200px]">
          <div className="rounded-2xl bg-black/35 border border-white/10 px-4 py-3 flex flex-wrap gap-6 justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Running count</p>
              <p className="text-3xl font-black text-white tabular-nums">{count}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Tracks counted</p>
              <p className="text-xl font-bold text-white tabular-nums">
                {cardsSeen}
                <span className="text-gray-500 text-base font-semibold"> / 52</span>
              </p>
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
              Cards from camera (committed) — numbers only
            </p>
            <div className="flex flex-wrap gap-2 min-h-[6rem] p-3 rounded-2xl bg-black/25 border border-white/10">
              {committed.length === 0 ? (
                <span className="text-sm text-gray-500 self-center">
                  Show cards in frame — values appear here after the model locks a track.
                </span>
              ) : (
                committed.map((c, i) => (
                  <PlayingCard key={`${i}-${c.rank}`} rank={c.rank} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraTableView;
