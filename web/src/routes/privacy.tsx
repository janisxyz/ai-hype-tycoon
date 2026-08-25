import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({ component: Privacy });

function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-fg">
      <p className="font-mono text-xs tracking-[0.18em] text-muted uppercase">Legal</p>
      <h1 className="mt-3 font-display text-4xl italic">Privacy</h1>
      <p className="mt-6 text-muted">
        AI Hype Tycoon is a single-player satire. Progress is stored on this device only. There are no
        accounts, no analytics SDKs, no ads, and no third-party trackers in the game itself.
      </p>
      <p className="mt-4 text-muted">
        If you install the Android build, the app does not request location, contacts, or network
        identity beyond what the OS needs to run. Saves never leave the phone.
      </p>
      <p className="mt-8">
        <Link to="/" className="text-paper underline-offset-4 hover:underline">
          Back to the garage
        </Link>
      </p>
    </main>
  );
}
