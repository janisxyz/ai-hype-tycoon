import { Cpu, FlaskConical, Store } from "lucide-react";
import { clusterPower, derive } from "@/game/engine";
import { stageCopy } from "@/game/content";
import { compact, money, pct } from "@/game/format";
import { useGame } from "@/game/store";
import type { GameState, TabId } from "@/game/types";

export function HqScene({ state, tab, onTab }: { state: GameState; tab: TabId; onTab: (t: TabId) => void }) {
  const d = derive(state);
  const copy = stageCopy(d.stage);
  const c = clusterPower(state);
  const cards = state.gpus.h100 + state.gpus.b200 + state.gpus.gb200;
  const inbound = state.gpuOrders.reduce((a, o) => a + o.qty, 0);
  const cells = Math.min(64, Math.max(1, cards + inbound));
  const trainN = Math.round((state.trainPct / 100) * cards);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
      <img src={copy.image} alt="" className="h-40 w-full object-cover sm:h-56 lg:h-[20rem]" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent" />

      <div className="absolute left-3 top-3 rounded-md border border-border bg-bg/70 px-2.5 py-1.5 backdrop-blur-sm">
        <p className="kicker">{copy.title}</p>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-xl italic leading-tight text-paper sm:text-2xl">{copy.line}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {Array.from({ length: cells }).map((_, i) => {
              const onTrain = i < Math.round((state.trainPct / 100) * cells);
              const isInbound = i >= cards;
              return (
                <span
                  key={i}
                  className={`rack-cell ${
                    isInbound
                      ? "border border-dashed border-border bg-transparent"
                      : onTrain
                        ? "bg-accent"
                        : "bg-paper"
                  }`}
                  style={{ opacity: isInbound ? 0.7 : 0.7 + (i % 4) * 0.07 }}
                />
              );
            })}
          </div>
          <p className="mt-1.5 font-mono text-xs tabular text-muted">
            {cards <= 1
              ? `${state.trainPct}% train / ${100 - state.trainPct}% serve`
              : `${trainN} train · ${Math.max(0, cards - trainN)} serve`}
            {" · "}
            {c.inferB200.toFixed(1)} B200-eq · {compact(Math.round(d.usersFitMini))} 8B users
          </p>
        </div>
        <div className="flex gap-1.5">
          <Hotspot
            icon={FlaskConical}
            label={state.training ? "Training" : "Lab"}
            on={tab === "lab"}
            onClick={() => onTab("lab")}
          />
          <Hotspot icon={Cpu} label="Cluster" on={tab === "cluster"} onClick={() => onTab("cluster")} />
          <Hotspot
            icon={Store}
            label={state.revenueToday > 1 ? money(state.revenueToday) + "/d" : "Sell"}
            on={tab === "store"}
            onClick={() => onTab("store")}
          />
        </div>
      </div>
    </div>
  );
}

