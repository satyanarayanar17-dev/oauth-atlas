"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Globe2,
  LoaderCircle,
  Sparkles,
  X,
} from "lucide-react";
import type { Guide, ResearchTrace } from "@/lib/types";
import { isGuide } from "@/lib/guide-export";

export default function ResearchDialog({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (guide: Guide, trace: ResearchTrace[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [intent, setIntent] = useState("");
  const [mode, setMode] = useState<string>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialog.current?.showModal();
    fetch("/api/research")
      .then((r) => r.json() as Promise<{ mode: string }>)
      .then((data) => setMode(data.mode))
      .catch(() => setMode("source-scan"));
    return () => controller.current?.abort();
  }, []);

  async function investigate(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    controller.current = new AbortController();
    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), intent: intent.trim() }),
        signal: controller.current.signal,
      });
      const result = (await response.json()) as {
        guide?: unknown;
        trace?: ResearchTrace[];
        error?: string | { message?: string };
      };
      if (!response.ok)
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : result.error?.message ||
              "The provider could not be investigated. Try its official developer documentation URL.",
        );
      if (!isGuide(result.guide))
        throw new Error(
          "The researcher returned an incomplete guide. Please retry with an official documentation URL.",
        );
      onComplete(result.guide, result.trace ?? []);
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="modal research-modal"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === dialog.current && !busy) onClose();
      }}
    >
      <button
        aria-label="Close research dialog"
        className="icon-button modal-close"
        onClick={onClose}
      >
        <X size={20} />
      </button>
      <div className="modal-symbol">
        <Sparkles size={23} />
      </div>
      <div className="eyebrow">EXPAND YOUR FIELD GUIDE</div>
      <h2>
        Where do you want
        <br />
        to connect next?
      </h2>
      <p className="modal-lede">
        Start with an app name or its website. We’ll investigate the OAuth path
        and make the evidence shareable.
      </p>
      <form onSubmit={investigate}>
        <label htmlFor="research-query">App name or official website</label>
        <div className="research-input">
          <Globe2 size={19} />
          <input
            id="research-query"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Notion or developers.notion.com"
            required
            maxLength={240}
            disabled={busy}
          />
        </div>
        <label htmlFor="research-intent">
          What will your agent do? <span>Optional</span>
        </label>
        <textarea
          id="research-intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g. Read pages selected by the user, for customers outside my workspace"
          maxLength={600}
          rows={2}
          disabled={busy}
        />
        <div className="research-mode">
          <span className="dot" />
          <strong>
            {mode === "agent"
              ? "Web research agent"
              : mode === "loading"
                ? "Checking research connection…"
                : "Live source investigator"}
          </strong>
          <span>
            {mode === "agent"
              ? "Live research + cited sources"
              : "Limited research mode"}
          </span>
        </div>
        {mode === "source-scan" && (
          <p className="research-disclosure">
            This mode reads official pages live and extracts relevant passages.
            It leaves timing and approval conclusions unverified. Add a
            hosted model connection for full agent synthesis.
          </p>
        )}
        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}
        {busy && (
          <div className="research-working" role="status">
            <LoaderCircle size={19} className="spin" />
            <div>
              <strong>Investigating public sources…</strong>
              <span>
                Checking public documentation. No accounts are created.
              </span>
            </div>
          </div>
        )}
        <button
          className="button primary research-submit"
          type="submit"
          disabled={busy || !query.trim()}
        >
          {busy ? "Research in progress" : "Investigate this app"}
          {busy ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <ArrowRight size={17} />
          )}
        </button>
      </form>
      <div className="research-promises">
        <span>
          <Check size={13} /> Real source links
        </span>
        <span>
          <Check size={13} /> Explicit unknowns
        </span>
        <span>
          <Check size={13} /> Shareable result
        </span>
      </div>
    </dialog>
  );
}
