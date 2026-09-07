import {
  Briefcase,
  Cpu,
  FileText,
  FlaskConical,
  Megaphone,
  Presentation,
  Rocket,
  Scale,
  Shield,
  Skull,
  Sparkles,
  TrendingUp,
  UserMinus,
  UserPlus,
  Zap,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { MARKET_COPY, MODELS, ROLES, ROUNDS, headcountCap, stageFor } from "@/game/content";
import { CLOUD_BURST_COST, GPU_COST, dailyBurn, dailyRevenue } from "@/game/engine";
import { compact, money } from "@/game/format";
import { useGame } from "@/game/store";
import type { GameState, RoleId } from "@/game/types";

const ROLE_ICON: Record<RoleId, typeof FlaskConical> = {
  researcher: FlaskConical,
  gpu: Cpu,
  hype: Megaphone,
  product: Sparkles,
  safety: Shield,
  mill: FileText,
  exec: Briefcase,
  demo: Presentation,
  legal: Scale,
};

const ROLE_SHORT: Record<RoleId, string> = {
  researcher: "Research",
  gpu: "Cluster",
  hype: "Growth",
  product: "Product",
  safety: "Align",
  mill: "Papers",
  exec: "VP",
  demo: "Demo",
  legal: "Counsel",
};

function Bar({ value, max, tone }: { value: number; max: number; tone: "sage" | "paper" | "danger" | "warn" }) {
  const pct = max <= 0 ? 100 : Math.max(0, Math.min(100, (value / max) * 100));
  const fill =
    tone === "sage"
      ? "bg-sage"
      : tone === "danger"
        ? "bg-danger"
        : tone === "warn"
          ? "bg-warn"
          : "bg-paper/80";
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-bg">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function FloorPanel({ state }: { state: GameState }) {
  const round = ROUNDS.find((r) => r.id === state.nextRound);
  const shortage = state.day < state.gpuShortageUntil;
  const burst = shortage ? CLOUD_BURST_COST * 2.4 : CLOUD_BURST_COST;
  const burn = dailyBurn(state);
  const rev = dailyRevenue(state);
  const chart = state.history.map((v, i) => ({ i, v }));
  const inbound = state.gpuOrders.reduce((n, o) => n + o.qty, 0);
  const hypeReady = round ? state.hype >= round.minHype : false;
  const valReady = round ? state.valuation >= round.minValuation : false;
  const canRaise = !!round && hypeReady && valReady;

  return (
    <div className="flex flex-col gap-3">
      {chart.length > 2 && (
        <div className="h-20 rounded-lg border border-border bg-elevated p-2">
          <ResponsiveContainer width="100%" height={64}>
            <LineChart data={chart}>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Line type="monotone" dataKey="v" stroke="var(--color-sage)" strokeWidth={1.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {round && (
        <div className="rounded-lg border border-border bg-elevated p-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-xl italic leading-none">{round.name}</p>
            <p className="font-mono text-xs text-sage">{round.raise ? money(round.raise) : "Primary"}</p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 font-mono text-[10px] text-subtle uppercase">Hype {Math.round(state.hype)}/{round.minHype}</p>
              <Bar value={state.hype} max={round.minHype} tone={hypeReady ? "sage" : "paper"} />
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] text-subtle uppercase">Book {money(state.valuation)}</p>
              <Bar
                value={state.valuation}
                max={Math.max(1, round.minValuation)}
                tone={valReady ? "sage" : "paper"}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => useGame.getState().raise()}
            className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-paper text-sm font-semibold text-ink transition-transform duration-150 active:scale-[0.98]"
          >
            <TrendingUp className="h-4 w-4" />
            {canRaise ? `Raise ${round.name}` : "Not yet"}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={shortage}
          onClick={() => useGame.getState().buyGpu(1)}
          className="flex min-h-16 flex-col items-start justify-center gap-1 rounded-lg border border-border bg-elevated px-3 py-2 text-left disabled:opacity-40"
        >
          <span className="flex items-center gap-2 text-sm text-paper">
            <Zap className="h-4 w-4 text-sage" />
            Order GPU
          </span>
          <span className="font-mono text-[11px] text-subtle">
            {shortage ? "Shortage" : `${money(GPU_COST)} · 5d`}
          </span>
        </button>
        <button
          type="button"
          onClick={() => useGame.getState().burstCloud()}
          className="flex min-h-16 flex-col items-start justify-center gap-1 rounded-lg border border-border bg-elevated px-3 py-2 text-left"
        >
          <span className="flex items-center gap-2 text-sm text-paper">
            <Sparkles className="h-4 w-4 text-sage" />
            Burst cloud
          </span>
          <span className="font-mono text-[11px] text-subtle">{money(burst)} · +42</span>
        </button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-elevated px-3 py-2">
        <div className="flex items-end gap-0.5">
          {Array.from({ length: Math.min(12, Math.max(1, state.gpus)) }).map((_, i) => (
            <span key={i} className="inline-block w-1.5 rounded-sm bg-sage" style={{ height: `${10 + (i % 5) * 3}px` }} />
          ))}
        </div>
        <p className="font-mono text-xs text-muted">
          {state.gpus} cards{inbound ? ` · ${inbound} inbound` : ""}
          {rev > 0 ? ` · ${money(rev - burn)}/d` : ""}
        </p>
      </div>

      {state.products.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {state.products.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-elevated px-3 py-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-paper">{p.name}</p>
                <p className="font-mono text-xs text-sage">{compact(p.users)}</p>
              </div>
              <div className="mt-2">
                <Bar value={p.quality} max={100} tone="sage" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LabPanel({ state }: { state: GameState }) {
  const specTraining = MODELS.find((m) => m.id === state.training?.specId);
  return (
    <div className="flex flex-col gap-3">
      {state.training && (
        <div className="rounded-lg border border-sage/40 bg-elevated p-3">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg italic">{specTraining?.name}</p>
            <p className="font-mono text-xs text-sage">{state.training.remaining}d</p>
          </div>
          <div className="mt-2">
            <Bar
              value={state.training.total - state.training.remaining}
              max={state.training.total}
              tone="sage"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MODELS.filter((m) => m.unlock(state)).map((m) => {
          const ready = !state.training && state.compute >= m.compute && state.research >= m.researchNeed;
          return (
            <button
              key={m.id}
              type="button"
              disabled={!!state.training}
              onClick={() => useGame.getState().train(m.id)}
              className="flex min-h-20 flex-col items-start rounded-lg border border-border bg-elevated px-3 py-2.5 text-left disabled:opacity-40"
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-sm text-paper">{m.name}</span>
                <FlaskConical className={`h-3.5 w-3.5 ${ready ? "text-sage" : "text-subtle"}`} />
              </span>
              <span className="mt-2 font-mono text-[10px] text-subtle">
                {m.days}d · {m.compute} flops · {m.researchNeed} rs
              </span>
            </button>
          );
        })}
      </div>

      {state.models.length > 0 && (
        <div className="flex flex-col gap-2">
          {state.models.map((m) => {
            const spec = MODELS.find((x) => x.id === m.specId);
            return (
              <div key={m.id} className="rounded-lg border border-border bg-elevated p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-paper">{spec?.name}</p>
                  <p className="font-mono text-xs text-sage">Q {Math.round(m.quality)}</p>
                </div>
                <div className="mt-2">
                  <Bar value={m.quality} max={100} tone="sage" />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={state.demoCooldown > 0}
                    onClick={() => useGame.getState().demo(m.id)}
                    className="min-h-11 flex-1 rounded-md bg-paper px-3 text-xs font-semibold text-ink disabled:opacity-40"
                  >
                    Demo
                  </button>
                  <button
                    type="button"
                    disabled={!m.shipped || m.launched}
                    onClick={() => useGame.getState().launch(m.id)}
                    className="min-h-11 flex-1 rounded-md border border-border px-3 text-xs font-medium text-paper disabled:opacity-40"
                  >
                    {m.launched ? "Live" : "Launch"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CrewPanel({ state }: { state: GameState }) {
  const cap = headcountCap(stageFor(state));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {state.employees.length}/{cap} seats
        </span>
        <span>Morale {Math.round(state.morale)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {state.employees.map((e) => {
          return (
            <div
              key={e.id}
              className="flex items-center gap-2 rounded-full border border-border bg-elevated py-1 pl-1 pr-2"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paper font-display text-sm italic text-ink">
                {e.name.slice(0, 1)}
              </div>
              <div className="min-w-0 pr-1">
                <p className="max-w-24 truncate text-xs text-paper">{e.name}</p>
                <p className="text-[10px] text-subtle">{ROLE_SHORT[e.roleId]}</p>
              </div>
              {e.id !== "founder" && (
                <button
                  type="button"
                  className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-full text-muted hover:text-danger"
                  onClick={() => useGame.getState().fire(e.id)}
                  aria-label={`Let go ${e.name}`}
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ROLES.map((r) => {
          const Icon = ROLE_ICON[r.id];
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => useGame.getState().hire(r.id)}
              className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-elevated px-1 py-2"
            >
              <Icon className="h-4 w-4 text-sage" />
              <span className="text-center text-[11px] leading-tight text-paper">{ROLE_SHORT[r.id]}</span>
              <span className="font-mono text-[10px] text-subtle">{money(r.signing)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MarketPanel({ state }: { state: GameState }) {
  const cycle = MARKET_COPY[state.market];
  const you = state.valuation;
  const maxVal = Math.max(you, ...state.competitors.map((c) => c.valuation), 1);
  const pivotLeft = Math.max(0, 90 - (state.day - state.lastPivotDay));
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-border bg-elevated p-3">
        <p className="font-display text-2xl italic leading-none">{cycle.title}</p>
        <p className="mt-2 font-mono text-[11px] text-subtle">{state.marketDaysLeft}d on this tape</p>
        <div className="mt-2">
          <Bar value={state.marketDaysLeft} max={110} tone="warn" />
        </div>
        {state.listed && (
          <p className="mt-3 font-mono text-sm text-paper">
            {money(state.stockPrice)}
            <span className="ml-2 text-xs text-subtle">{Math.round(state.equity * 100)}% yours</span>
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <RivalRow name={state.company} value={you} max={maxVal} you />
        {state.competitors.map((c) => (
          <RivalRow key={c.id} name={c.name} value={c.valuation} max={maxVal} />
        ))}
      </div>
      <button
        type="button"
        disabled={pivotLeft > 0}
        onClick={() => useGame.getState().pivot()}
        className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border bg-elevated text-sm text-paper disabled:opacity-40"
      >
        <Rocket className="h-4 w-4 text-sage" />
        {pivotLeft > 0 ? `Pivot in ${pivotLeft}d` : "Pivot"}
      </button>
    </div>
  );
}

function RivalRow({ name, value, max, you }: { name: string; value: number; max: number; you?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className={`truncate text-sm ${you ? "text-paper" : "text-muted"}`}>{name}</p>
        <p className="font-mono text-xs text-sage">{money(value)}</p>
      </div>
      <Bar value={value} max={max} tone={you ? "sage" : "paper"} />
    </div>
  );
}

export function ShadowPanel({ state }: { state: GameState }) {
  const latest = state.models[state.models.length - 1];
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <MeterChip label="Scandal" value={state.scandal} tone="danger" />
        <MeterChip label="Heat" value={state.heat} tone="warn" />
        <MeterChip label="Karma" value={state.evil} tone="paper" />
      </div>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          disabled={state.stealCooldown > 0}
          onClick={() => useGame.getState().steal()}
          className="flex min-h-14 items-center gap-3 rounded-lg border border-danger/40 bg-elevated px-3 text-left disabled:opacity-40"
        >
          <Skull className="h-4 w-4 text-danger" />
          <span>
            <span className="block text-sm text-paper">Steal a paper</span>
            <span className="font-mono text-[11px] text-subtle">
              {state.stealCooldown > 0 ? `${state.stealCooldown}d` : "+research"}
            </span>
          </span>
        </button>
        <button
          type="button"
          disabled={!latest || state.fakeCooldown > 0}
          onClick={() => latest && useGame.getState().fake(latest.id)}
          className="flex min-h-14 items-center gap-3 rounded-lg border border-danger/40 bg-elevated px-3 text-left disabled:opacity-40"
        >
          <Megaphone className="h-4 w-4 text-danger" />
          <span>
            <span className="block text-sm text-paper">Fake a benchmark</span>
            <span className="font-mono text-[11px] text-subtle">
              {!latest ? "Need weights" : state.fakeCooldown > 0 ? `${state.fakeCooldown}d` : "+hype"}
            </span>
          </span>
        </button>
        <button
          type="button"
          disabled={state.waitlistCooldown > 0}
          onClick={() => useGame.getState().farm()}
          className="flex min-h-14 items-center gap-3 rounded-lg border border-danger/40 bg-elevated px-3 text-left disabled:opacity-40"
        >
          <UserPlus className="h-4 w-4 text-danger" />
          <span>
            <span className="block text-sm text-paper">Farm the waitlist</span>
            <span className="font-mono text-[11px] text-subtle">
              {state.waitlistCooldown > 0 ? `${state.waitlistCooldown}d` : money(8000)}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}

function MeterChip({ label, value, tone }: { label: string; value: number; tone: "sage" | "paper" | "danger" | "warn" }) {
  return (
    <div className="rounded-lg border border-border bg-elevated px-2 py-2">
      <p className="font-mono text-[10px] text-subtle uppercase">{label}</p>
      <p className="tabular font-mono text-sm text-paper">{Math.round(value)}</p>
      <div className="mt-1">
        <Bar value={value} max={100} tone={tone} />
      </div>
    </div>
  );
}
