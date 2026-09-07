import { X } from "lucide-react";
import { Drawer } from "vaul";
import type { GameState, TabId } from "@/game/types";
import { ClusterPanel, CrewPanel, FloorPanel, LabPanel, ShadowPanel, StorePanel } from "./panels";

const COPY: Record<TabId, { title: string; kicker: string }> = {
  lab: { title: "The lab", kicker: "Train · open Chat" },
  cluster: { title: "The cluster", kicker: "GPUs · train / serve" },
  store: { title: "The till", kicker: "Ads · price · cash" },
  crew: { title: "The people", kicker: "Hire · fire · morale" },
  floor: { title: "Headquarters", kicker: "Raise · burn · board" },
  shadow: { title: "The other room", kicker: "Rivals · dark ops" },
};

export function ActionSheet({
  tab,
  open,
  state,
  onClose,
}: {
  tab: TabId;
  open: boolean;
  state: GameState;
  onClose: () => void;
}) {
  const copy = COPY[tab];
  return (
    <Drawer.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/25" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[78dvh] w-full max-w-2xl flex-col rounded-t-xl border border-border bg-surface shadow-sheet outline-none">
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border-strong" />
          <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-3">
            <div>
              <p className="kicker">{copy.kicker}</p>
              <Drawer.Title className="font-display text-2xl italic leading-tight text-paper">{copy.title}</Drawer.Title>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-elevated text-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {tab === "lab" && <LabPanel state={state} />}
            {tab === "cluster" && <ClusterPanel state={state} />}
            {tab === "store" && <StorePanel state={state} />}
            {tab === "crew" && <CrewPanel state={state} />}
            {tab === "floor" && <FloorPanel state={state} />}
            {tab === "shadow" && <ShadowPanel state={state} />}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
