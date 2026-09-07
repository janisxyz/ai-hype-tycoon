import {
  AD_PACKS,
  GPU_SKUS,
  MARKET_COPY,
  MODEL_CLASSES,
  ROLES,
  ROUNDS,
  chatUsersPerB200,
  chatUsersPerCard,
  classById,
  headcountCap,
  livePerCard,
  modelName,
  roleById,
  skuById,
} from "@/game/content";
import { clusterPower, derive, forecastAd, nextVersion, productLoad, productPayShare } from "@/game/engine";
import { compact, money, pct, tokLabel } from "@/game/format";
import { useGame } from "@/game/store";
import type { GameState, ModelClassId, ProductKind } from "@/game/types";
import { GpuSplit } from "./HqScene";

export function FloorPanel({ state }: { state: GameState }) {
  const raise = useGame((s) => s.raise);
  const burst = useGame((s) => s.burstCloud);
  const d = derive(state);
  const round = ROUNDS.find((r) => r.id === state.nextRound);
  const hypeOk = round ? state.hype >= round.minHype : false;
  const valOk = round ? state.valuation >= round.minValuation : false;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Tile k="Burn" v={`${money(d.burn)}/d`} sub={`Payroll ${money(d.payroll)} · power ${money(d.power)}`} />
        <Tile k="Revenue" v={`${money(d.revenue)}/d`} sub={d.profit >= 0 ? "In the black" : "Still raising"} good={d.profit >= 0} />
      </div>
      {round && (
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="kicker">Raise</p>
          <p className="mt-1 font-display text-2xl italic">{round.name}</p>
          <p className="mt-1 text-sm text-muted">{round.blurb}</p>
          <div className="mt-3 space-y-1.5">
            <Bar label={`Hype ${Math.floor(state.hype)} / ${round.minHype}`} frac={state.hype / Math.max(1, round.minHype)} ok={hypeOk} />
            <Bar
              label={`Value ${money(state.valuation)} / ${money(round.minValuation || 1)}`}
              frac={round.minValuation ? state.valuation / round.minValuation : 1}
              ok={valOk}
            />
          </div>
          <button type="button" onClick={raise} className="mt-3 min-h-11 w-full rounded-md bg-paper text-sm font-semibold text-ink">
            {round.raise > 0 ? `Close ${money(round.raise)}` : "File the S-1"}
          </button>
        </div>
      )}
      <button type="button" onClick={burst} className="min-h-11 w-full rounded-md border border-border bg-surface text-sm">
        Burst cloud · extra compute
      </button>
      <p className="text-xs text-subtle">
        Equity {Math.round(state.equity * 100)}% · {state.employees.length}/{headcountCap(d.stage)} seats
      </p>
    </div>
  );
}

