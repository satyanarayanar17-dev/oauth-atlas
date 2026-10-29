"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileCheck2,
  Link2,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { Guide } from "@/lib/types";
import { guideMarkdown, safeLink, shareUrl } from "@/lib/guide-export";

export function ProviderMark({
  id,
  small = false,
}: {
  id: string;
  small?: boolean;
}) {
  const brands: Record<string, string> = {
    github: "/brands/github.svg",
    slack: "/brands/slack.svg",
    "google-drive": "/brands/google-drive.png",
  };
  return (
    <span className={`provider-mark ${small ? "small" : ""}`}>
      {brands[id] ? (
        <img src={brands[id]} alt="" />
      ) : (
        <LockKeyhole size={small ? 18 : 26} />
      )}
    </span>
  );
}

export default function GuideDetail({
  guide,
  onToast,
}: {
  guide: Guide;
  onToast: (text: string) => void;
}) {
  const [tab, setTab] = useState("overview");
  const [completed, setCompleted] = useState<string[]>([]);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    setTab(guide.researchMode === "source-scan" ? "setup" : "overview");
    try {
      const stored = JSON.parse(
        localStorage.getItem(`atlas-progress:${guide.id}`) || "[]",
      );
      setCompleted(
        Array.isArray(stored)
          ? stored.filter((s) => typeof s === "string")
          : [],
      );
    } catch {
      setCompleted([]);
    }
  }, [guide.id]);

  function toggleStep(id: string) {
    const next = completed.includes(id)
      ? completed.filter((s) => s !== id)
      : [...completed, id];
    setCompleted(next);
    try {
      localStorage.setItem(`atlas-progress:${guide.id}`, JSON.stringify(next));
    } catch {
      onToast("Progress could not be saved in this browser.");
    }
  }

  async function copyLink() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(await shareUrl(guide));
      onToast("Guide link copied. Your checklist stays private.");
    } catch {
      onToast("Could not copy a link. Use Export to save the full guide.");
    } finally {
      setCopying(false);
    }
  }

  function downloadGuide() {
    const url = URL.createObjectURL(
      new Blob([guideMarkdown(guide)], { type: "text/markdown" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${guide.id}-oauth-guide.md`;
    anchor.click();
    URL.revokeObjectURL(url);
    onToast("Markdown guide exported.");
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "setup", label: "Setup checklist", count: guide.steps.length },
    { id: "blockers", label: "Blockers", count: guide.blockers.length },
    { id: "evidence", label: "Evidence", count: guide.sources.length },
  ];
  const sourceLinks = (ids: string[]) => (
    <span className="source-refs">
      {ids.map((id) => {
        const source = guide.sources.find((s) => s.id === id);
        return source && safeLink(source.url) ? (
          <a
            key={id}
            href={safeLink(source.url)}
            target="_blank"
            rel="noreferrer"
            title={source.title}
          >
            [{guide.sources.indexOf(source) + 1}]
          </a>
        ) : null;
      })}
    </span>
  );

  return (
    <article className="guide-panel" aria-label={`${guide.name} OAuth guide`}>
      <div className="guide-toolbar">
        <span className="breadcrumb">
          Library <ChevronRight size={13} /> <span>{guide.name}</span>
        </span>
        <div className="toolbar-actions">
          <button className="quiet-button" onClick={downloadGuide}>
            <ArrowDownToLine size={15} /> Export
          </button>
          <button
            className="button secondary share-button"
            disabled={copying}
            onClick={copyLink}
          >
            <Link2 size={15} /> {copying ? "Copying…" : "Share guide"}
          </button>
        </div>
      </div>
      <div className="guide-heading">
        <ProviderMark id={guide.id} />
        <div>
          <div className="eyebrow">
            {guide.category} <span> / OAUTH 2.0</span>
          </div>
          <h2>{guide.name}</h2>
        </div>
        <span
          className={`status-pill ${guide.difficulty === "Straightforward" ? "green" : guide.difficulty === "Needs investigation" ? "gray" : "amber"}`}
        >
          <span />
          {guide.difficulty}
        </span>
      </div>
      <p className="guide-summary">{guide.summary}</p>
      <div className="guide-meta">
        <span>
          <ShieldCheck size={14} />
          {guide.generated
            ? guide.researchMode === "agent"
              ? "Agent research · review before use"
              : "Live source scan · needs review"
            : "Sources checked"}
        </span>
        <span className="meta-divider" />
        Checked {guide.updatedAt}
      </div>
      <div className="tabs" role="tablist" aria-label="Guide sections">
        {tabs.map((t) => (
          <button
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            key={t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.count !== undefined && <span>{t.count}</span>}
          </button>
        ))}
      </div>
      <section
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="tab-content"
        key={tab}
      >
        {tab === "overview" && (
          <>
            <div className="timeline-metrics">
              <div>
                <div className="metric-label">
                  <Clock3 size={15} /> YOUR HANDS-ON WORK
                </div>
                <strong>{guide.setupTime}</strong>
                <span>
                  {guide.difficulty === "Needs investigation"
                    ? "Awaiting evidence"
                    : "Planning estimate"}
                </span>
              </div>
              <div>
                <div className="metric-label">
                  <FileCheck2 size={15} /> PROVIDER WAIT
                </div>
                <strong>{guide.waitTime}</strong>
                <span>Depends on your launch path</span>
              </div>
            </div>
            <p className="time-note">{guide.timeNote}</p>
            <div className="launch-path">
              <div className="section-label">
                <span className="dot" /> THE LAUNCH PATH
              </div>
              <p>{guide.review}</p>
              <div className="path-track">
                <span>
                  <i>1</i> Register your app
                </span>
                <ChevronRight size={14} />
                <span>
                  <i>2</i> Test a connection
                </span>
                <ChevronRight size={14} />
                <span>
                  <i>3</i> Clear launch gates
                </span>
              </div>
            </div>
            <section className="scope-section">
              <div className="section-heading">
                <LockKeyhole size={17} />
                <h3>Choose scopes before you estimate</h3>
              </div>
              <p>{guide.scopeNote}</p>
              <div className="scope-chips">
                {guide.recommendedScopes.map((scope) => (
                  <code key={scope}>{scope}</code>
                ))}
              </div>
            </section>
            <section>
              <div className="section-heading">
                <ListChecks size={18} />
                <h3>Have these ready</h3>
              </div>
              <ul className="prerequisite-list">
                {guide.prerequisites.map((p) => (
                  <li key={p}>
                    <Check size={14} />
                    {p}
                  </li>
                ))}
              </ul>
            </section>
            <div className="handoff-grid">
              <div>
                <div className="section-heading">
                  <Sparkles size={17} />
                  <h3>An agent can help</h3>
                </div>
                <ul>
                  {guide.agentCan.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="section-heading">
                  <UserRound size={17} />
                  <h3>You take over</h3>
                </div>
                <ul>
                  {guide.humanMust.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
            <button className="next-step" onClick={() => setTab("setup")}>
              <span>
                <span className="eyebrow">YOUR NEXT STEP</span>
                <strong>
                  {guide.steps.find((s) => !completed.includes(s.id))?.title ||
                    "Review your completed setup"}
                </strong>
              </span>
              <span className="round-arrow">
                <ChevronRight size={19} />
              </span>
            </button>
          </>
        )}
        {tab === "setup" && (
          <>
            <div className="checklist-header">
              <div>
                <h3>From registration to your first connection</h3>
                <p>Track your progress. Saved in this browser only.</p>
              </div>
              <span>
                {
                  completed.filter((id) => guide.steps.some((s) => s.id === id))
                    .length
                }
                /{guide.steps.length}
              </span>
            </div>
            <div className="progress-track">
              <span
                style={{
                  width: `${guide.steps.length ? (completed.filter((id) => guide.steps.some((s) => s.id === id)).length / guide.steps.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="step-list">
              {guide.steps.map((step, i) => (
                <div
                  className={`setup-step ${completed.includes(step.id) ? "complete" : ""}`}
                  key={step.id}
                >
                  <button
                    aria-label={`${completed.includes(step.id) ? "Uncheck" : "Complete"} ${step.title}`}
                    aria-pressed={completed.includes(step.id)}
                    className="step-check"
                    onClick={() => toggleStep(step.id)}
                  >
                    {completed.includes(step.id) ? <Check size={16} /> : i + 1}
                  </button>
                  <div>
                    <div className="step-title">
                      <h4>{step.title}</h4>
                      <span className="owner-label">
                        {step.owner === "developer"
                          ? "YOU"
                          : step.owner.toUpperCase()}
                      </span>
                    </div>
                    <p>
                      {step.detail} {sourceLinks(step.sourceIds)}
                    </p>
                    <div className="step-bottom">
                      <span className={`evidence-label ${step.evidence}`}>
                        {step.evidence === "documented"
                          ? guide.researchMode === "source-scan"
                            ? "Source retrieved · identity not verified"
                            : "Source-backed guidance"
                          : step.evidence === "estimate"
                            ? "Planning estimate"
                            : "Needs verification"}
                      </span>
                      {safeLink(step.actionUrl) && (
                        <a
                          href={safeLink(step.actionUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open provider <ArrowUpRight size={13} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="inline-note">
              <LockKeyhole size={16} />
              <p>
                Keep client secrets in your backend or integration platform’s
                secret store. This checklist does not request or store
                credentials.
              </p>
            </div>
          </>
        )}
        {tab === "blockers" && (
          <>
            <div className="section-intro">
              <TriangleAlert size={20} />
              <div>
                <h3>Know what could slow you down</h3>
                <p>Every blocker comes with a practical next move.</p>
              </div>
            </div>
            <div className="blocker-list">
              {guide.blockers.map((b, i) => (
                <section className="blocker" key={b.title}>
                  <span className="blocker-number">0{i + 1}</span>
                  <div>
                    <h4>{b.title}</h4>
                    <p>
                      {b.detail} {sourceLinks(b.sourceIds)}
                    </p>
                    <div className="resolution">
                      <span>NEXT MOVE</span>
                      <p>{b.resolution}</p>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
        {tab === "evidence" && (
          <>
            <div className="section-intro">
              <ShieldCheck size={21} />
              <div>
                <h3>Trust the source. Know the gaps.</h3>
                <p>
                  Documentation supports a requirement; a completed setup
                  verifies a flow.
                </p>
              </div>
            </div>
            {guide.validation.correction && (
              <div className="correction">
                <span className="eyebrow">WHAT CHANGED AFTER CHECKING</span>
                <p>{guide.validation.correction}</p>
              </div>
            )}
            <div className="validation-grid">
              <section>
                <h4>
                  <CheckCheck size={16} /> What we checked
                </h4>
                <ul>
                  {guide.validation.checked.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h4>
                  <TriangleAlert size={16} /> Still unverified
                </h4>
                <ul>
                  {guide.validation.notChecked.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>
            </div>
            <h3 className="sources-heading">
              Source register <span>{guide.sources.length} sources</span>
            </h3>
            <div className="source-list">
              {guide.sources.map((s, i) => (
                <a
                  key={s.id}
                  href={safeLink(s.url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="source-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{s.title}</strong>
                    <small>
                      {s.url.replace(/^https?:\/\//, "").split("/")[0]} ·
                      checked {s.checkedAt}
                    </small>
                  </span>
                  <ExternalLink size={15} />
                </a>
              ))}
            </div>
          </>
        )}
      </section>
      <footer className="guide-footer">
        <span>OAUTH ATLAS / FIELD NOTES</span>
        <span>
          Requirements change. Recheck before launch. <ArrowUpRight size={11} />
        </span>
      </footer>
    </article>
  );
}
