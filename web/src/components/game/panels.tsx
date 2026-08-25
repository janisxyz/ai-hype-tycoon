import { MODELS, ROLES, ROUNDS, headcountCap, stageFor } from "@/game/content";
import { CLOUD_BURST_COST, GPU_COST, dailyBurn } from "@/game/engine";
import { money } from "@/game/format";
import { useGame } from "@/game/store";
import type { GameState } from "@/game/types";

function Action({
  title,
  meta,
  disabled,
  onClick,
  danger,
}: {
  title: string;
  meta: string;
  disabled?: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-14 w-full rounded-lg border px-3 py-3 text-left transition-colors duration-150 ${
        danger
          ? "border-danger/40 bg-elevated hover:border-danger"
          : "border-border bg-elevated hover:border-border-strong"
      } disabled:opacity-40`}
    >
      <span className="block text-sm font-medium text-paper">{title}</span>
      <span className="mt-0.5 block text-xs text-subtle">{meta}</span>
    </button>
  );
}

export function OpsPanel({ state }: { state: GameState }) {
  const round = ROUNDS.find((r) => r.id === state.nextRound);
  const shortage = state.day < state.gpuShortageUntil;
  const burst = shortage ? CLOUD_BURST_COST * 3 : CLOUD_BURST_COST;
  const burn = dailyBurn(state);
  return (
    <div className="flex flex-col gap-2">
      <p className="mb-1 text-xs text-muted">
        Burn {money(burn)}/day · {state.gpus} cards · next {round?.name}
      </p>
      <Action
        title={round ? `Raise ${round.name}` : "No round left"}
        meta={
          round
            ? `${money(round.raise)} for ${Math.round(round.dilution * 100)}% · hype ${round.minHype}+`
            : "File when ready."
        }
        disabled={!round}
        onClick={() => useGame.getState().raise()}
      />
      <Action
        title="Buy an accelerator"
        meta={shortage ? "Shortage — brokers only" : `${money(GPU_COST)} · +compute/day`}
        disabled={shortage}
        onClick={() => useGame.getState().buyGpu(1)}
      />
      <Action
        title="Burst the cloud"
        meta={`${money(burst)} · +28 compute now`}
        onClick={() => useGame.getState().burstCloud()}
      />
      <Action
        title="Pivot"
        meta={
          state.day - state.lastPivotDay < 70
            ? `Available in ${70 - (state.day - state.lastPivotDay)}d`
            : "New thesis. Same GPUs. Investors notice."
        }
        disabled={state.day - state.lastPivotDay < 70}
        onClick={() => useGame.getState().pivot()}
      />
      <Action
        title="Farm the waitlist"
        meta={
          state.waitlistCooldown > 0
            ? `Ads still running (${state.waitlistCooldown}d)`
            : `${money(6000)} · mostly bots, still a TAM`
        }
        disabled={state.waitlistCooldown > 0}
        onClick={() => useGame.getState().farm()}
      />
    </div>
  );
}

export function LabPanel({ state }: { state: GameState }) {
  return (
    <div className="flex flex-col gap-4">
      {state.training && (
        <div className="rounded-lg border border-border bg-elevated p-3">
          <p className="font-mono text-[10px] text-subtle uppercase">Training</p>
          <p className="mt-1 text-sm">
            {MODELS.find((m) => m.id === state.training?.specId)?.name} · {state.training.remaining}d left
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full bg-paper"
              style={{
                width: `${((state.training.total - state.training.remaining) / state.training.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
      <div>
        <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">Recipes</p>
        <div className="flex flex-col gap-2">
          {MODELS.map((m) => (
            <Action
              key={m.id}
              title={`Train ${m.name}`}
              meta={`${m.days}d · ${m.compute} compute · ${m.researchNeed} research · ${m.blurb}`}
              disabled={!!state.training}
              onClick={() => useGame.getState().train(m.id)}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">Weights</p>
        {state.models.length === 0 && <p className="text-sm text-muted">Nothing trained yet.</p>}
        <div className="flex flex-col gap-2">
          {state.models.map((m) => {
            const spec = MODELS.find((x) => x.id === m.specId);
            return (
              <Action
                key={m.id}
                title={`Demo ${spec?.name ?? m.specId}`}
                meta={`Quality ${Math.round(m.quality)} · ${m.fakeBench ? "SOTA (alleged) · " : ""}${m.shipped ? "already shown" : "unreleased"}`}
                disabled={state.demoCooldown > 0}
                onClick={() => useGame.getState().demo(m.id)}
              />
            );
          })}
        </div>
        {state.demoCooldown > 0 && (
          <p className="mt-2 text-xs text-subtle">Demo cooldown {state.demoCooldown}d</p>
        )}
      </div>
    </div>
  );
}

export function PeoplePanel({ state }: { state: GameState }) {
  const cap = headcountCap(stageFor(state));
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        {state.employees.length}/{cap} seats in the {stageFor(state)}
      </p>
      <div className="flex flex-col gap-2">
        {state.employees.map((e) => {
          const role = ROLES.find((r) => r.id === e.roleId);
          return (
            <div key={e.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-elevated px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-paper">{e.name}</p>
                <p className="text-xs text-subtle">{role?.name}</p>
              </div>
              {e.id !== "founder" && (
                <button
                  type="button"
                  className="min-h-10 rounded-md px-2 text-xs text-muted hover:text-danger"
                  onClick={() => useGame.getState().fire(e.id)}
                >
                  Let go
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="font-mono text-[10px] tracking-[0.16em] text-subtle uppercase">Hire</p>
      <div className="flex flex-col gap-2">
        {ROLES.map((r) => (
          <Action
            key={r.id}
            title={r.name}
            meta={`${money(r.signing)} in · ${money(r.salaryMo)}/mo · ${r.blurb}`}
            onClick={() => useGame.getState().hire(r.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function ShadowPanel({ state }: { state: GameState }) {
  const latest = state.models[state.models.length - 1];
  return (
    <div className="flex flex-col gap-2">
      <p className="mb-1 text-xs text-muted">
        Scandal {Math.round(state.scandal)} · heat {Math.round(state.heat)} · karma {Math.round(state.evil)}
      </p>
      <Action
        danger
        title="Steal a paper"
        meta={
          state.stealCooldown > 0
            ? `Copier cooling (${state.stealCooldown}d)`
            : "Related work, very related. Risk of a thread."
        }
        disabled={state.stealCooldown > 0}
        onClick={() => useGame.getState().steal()}
      />
      <Action
        danger
        title="Fake a benchmark"
        meta={
          !latest
            ? "Train a model first"
            : state.fakeCooldown > 0
              ? `Leaderboard watching (${state.fakeCooldown}d)`
              : "SOTA by spreadsheet. Valuation loves this."
        }
        disabled={!latest || state.fakeCooldown > 0}
        onClick={() => latest && useGame.getState().fake(latest.id)}
      />
      <Action
        danger
        title="Farm engagement"
        meta="Same as waitlist ads. Worse manners."
        disabled={state.waitlistCooldown > 0}
        onClick={() => useGame.getState().farm()}
      />
      <p className="pt-2 text-xs leading-relaxed text-subtle">
        The IPO does not audit evals. The newspaper does. If scandal and karma both run hot, you do not get a
        ticker — you get a docket.
      </p>
    </div>
  );
}