export function LabPanel({ state }: { state: GameState }) {
  const train = useGame((s) => s.train);
  const launch = useGame((s) => s.launch);
  const openChat = useGame((s) => s.openChat);
  const d = derive(state);
  const c = clusterPower(state);
  const latest = state.models.length ? state.models[state.models.length - 1]! : null;
  const hasChat = state.products.some((p) => p.kind === "chat");

  return (
    <div className="space-y-4">
      {!state.training && state.models.length === 0 && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="kicker text-accent">First move</p>
          <p className="mt-1 font-display text-3xl italic leading-tight">Train an 8B</p>
          <p className="mt-2 text-sm text-muted">Two days. Then you open Chat and people start paying. That is the game.</p>
          <button
            type="button"
            onClick={() => train("mini")}
            className="mt-4 min-h-12 w-full rounded-lg bg-paper text-base font-semibold text-ink"
          >
            Train it
          </button>
        </div>
      )}

      {state.training && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="kicker text-accent">Cooking</p>
          <p className="mt-1 font-display text-2xl italic">{state.training.name}</p>
          <Bar
            label={c.trainPower < 0.08 ? "Starved — tap GPUs, slide to Train" : `~${d.trainDaysLeft}d left`}
            frac={1 - state.training.remaining / state.training.total}
            ok
          />
        </div>
      )}

      {latest && !hasChat && !state.training && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="kicker text-accent">Ready to sell</p>
          <p className="mt-1 font-display text-3xl italic leading-tight">{latest.name}</p>
          <p className="mt-2 text-sm text-muted">Open Chat. Hundreds of users walk in. You start making money tonight.</p>
          <button
            type="button"
            onClick={() => openChat(latest.id)}
            className="mt-4 min-h-12 w-full rounded-lg bg-paper text-base font-semibold text-ink"
          >
            Open Chat and charge
          </button>
        </div>
      )}

      {state.models.length > 0 && (
        <div className="space-y-2">
          <p className="kicker">Weights</p>
          {state.models
            .slice()
            .reverse()
            .map((m) => {
              const cls = classById(m.classId);
              const kinds: { id: ProductKind; label: string; hint: string }[] = [
                { id: "chat", label: "Chat", hint: `$${cls.chatPrice}/mo` },
                { id: "api", label: "API", hint: `$${cls.apiPrice}/1M` },
                { id: "enterprise", label: "Work", hint: `$${cls.entPrice}/seat` },
              ];
              const live = state.products.filter((p) => p.modelId === m.id);
              return (
                <div key={m.id} className="rounded-xl border border-border bg-elevated p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-display text-xl italic">{m.name}</p>
                    <p className="font-mono text-xs tabular text-accent">Q {Math.round(m.quality)}</p>
                  </div>
                  {live.length > 0 && (
                    <p className="mt-1 text-sm text-good">{live.map((p) => p.name).join(" · ")} live</p>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    {kinds.map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => launch(m.id, k.id)}
                        className="min-h-11 rounded-md border border-border bg-surface px-2 text-center"
                      >
                        <span className="block text-sm text-paper">{k.label}</span>
                        <span className="block font-mono text-xs text-subtle">{k.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {(state.models.length > 0 || state.training) && (
        <div className="space-y-2">
          <p className="kicker">Train next</p>
          {MODEL_CLASSES.map((cls) => {
            const open = cls.unlock(state);
            const v = nextVersion(state, cls.id);
            const name = modelName(state.family, cls, v);
            const days = Math.max(1, Math.ceil(cls.flopNeed / Math.max(0.08, d.trainPower)));
            if (!open) {
              return (
                <div key={cls.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-3 py-2.5 opacity-50">
                  <p className="text-sm text-muted">{name}</p>
                  <p className="font-mono text-xs text-subtle">Later</p>
                </div>
              );
            }
            return (
              <button
                key={cls.id}
                type="button"
                disabled={!!state.training}
                onClick={() => train(cls.id as ModelClassId)}
                className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-elevated px-4 text-left disabled:opacity-40"
              >
                <span className="font-display text-lg italic">{name}</span>
                <span className="font-mono text-xs text-subtle">~{days}d</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ClusterPanel({ state }: { state: GameState }) {
  const buy = useGame((s) => s.buyGpu);
  const d = derive(state);
  const inbound = state.gpuOrders.reduce((a, o) => a + o.qty, 0);
  const mini = classById("mini");
  const max = classById("max");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Tile k="B200-eq" v={d.b200eq.toFixed(1)} sub={`${state.gpus.h100} H100 · ${state.gpus.b200} B200 · ${state.gpus.gb200} GB`} />
        <Tile k="Serve util" v={pct(Math.min(140, d.utilProd * 100))} sub={`${Math.round(d.latencyMs)} ms`} warn={d.utilProd > 1} />
        <Tile k="8B users" v={compact(Math.round(d.usersFitMini))} sub={`${compact(Math.round(d.liveCapMini))} live`} />
      </div>

      <GpuSplit state={state} />

      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="kicker">What this Serve pool holds</p>
        <p className="mt-2 text-sm text-muted">
          Peak live is ~2% of daily actives. A B200 is the unit. Engineers raise both numbers.
        </p>
        <div className="mt-3 space-y-2">
          {[mini, classById("small"), max, classById("ultra")].map((cls) => {
            const live = d.prodB200 * cls.concurrentPerB200;
            const users = live * (chatUsersPerB200(cls) / cls.concurrentPerB200);
            return (
              <div key={cls.id} className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-paper">{cls.params} chat</span>
                <span className="font-mono text-xs tabular text-muted">
                  {compact(Math.round(live))} live · {compact(Math.round(users))} users
                </span>
              </div>
            );
          })}
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="text-paper">8B API</span>
            <span className="font-mono text-xs tabular text-muted">{tokLabel(d.prodB200 * mini.tokPerSecPerB200)}</span>
          </div>
        </div>
        {d.idleTrain && (
          <p className="mt-3 text-xs text-warn">Train GPUs are idle — no job on the cluster.</p>
        )}
        {d.idleServe && (
          <p className="mt-3 text-xs text-warn">Serve GPUs are idle — launch Chat so traffic has somewhere to land.</p>
        )}
        {d.utilProd > 1 && (
          <p className="mt-3 text-xs text-danger">Over capacity. Users bounce. Buy cards or move more to Serve.</p>
        )}
      </div>

      <div>
        <p className="kicker">Buy silicon</p>
        <div className="mt-2 space-y-2">
          {GPU_SKUS.map((sku) => {
            const open = sku.unlock(state);
            const n = state.gpus[sku.id];
            const live8 = Math.round(livePerCard(sku, mini));
            const users8 = Math.round(chatUsersPerCard(sku, mini));
            const live70 = Math.round(livePerCard(sku, max));
            return (
              <div key={sku.id} className={`rounded-xl border p-4 ${open ? "border-border bg-elevated" : "border-border/50 opacity-50"}`}>
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-xl italic">{sku.name}</p>
                  <p className="font-mono text-sm tabular text-paper">{money(sku.price)}</p>
                </div>
                <p className="mt-1 text-sm text-muted">{sku.blurb}</p>
                <p className="mt-2 font-mono text-xs tabular text-subtle">
                  Own {n} · train ×{sku.train} · {live8} live 8B / {live70} live 70B · {compact(users8)} users · {sku.lead}d · {money(sku.powerDay)}/d
                </p>
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={!open || state.day < state.gpuShortageUntil}
                    onClick={() => buy(sku.id, 1)}
                    className="min-h-11 rounded-md bg-paper text-sm font-semibold text-ink disabled:opacity-40"
                  >
                    Order 1
                  </button>
                  <button
                    type="button"
                    disabled={!open || state.day < state.gpuShortageUntil || state.cash < sku.price * 8}
                    onClick={() => buy(sku.id, 8)}
                    className="min-h-11 rounded-md border border-border bg-surface text-sm disabled:opacity-40"
                  >
                    Node of 8
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {inbound > 0 && <p className="mt-2 text-sm text-accent">{inbound} cards inbound.</p>}
      </div>
    </div>
  );
}

export function StorePanel({ state }: { state: GameState }) {
  const advertise = useGame((s) => s.advertise);
  const setPrice = useGame((s) => s.setPrice);
  const d = derive(state);

  if (state.products.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-elevated p-4">
          <p className="kicker">How you make money</p>
          <p className="mt-2 font-display text-2xl italic leading-tight">Train. Open Chat. Cash comes in.</p>
          <ol className="mt-4 space-y-3">
            {[
              { n: "01", t: "Train", d: "Tap the glowing Lab. One button. Two days." },
              { n: "02", t: "Open Chat", d: "Thousands of users walk in. You bill them tonight." },
              { n: "03", t: "Advertise", d: "Cheap ads in Shop buy the next wave." },
            ].map((step) => (
              <li key={step.n} className="flex gap-3">
                <span className="font-mono text-xs text-accent">{step.n}</span>
                <span>
                  <span className="block text-sm text-paper">{step.t}</span>
                  <span className="block text-xs text-muted">{step.d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-xs text-subtle">Waitlist {compact(state.waitlist)}. Open Chat from Lab and the till starts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Tile k="Today" v={money(d.revenue)} sub={`${compact(state.users)} users`} good={d.revenue > 0} />
        <Tile k="Served" v={pct(d.servedFrac * 100)} sub={d.utilProd > 1 ? "Throttled — buy GPUs" : "Headroom"} warn={d.utilProd > 1} />
      </div>
      <p className="text-sm text-muted">
        Chat bills monthly. API bills tokens. Work bills seats. Price too high and conversion dies. Ads are how you fill it.
      </p>
      {state.products.map((p) => {
        const model = state.models.find((m) => m.id === p.modelId);
        const cls = classById(model?.classId ?? "mini");
        const unit = p.kind === "api" ? "/1M tok" : "/mo";
        const pay = productPayShare(state, p);
        const load = productLoad(state, p);
        const gpuPct = d.prodB200 > 0.01 ? load.b200 / d.prodB200 : 0;
        return (
          <div key={p.id} className="rounded-xl border border-border bg-elevated p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-display text-xl italic leading-tight">{p.name}</p>
              <p className="kicker">{p.kind === "enterprise" ? "work" : p.kind}</p>
            </div>
            <p className="mt-2 font-mono text-sm tabular text-paper">
              {compact(p.users)} users · {cls.params}
            </p>
            <p className="mt-1 text-xs text-muted">
              {p.kind === "api"
                ? `${tokLabel(load.tokPerSec)} · ${load.b200.toFixed(2)} B200 demand`
                : `${pct(pay * 100)} pay · ${load.b200.toFixed(2)} B200 · ${pct(Math.min(140, gpuPct * 100))} of Serve`}
            </p>
            <label className="mt-3 block text-sm text-muted">
              Price {p.kind === "api" ? `${p.price.toFixed(2)}` : money(p.price)} {unit}
              <input
                type="range"
                min={p.kind === "api" ? 0.15 : p.kind === "enterprise" ? 40 : 8}
                max={p.kind === "api" ? 12 : p.kind === "enterprise" ? 900 : 48}
                step={p.kind === "api" ? 0.05 : 1}
                value={p.price}
                onChange={(e) => setPrice(p.id, Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <p className="kicker mt-4">Advertise this product</p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {AD_PACKS.map((ad) => {
                const f = forecastAd(state, p.id, ad.id);
                return (
                  <button
                    key={ad.id}
                    type="button"
                    onClick={() => advertise(p.id, ad.id)}
                    className="rounded-md border border-border bg-surface px-3 py-2.5 text-left"
                  >
                    <span className="block text-sm text-paper">{ad.name}</span>
                    <span className="mt-0.5 block font-mono text-xs tabular text-subtle">
                      {money(ad.spend)} · +{compact(f?.users ?? ad.users)} users · {ad.days}d
                      {f ? ` · ~${money(f.extraRev)}/d` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            {p.adUntil > state.day && (
              <p className="mt-2 text-sm text-accent">
                Campaign live · {p.adUntil - state.day}d · +{compact(p.adDaily)}/d inbound
              </p>
            )}
          </div>
        );
      })}
      <p className="text-xs text-subtle">Waitlist {compact(state.waitlist)} — demos and ads convert them into paying users.</p>
    </div>
  );
}

export function CrewPanel({ state }: { state: GameState }) {
  const hire = useGame((s) => s.hire);
  const fire = useGame((s) => s.fire);
  const d = derive(state);
  const cap = headcountCap(d.stage);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        {state.employees.length}/{cap} seats · morale {Math.round(state.morale)}. Researchers cut training days. Cluster engineers raise tokens per watt. Growth and sales fill Sell.
      </p>
      <p className="font-mono text-xs tabular text-subtle">
        Train clock {d.researcherMul.toFixed(2)}× research · {d.engineerMul.toFixed(2)}× engineers
      </p>
      <div className="flex flex-wrap gap-1.5">
        {state.employees.map((e) => (
          <div key={e.id} className="flex items-center gap-2 rounded-full border border-border bg-elevated py-1 pl-1 pr-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-paper font-display text-sm italic text-ink">
              {e.name.slice(0, 1)}
            </span>
            <span className="text-xs">{e.name.split(" ")[0]}</span>
            {e.id !== "founder" && (
              <button type="button" onClick={() => fire(e.id)} className="text-xs text-danger">
                Out
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => hire(r.id)}
            className="rounded-xl border border-border bg-elevated p-4 text-left"
          >
            <p className="text-sm font-medium text-paper">{r.name}</p>
            <p className="mt-1 text-xs leading-snug text-muted">{r.blurb}</p>
            <p className="mt-2 font-mono text-xs tabular text-subtle">
              {money(r.signing)} in · {money(r.salaryMo)}/mo
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ShadowPanel({ state }: { state: GameState }) {
  const steal = useGame((s) => s.steal);
  const fake = useGame((s) => s.fake);
  const farm = useGame((s) => s.farm);
  const pivot = useGame((s) => s.pivot);
  const latest = state.models[state.models.length - 1];
  const tape = MARKET_COPY[state.market];

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="font-display text-2xl italic">{tape.title}</p>
        <p className="mt-1 text-sm text-muted">{tape.line}</p>
        <p className="mt-2 font-mono text-xs text-subtle">{state.marketDaysLeft}d left</p>
      </div>
      {state.competitors.map((c) => (
        <div key={c.id} className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2.5">
          <span className="text-sm">{c.name}</span>
          <span className="font-mono text-xs tabular text-accent">{money(c.valuation)}</span>
        </div>
      ))}
      <div className="grid grid-cols-1 gap-2">
        <Act title="Steal a paper" meta="Related work, very related." onClick={steal} />
        <Act title="Fake a benchmark" meta={latest ? `SOTA on ${latest.name}` : "Train first"} onClick={() => latest && fake(latest.id)} />
        <Act title="Farm the waitlist" meta={`${money(7500)} · mostly bots`} onClick={farm} />
        <Act title="Pivot" meta={state.day - state.lastPivotDay < 90 ? "Not yet" : "New thesis. Same GPUs."} onClick={pivot} />
      </div>
      <p className="font-mono text-xs text-subtle">
        Scandal {Math.round(state.scandal)} · heat {Math.round(state.heat)} · karma {Math.round(state.evil)}
      </p>
    </div>
  );
}

function Tile({
  k,
  v,
  sub,
  warn,
  good,
}: {
  k: string;
  v: string;
  sub?: string;
  warn?: boolean;
  good?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-elevated p-3">
      <p className="kicker">{k}</p>
      <p className={`mt-1 font-display text-2xl italic leading-tight ${warn ? "text-danger" : good ? "text-good" : "text-paper"}`}>
        {v}
      </p>
      {sub && <p className="mt-1.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Bar({ label, frac, ok }: { label: string; frac: number; ok?: boolean }) {
  const w = Math.max(0, Math.min(1, frac));
  return (
    <div>
      <p className="mb-1 font-mono text-xs text-muted">{label}</p>
      <div className="util-track">
        <div className={`util-fill ${ok ? "" : "is-paper"}`} style={{ width: `${w * 100}%` }} />
      </div>
    </div>
  );
}

function Act({ title, meta, onClick }: { title: string; meta: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-md border border-border bg-elevated px-3 py-2.5 text-left">
      <span className="block text-sm text-paper">{title}</span>
      <span className="block text-xs text-subtle">{meta}</span>
    </button>
  );
}

export { skuById, roleById };
