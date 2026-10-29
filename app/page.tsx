"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Compass,
  Code2,
  Layers3,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import GuideDetail, { ProviderMark } from "@/components/guide-detail";
import ResearchDialog from "@/components/research-dialog";
import { guides } from "@/lib/guides";
import type { Guide, ResearchTrace } from "@/lib/types";
import { isGuide, readSharedGuide } from "@/lib/guide-export";

export default function Home() {
  const [library, setLibrary] = useState<Guide[]>(guides);
  const [selected, setSelected] = useState("github");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All guides");
  const [researchOpen, setResearchOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [trace, setTrace] = useState<ResearchTrace[]>([]);
  const [traceOpen, setTraceOpen] = useState(false);
  const [traceGuideId, setTraceGuideId] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const about = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);

  function notify(message: string) {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4200);
  }
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("atlas-generated-guides") || "[]",
      );
      if (Array.isArray(saved))
        setLibrary([
          ...guides,
          ...saved
            .filter(isGuide)
            .filter((s: Guide) => !guides.some((g) => g.id === s.id)),
        ]);
    } catch {
      /* A blocked storage policy should not stop the library. */
    }
    const id = new URLSearchParams(window.location.search).get("guide");
    if (id) setSelected(id);
    readSharedGuide()
      .then((shared) => {
        if (shared) {
          setLibrary((current) => [
            ...current.filter((g) => g.id !== shared.id),
            shared,
          ]);
          setSelected(shared.id);
          notify(
            "Opened a shared research guide. Check its evidence before use.",
          );
        }
      })
      .catch((error) => notify(error.message));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(() => {
    if (aboutOpen) about.current?.showModal();
  }, [aboutOpen]);
  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (
        event.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) &&
        !researchOpen &&
        !aboutOpen
      ) {
        event.preventDefault();
        search.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, [researchOpen, aboutOpen]);

  function selectGuide(id: string) {
    setSelected(id);
    setTraceOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("guide", id);
    url.hash = "";
    window.history.replaceState({}, "", url);
  }
  function addGuide(guide: Guide, researchTrace: ResearchTrace[]) {
    const next = [...library.filter((g) => g.id !== guide.id), guide];
    setLibrary(next);
    setSelected(guide.id);
    setResearchOpen(false);
    setFilter("All guides");
    setQuery("");
    setTrace(researchTrace);
    setTraceGuideId(guide.id);
    setTraceOpen(true);
    try {
      localStorage.setItem(
        "atlas-generated-guides",
        JSON.stringify(next.filter((g) => g.generated)),
      );
    } catch {
      notify(
        "Guide created. Export it to keep a copy; browser storage is full.",
      );
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("guide");
    url.hash = "";
    window.history.replaceState({}, "", url);
  }

  const currentGuide = library.find((g) => g.id === selected) || library[0];
  const filtered = library.filter(
    (g) =>
      `${g.name} ${g.category} ${g.domain}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All guides" ||
        (filter === "Quick start"
          ? g.difficulty === "Straightforward"
          : filter === "Review involved"
            ? ["Conditional review", "Significant review"].includes(
                g.difficulty,
              )
            : g.generated)),
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="OAuth Atlas home">
          <Compass size={28} strokeWidth={1.6} />
          <span>
            oauth<span className="wordmark-light">atlas</span>
            <span className="wordmark-period">.</span>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#library" className="active-nav">
            <BookOpen size={15} /> Guide library
          </a>
          <button onClick={() => setAboutOpen(true)}>
            How it works <ArrowUpRight size={13} />
          </button>
        </nav>
        <div className="topbar-right">
          <span className="preview-label">TAKE-HOME EDITION</span>
          <a
            className="source-link"
            href="https://github.com/satyanarayanar17-dev/oauth-atlas"
            target="_blank"
            rel="noreferrer"
          >
            <Code2 size={17} />
            <span>Source code</span>
            <ArrowUpRight size={12} />
          </a>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="dot" /> THE PATH FROM BUILDING TO CONNECTED
            </div>
            <h1>
              OAuth setup.
              <br />
              <span>Minus the guesswork.</span>
            </h1>
            <p>
              Know the work, the wait, and the roadblocks before
              <br className="desktop-break" /> your users hit “Connect.”
            </p>
          </div>
          <div className="hero-aside">
            <span className="field-note-label">
              A FIELD GUIDE FOR AGENT BUILDERS
            </span>
            <div className="hero-flow">
              <div>
                <span>01</span>Find your app
              </div>
              <ChevronRight />
              <div>
                <span>02</span>Map the path
              </div>
              <ChevronRight />
              <div>
                <span>03</span>Make progress
              </div>
            </div>
            <p>
              Official sources. Practical next steps.
              <br />A clear handoff between you and your agent.
            </p>
            <button onClick={() => setAboutOpen(true)}>
              Understand the OAuth pieces <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
        <section className="workspace" id="library" aria-label="Guide library">
          <aside className="library-sidebar">
            <div className="library-heading">
              <h2>Your next integration</h2>
              <span>{library.length}</span>
            </div>
            <div className="library-search">
              <Search size={17} />
              <input
                ref={search}
                aria-label="Search app guides"
                placeholder="Find an app…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <kbd>/</kbd>
            </div>
            <div className="library-filter">
              <label className="sr-only" htmlFor="library-filter">
                Filter guides
              </label>
              <select
                id="library-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>All guides</option>
                <option>Quick start</option>
                <option>Review involved</option>
                <option>Live research</option>
              </select>
              <ChevronDown size={13} />
            </div>
            <div className="library-list">
              {filtered.map((g) => (
                <button
                  className={`library-item ${selected === g.id ? "selected" : ""}`}
                  key={g.id}
                  onClick={() => selectGuide(g.id)}
                >
                  <ProviderMark id={g.id} small />
                  <span>
                    <strong>{g.name}</strong>
                    <small>
                      <i
                        className={
                          g.difficulty === "Straightforward"
                            ? "green-dot"
                            : g.difficulty === "Needs investigation"
                              ? "gray-dot"
                              : "amber-dot"
                        }
                      />
                      {g.difficulty === "Straightforward"
                        ? "Start building today"
                        : g.difficulty === "Needs investigation"
                          ? "Research draft"
                          : "Plan for review"}
                    </small>
                  </span>
                  <ChevronRight size={16} />
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="empty-state">
                  <Search size={22} />
                  <strong>No matching guides yet</strong>
                  <p>Investigate this app to add a guide.</p>
                  <button onClick={() => setResearchOpen(true)}>
                    Research an app <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
            <button
              className="add-app-button"
              onClick={() => setResearchOpen(true)}
            >
              <Plus size={17} /> Investigate a new app
            </button>
            <div className="sidebar-note">
              <span className="mini-label">SMALL LIBRARY. OPEN HORIZON.</span>
              <p>
                Three carefully checked starting points. Research another app in
                real time.
              </p>
              <span className="mini-rule" />
            </div>
            <div className="legend">
              <span>
                <i className="green-dot" /> Straightforward setup
              </span>
              <span>
                <i className="amber-dot" /> Approval or scope decisions
              </span>
              <span>
                <i className="gray-dot" /> Further verification needed
              </span>
            </div>
          </aside>
          <div className="guide-column">
            {trace.length > 0 && currentGuide.id === traceGuideId && (
              <div className="research-receipt">
                <button onClick={() => setTraceOpen(!traceOpen)}>
                  <span>
                    <Sparkles size={15} /> Investigation complete ·{" "}
                    {trace.filter((t) => t.status === "done").length} checks
                    recorded
                  </span>
                  <ChevronDown size={15} />
                </button>
                {traceOpen && (
                  <ul>
                    {trace.map((t, i) => (
                      <li key={i}>
                        <Check size={13} />
                        <span>
                          <strong>{t.label}</strong> {t.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <GuideDetail guide={currentGuide} onToast={notify} />
          </div>
        </section>
        <section className="bottom-note">
          <ShieldCheck size={17} />
          <p>Built on evidence, with the unknowns left visible.</p>
          <span>Setup estimates are guidance, not provider guarantees.</span>
        </section>
      </main>
      <footer className="site-footer">
        <span>
          <Compass size={16} /> OAuth Atlas
        </span>
        <span>
          A focused working slice · 3 curated guides + live investigation
        </span>
        <button onClick={() => setAboutOpen(true)}>
          About this project <ArrowUpRight size={12} />
        </button>
      </footer>
      {researchOpen && (
        <ResearchDialog
          onClose={() => setResearchOpen(false)}
          onComplete={addGuide}
        />
      )}
      {aboutOpen && (
        <dialog
          className="modal about-modal"
          ref={about}
          onCancel={(e) => {
            e.preventDefault();
            setAboutOpen(false);
          }}
          onClick={(e) => {
            if (e.target === about.current) setAboutOpen(false);
          }}
        >
          <button
            className="icon-button modal-close"
            aria-label="Close explanation"
            onClick={() => setAboutOpen(false)}
          >
            <X size={20} />
          </button>
          <div className="eyebrow">THREE PIECES, ONE CONNECTION</div>
          <h2>
            Your app is the passport.
            <br />
            OAuth is the permission.
          </h2>
          <p className="modal-lede">
            A provider OAuth app identifies your integration. Every user still
            chooses whether to connect their own account.
          </p>
          <div className="concept-steps">
            <div>
              <span>01</span>
              <section>
                <h3>Register with the provider</h3>
                <p>
                  Your team creates one OAuth app: client ID, redirect URLs,
                  requested scopes, and sometimes a review.
                </p>
              </section>
            </div>
            <div>
              <span>02</span>
              <section>
                <h3>Wire it into your integration</h3>
                <p>
                  Your backend or integration platform handles the callback,
                  token exchange, storage, and refresh. Keep secrets
                  server-side.
                </p>
              </section>
            </div>
            <div>
              <span>03</span>
              <section>
                <h3>Each user grants access</h3>
                <p>
                  “Connect” opens the provider’s consent screen. The resulting
                  tokens belong to that user’s connection; registration alone
                  does not grant access.
                </p>
              </section>
            </div>
          </div>
          <div className="managed-note">
            <Layers3 size={20} />
            <div>
              <h3>You might not need your own OAuth app</h3>
              <p>
                A managed app can cover registration and credentials. Check
                availability and scopes first. Bring your own for unsupported
                apps, branding, or different permissions.
              </p>
              <a
                href="https://docs.composio.dev/toolkits/managed-auth"
                target="_blank"
                rel="noreferrer"
              >
                Check the managed OAuth directory <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
          <p className="about-limit">
            This experience researches setup. It does not collect credentials,
            register provider apps, or complete approval on your behalf. The
            Evidence tab records the actual checks and their limits.
          </p>
        </dialog>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
