"use client";

type KeyboardHelpProps = {
  open: boolean;
  onClose: () => void;
};

export function KeyboardHelp({ open, onClose }: KeyboardHelpProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-xs text-zinc-200 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-50">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-600 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]"
          >
            Esc
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <Shortcut k="↑ / ↓" label="Move between articles" />
          <Shortcut k="⇧↑ / ⇧↓" label="Jump 5 articles" />
          <Shortcut k="⌘⏎" label="Open article in new tab" />
          <Shortcut k="⌘C" label="Copy article URL" />
          <Shortcut k="⌘⌫" label="Delete article" />
          <Shortcut k="x" label="Toggle mark as read" />
          <Shortcut k="t" label="Open source tweet" />
          <Shortcut k="?" label="Toggle this help" />
        </dl>
      </div>
    </div>
  );
}

function Shortcut({ k, label }: { k: string; label: string }) {
  return (
    <>
      <dt className="font-mono text-[11px] text-zinc-400">{k}</dt>
      <dd className="text-[11px] text-zinc-200">{label}</dd>
    </>
  );
}