function Hotspot({
  icon: Icon,
  label,
  on,
  onClick,
}: {
  icon: typeof Cpu;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 items-center gap-1.5 rounded-md border px-3 text-xs ${
        on ? "border-paper bg-paper text-ink" : "border-border bg-bg/70 text-paper backdrop-blur-sm"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function LoopStrip({ state, onTab }: { state: GameState; onTab?: (t: TabId) => void }) {
  const d = derive(state);
  const steps = [
    { id: "train", label: "Train", done: !!state.training || state.models.length > 0, tab: "lab" as const },
    { id: "demo", label: "Demo", done: state.models.some((m) => m.shipped), tab: "lab" as const },
    { id: "sell", label: "Launch", done: state.products.length > 0, tab: "lab" as const },
    { id: "serve", label: "Serve", done: d.prodB200 > 0.05 && state.products.length > 0, tab: "cluster" as const },
    { id: "grow", label: "Ads", done: state.products.some((p) => p.adUntil > state.day) || state.revenueToday > 80, tab: "store" as const },
  ];
  const next = steps.find((st) => !st.done);
  return (
    <div className="grid grid-cols-5 gap-1">
      {steps.map((st, i) => (
        <button
          key={st.id}
          type="button"
          onClick={() => onTab?.(st.tab)}
          className={`rounded-md border px-1 py-2 text-center ${
            st.done
              ? "border-accent/40 bg-accent/10"
              : next?.id === st.id
                ? "border-paper/40 bg-elevated"
                : "border-border bg-elevated"
          }`}
        >
          <p className="kicker">{String(i + 1).padStart(2, "0")}</p>
          <p className={`mt-0.5 text-xs ${st.done ? "text-paper" : "text-muted"}`}>{st.label}</p>
        </button>
      ))}
    </div>
  );
}

export function GpuSplit({ state }: { state: GameState }) {
  const setTrainPct = useGame((s) => s.setTrainPct);
  const d = derive(state);
  const cards = state.gpus.h100 + state.gpus.b200 + state.gpus.gb200;
  const trainCards = cards * (state.trainPct / 100);
  const serveCards = cards - trainCards;

  const move = (delta: number) => {
    if (cards <= 1) {
      setTrainPct(Math.max(0, Math.min(100, state.trainPct + delta * 10)));
      return;
    }
    const next = Math.max(0, Math.min(cards, trainCards + delta));
    setTrainPct((next / cards) * 100);
  };

  const presets = [
    { label: "All train", n: 100 },
    { label: "70/30", n: 70 },
    { label: "50/50", n: 50 },
    { label: "30/70", n: 30 },
    { label: "All serve", n: 0 },
  ];

  return (
    <div className="rounded-xl border border-border bg-elevated p-4">
      <div className="flex items-center justify-between">
        <p className="kicker">Assign GPUs</p>
        <p className="font-mono text-xs tabular text-muted">
          {cards < 3
            ? `${state.trainPct}% train / ${100 - state.trainPct}% serve`
            : `${trainCards.toFixed(0)} train · ${serveCards.toFixed(0)} serve`}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-accent">Train {state.trainPct}%</span>
            <span className="font-mono tabular text-subtle">{d.trainPower.toFixed(1)} pwr</span>
          </div>
          <div className="util-track mt-1">
            <div className={`util-fill ${d.utilTrain ? "" : "is-paper"}`} style={{ width: `${state.trainPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-subtle">{d.utilTrain ? "Job running" : d.idleTrain ? "Idle" : "Off"}</p>
        </div>
        <div>
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-paper">Serve {100 - state.trainPct}%</span>
            <span className="font-mono tabular text-subtle">{pct(Math.min(140, d.utilProd * 100))}</span>
          </div>
          <div className="util-track mt-1">
            <div
              className={`util-fill is-paper ${d.utilProd > 1 ? "is-warn" : ""}`}
              style={{ width: `${Math.min(100, d.utilProd * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-subtle">
            {compact(Math.round(d.concurrentUsed))} / {compact(Math.round(d.concurrentCap))} live
          </p>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={state.trainPct}
        onChange={(e) => setTrainPct(Number(e.target.value))}
        className="mt-3 w-full"
      />
      <div className="mt-2 flex gap-1.5">
        <button
          type="button"
          onClick={() => move(-1)}
          className="min-h-10 flex-1 rounded-md border border-border bg-surface text-xs"
        >
          More serve
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          className="min-h-10 flex-1 rounded-md border border-border bg-surface text-xs"
        >
          More train
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => setTrainPct(p.n)}
            className={`rounded-full border px-2.5 py-1 text-xs ${
              state.trainPct === p.n ? "border-paper bg-paper text-ink" : "border-border bg-surface text-muted"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        One card can be time-sliced. {compact(Math.round(d.usersFitMini))} 8B users fit on the current Serve pool
        {d.prodB200 < 0.05 ? " — move GPUs to Serve to actually hold anyone." : "."}
      </p>
    </div>
  );
}
