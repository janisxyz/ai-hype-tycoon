import { Building2, Cpu, FlaskConical, Landmark, Skull, Users, Zap } from "lucide-react";
import { compact, money } from "@/game/format";
import { stageCopy, stageFor } from "@/game/content";
import { dailyBurn, dailyRevenue } from "@/game/engine";
import type { GameState, TabId } from "@/game/types";
import { Meters } from "./Meters";
import { NewsTicker } from "./NewsTicker";

const ROOMS: { id: TabId; label: string; icon: typeof Building2 }[] = [
  { id: "floor", label: "Floor", icon: Building2 },
  { id: "lab", label: "Lab", icon: FlaskConical },
  { id: "crew", label: "Crew", icon: Users },
  { id: "market", label: "Tape", icon: Landmark },
  { id: "shadow", label: "Shadow", icon: Skull },
];

export function HqScene({
  state,
  tab,
  onTab,
}: {
  state: GameState;
  tab: TabId;
  onTab: (id: TabId) => void;
}) {
  const stage = stageFor(state);
  const hq = stageCopy(stage);
  const training = !!state.training;
  const racks = Math.min(14, Math.max(1, state.gpus + (training ? 1 : 0)));
  const people = Math.min(16, state.employees.length);
  const rev = dailyRevenue(state);
  const burn = dailyBurn(state);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative h-64 sm:h-80 lg:h-[28rem]">
        <img src={hq.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/25 to-transparent" />

        <div className="absolute left-3 top-3 rounded-lg border border-border bg-bg/70 px-3 py-1.5 backdrop-blur-sm">
          <p className="font-display text-lg italic leading-none">{hq.title}</p>
          <p className="mt-1 text-[11px] text-muted">{hq.line}</p>
        </div>

        <LoopStrip state={state} onTab={onTab} />

        <div className="absolute bottom-11 left-3 flex items-end gap-1">
          {Array.from({ length: racks }).map((_, i) => (
            <div
              key={i}
              className={`w-2 rounded-sm bg-sage/85 ${training ? "gpu-glow" : ""}`}
              style={{ height: `${22 + ((i * 17) % 36)}px`, animationDelay: `${i * 110}ms` }}
            />
          ))}
        </div>
        <div className="absolute bottom-12 right-4 h-7 w-44 sm:w-56">
          {Array.from({ length: people }).map((_, i) => (
            <span
              key={i}
              className="walker absolute bottom-0 h-3 w-3 rounded-full bg-paper/90"
              style={{
                left: `${(i * 16) % 88}%`,
                animationDelay: `${i * 0.35}s`,
                opacity: 0.5 + (i % 3) * 0.18,
              }}
            />
          ))}
        </div>

        <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-1 rounded-full border border-border bg-bg/75 p-1 backdrop-blur-sm">
          {ROOMS.map((r) => {
            const Icon = r.icon;
            const on = tab === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onTab(r.id)}
                className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition-colors duration-150 ${
                  on ? "bg-paper text-ink" : "text-paper/80 hover:text-paper"
                } ${r.id === "lab" && training && !on ? "hotspot-pulse" : ""}`}
                aria-label={r.label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{r.label}</span>
              </button>
            );
          })}
        </div>

        <div className="absolute inset-x-0 bottom-0">
          <NewsTicker items={state.news} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
        <Stat icon={Zap} label="Compute" value={Math.floor(state.compute).toString()} />
        <Stat icon={Cpu} label="GPUs" value={`${state.gpus}${state.gpuOrders.length ? " +" : ""}`} />
        <Stat icon={Users} label={state.users ? "Users" : "Waitlist"} value={compact(state.users || state.waitlist)} />
      </div>
      <div className="p-3">
        <Meters hype={state.hype} quality={state.quality} scandal={state.scandal} morale={state.morale} />
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>
            Burn {money(burn)}/d
            {rev > 0 && <span className="text-sage"> · Rev {money(rev)}/d</span>}
          </span>
          <span className="font-mono text-subtle">
            {state.employees.length} staff · {state.products.length} live
          </span>
        </div>
      </div>
    </section>
  );
}

function LoopStrip({ state, onTab }: { state: GameState; onTab: (id: TabId) => void }) {
  const steps: { id: string; label: string; done: boolean; tab: TabId }[] = [
    { id: "raise", label: "Raise", done: !!state.lastRound, tab: "floor" },
    { id: "train", label: "Train", done: state.models.length > 0 || !!state.training, tab: "lab" },
    { id: "demo", label: "Demo", done: state.models.some((m) => m.shipped), tab: "lab" },
    { id: "ship", label: "Ship", done: state.products.length > 0, tab: "lab" },
  ];
  if (state.listed || steps.every((s) => s.done)) return null;
  return (
    <div className="absolute right-3 top-3 hidden items-center gap-1 rounded-full border border-border bg-bg/70 p-1 backdrop-blur-sm sm:flex">
      {steps.map((s, i) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onTab(s.tab)}
          className={`min-h-8 rounded-full px-2.5 font-mono text-[10px] tracking-wide uppercase ${
            s.done ? "bg-sage/20 text-sage" : "text-muted"
          }`}
        >
          {i + 1} {s.label}
        </button>
      ))}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface px-3 py-2.5">
      <Icon className="h-4 w-4 text-sage" />
      <div className="min-w-0">
        <p className="font-mono text-[10px] tracking-[0.14em] text-subtle uppercase">{label}</p>
        <p className="tabular truncate font-mono text-sm text-paper">{value}</p>
      </div>
    </div>
  );
}
