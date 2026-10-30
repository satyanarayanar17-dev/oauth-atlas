import type { Guide, GuideStep } from "../types";
import type { ResearchPage } from "./sources.ts";

const checkedAt = "2026-10-31";

function activeIntent(intent: string) {
  return intent.toLowerCase().replace(
    /\b(?:no|without|do not|don't|not using)\b(?:(?!\bbut\b|\bhowever\b)[^.;])*/g,
    " ",
  );
}

export function isReadOnlyIntent(intent: string) {
  const active = activeIntent(intent);
  const reads = /\b(?:read|retrieve|view|list|fetch)\b/.test(active);
  const changes = /\b(?:write|create|post|edit|update|delete|remove|cancel|manage|administer|invite|publish)\b/.test(active);
  return reads && !changes;
}

function containsScope(text: string, scope: string) {
  const escaped = scope.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^A-Za-z0-9_:/.-])${escaped}(?![A-Za-z0-9_:/-]|\\.[A-Za-z0-9_])`).test(text);
}

function changesData(scope: string) {
  return /(?:^|[:/._-])(?:write|admin|manage|delete|create|edit|update|remove|readwrite|full_control)(?:$|[:/._-])/.test(scope.toLowerCase());
}

// Literal presence is a useful rejection check, not proof of scope eligibility.
export function checkGuideScopes(guide: Guide, pages: ResearchPage[], intent: string): Guide {
  const sourceText = pages.map((page) => page.text).join("\n");
  const readOnly = isReadOnlyIntent(intent);
  const rejected: string[] = [];
  const scopes: string[] = [];
  for (const scope of guide.recommendedScopes) {
    if (!containsScope(sourceText, scope) || (readOnly && changesData(scope))) {
      rejected.push(scope);
    } else if (!scopes.includes(scope)) {
      scopes.push(scope);
    }
  }
  if (!rejected.length) return guide;

  const steps = guide.steps.map((step) => {
    if (!rejected.some((scope) => step.detail.includes(scope))) return step;
    return {
      ...step,
      title: "Confirm the minimum scopes before requesting consent",
      detail: "Some draft permissions failed the source or read-only checks and were removed. Match each intended endpoint to the provider's scope documentation, then request only the confirmed scopes. The remaining list is provisional; do not treat identifier presence as proof of eligibility.",
      evidence: "unverified" as const,
    };
  });
  return {
    ...guide,
    recommendedScopes: scopes,
    scopeNote: "Some draft permissions were removed because they were absent from the retrieved documentation or conflicted with the read-only request. The remaining identifiers occur in the retrieved text, but their necessity and account eligibility still need endpoint-level confirmation.",
    steps,
    blockers: guide.blockers.filter((blocker) => !rejected.some((scope) =>
      `${blocker.detail} ${blocker.resolution}`.includes(scope),
    )),
    validation: {
      ...guide.validation,
      checked: [...guide.validation.checked, "Rejected unsupported scope identifiers and obvious write/admin permissions for the read-only request."],
      notChecked: [...guide.validation.notChecked, `Removed draft permissions: ${rejected.join(", ")}. Literal source occurrence does not establish minimum permissions or account eligibility.`],
    },
  };
}

function reviewedSource(guide: Guide, pages: ResearchPage[], urls: string[], anchors: RegExp[]) {
  for (const page of pages) {
    if (!urls.includes(page.url)) continue;
    const text = page.text.replace(/[‘’]/g, "'").replace(/\s+/g, " ");
    if (!anchors.every((anchor) => anchor.test(text))) continue;
    const source = guide.sources.find((item) => item.url === page.url);
    if (source) return source;
  }
}

function replaceSteps(
  steps: GuideStep[],
  rules: Array<{ matches: (step: GuideStep) => boolean; title: string; detail: string; evidence?: GuideStep["evidence"] }>,
  sourceId: string,
  sourceUrl: string,
) {
  const used = new Set<number>();
  const result: GuideStep[] = [];
  const ruleOrder = new Map<GuideStep, number>();
  function note(index: number) {
    const rule = rules[index];
    used.add(index);
    const step: GuideStep = {
      id: "reviewed-note",
      title: rule.title,
      detail: rule.detail,
      owner: "developer",
      evidence: rule.evidence ?? "documented",
      sourceIds: [sourceId],
      actionUrl: sourceUrl,
    };
    ruleOrder.set(step, index);
    return step;
  }
  for (const step of steps) {
    const index = rules.findIndex((rule) => rule.matches(step));
    if (index === -1) result.push(step);
    else if (!used.has(index)) result.push(note(index));
  }
  for (let i = 0; i < rules.length; i++) {
    if (used.has(i)) continue;
    const before = result.findIndex((step) => (ruleOrder.get(step) ?? -1) > i);
    result.splice(before === -1 ? result.length : before, 0, note(i));
  }
  return result.map((step, index) => ({ ...step, id: `step-${index + 1}` }));
}

// These are small reviewed policy corrections, not prewritten generated guides.
// They apply only after the exact official document and its key facts were fetched.
export function applyReviewedNotes(guide: Guide, pages: ResearchPage[], intent: string): Guide {
  const active = activeIntent(intent);
  const external = /\b(?:external|customers|public|saas|outside)\b/.test(active);
  if (["figma.com", "developers.figma.com", "www.figma.com"].includes(guide.domain)) {
    const source = reviewedSource(guide, pages, [
      "https://developers.figma.com/docs/rest-api/oauth-apps/",
      "https://developers.figma.com/docs/rest-api/oauth-apps",
    ], [/admins for your plan/i, /private OAuth apps/i, /when Figma approves your public OAuth app/i, /only opportunity.*Client Secret/i]);
    if (!source) return guide;

    const fileContentsOnly = isReadOnlyIntent(intent) &&
      /file (?:json )?contents?|file json|\/v1\/files/.test(active) &&
      !/\b(?:comments?|metadata|profile|user information|variables?|dev resources?|webhooks?|versions?|folders?|projects?)\b/.test(active) &&
      pages.some((page) => containsScope(page.text, "file_content:read"));
    const rules = [
      {
        matches: (step: GuideStep) => /creat|register|credential|client.*secret/i.test(step.title),
        title: "Create the draft and save its secret",
        detail: "Create the app at figma.com/developers/apps and associate it with a team or organization. Store the client secret securely before closing creation: it is shown only once. Draft testing is limited to the creator and admins for that plan.",
      },
      {
        matches: (step: GuideStep) => /configur|scope/i.test(step.title),
        title: "Configure callbacks, scopes, and audience",
        detail: `Register the callback URLs used by your integration and select scopes for the intended endpoints.${fileContentsOnly ? " For this file-content-only request, use file_content:read." : " Confirm each endpoint's scope before consent."} ${external ? "Choose a public app for external customers; a private app only serves users in its associated team or organization." : "Choose private for users in the associated team or organization, or public for a wider audience."}`,
      },
      {
        matches: (step: GuideStep) => /token|exchange/i.test(step.title),
        title: "Exchange the authorization code promptly",
        detail: "Exchange the code within 30 seconds at https://api.figma.com/v1/oauth/token using a form-encoded POST and HTTP Basic client authentication. Use the same redirect URI. If using the recommended S256 PKCE flow, send the verifier in the token request.",
      },
      {
        matches: (step: GuideStep) => /review|approv|publish|launch|production/i.test(step.title) || /\b(?:private|public|draft)\b/i.test(step.detail),
        title: "Clear the correct publishing gate",
        detail: "Private apps need no Figma review but are limited to the associated team or organization. External customers need an approved public app. Supply its logo, description, testing instructions, and reviewer access where necessary. Approval permits distribution; each user still grants consent. No review turnaround is established here.",
      },
    ];
    const steps = replaceSteps(guide.steps, rules, source.id, source.url);
    return {
      ...guide,
      ...(external ? { summary: "External customer connections need a public Figma OAuth app and Figma approval. Validate the callback and minimum scopes in a draft first.", difficulty: "Conditional review" as const } : {}),
      review: "Draft apps can be tested by their creator and admins for that plan. Published private apps serve users in the associated team or organization without Figma review. Public apps need Figma approval before other users can authorize them; every user still grants their own consent. External customers require the public path.",
      waitTime: "Not established by reviewed sources",
      prerequisites: ["A Figma account and a team or organization to own the app.", "The integration's callback URLs and a list of intended API actions.", "Secure server-side storage for the client secret shown during app creation."],
      ...(fileContentsOnly ? { recommendedScopes: ["file_content:read"], scopeNote: "The reviewed Figma instructions map file-content reads to file_content:read. Extra actions need their own endpoint-to-scope check. Scopes do not override the user's access to a file." } : {}),
      steps,
      blockers: [
        ...guide.blockers.filter((item) => !/draft|private|public|review|approval|publish|redirect|callback|client[\s_-]*(?:id|secret)|credential|signing[\s_-]*key/i.test(`${item.title} ${item.detail} ${item.resolution}`)),
        { title: "The client secret was not saved at creation", detail: "Figma provides the client secret only when the app is created. The reviewed instructions do not establish a way to retrieve that existing secret afterward.", resolution: "Store the new secret securely before closing creation. If it was lost, check Figma's current credential-replacement flow in the signed-in app settings or contact support. Do not assume the dashboard can display the original secret again.", sourceIds: [source.id] },
        { title: "The callback must match a registered redirect URL", detail: "The authorization callback must be registered for the app, and the token request must use the same redirect URI. A universal HTTPS-only provider requirement was not verified here.", resolution: "Register the integration's callback and compare the complete URI across app settings, authorization, and token exchange. Choose HTTPS for production as a deployment recommendation; confirm acceptance of any development callback in Figma's app settings instead of inferring a restriction from examples.", sourceIds: [source.id] },
        { title: "Match pilot and launch users to the app audience", detail: "Draft testing is limited to the creator and plan admins; a private app serves its associated team or organization.", resolution: external ? "For the stated external audience, publish a public app, provide reviewer materials, and wait for Figma approval before inviting those users. Then test each user's separate consent." : "Use a published private app only for the associated team or organization. If the audience extends beyond that group, use the public review path before inviting those users. Test each user's separate consent.", sourceIds: [source.id] },
      ],
      validation: {
        ...guide.validation,
        correction: `Reviewed Figma policy notes checked ${checkedAt} were applied to the fetched OAuth-app document: audience eligibility, callback consistency, one-time secret storage, and code exchange. These are dated editorial corrections to a generated draft, not a completed provider setup or a claim that every generated sentence was verified.`,
        checked: [...guide.validation.checked, `Applied reviewed Figma policy notes (${checkedAt}) after matching the exact source URL and policy markers.`],
        notChecked: [
          ...guide.validation.notChecked.filter((item) => !/\b(?:draft|private).*(?:eligib|authoriz|review)|\bpublic.*approval (?:path|process)|\bpublic.*eligib/i.test(item)),
          "Figma's actual review outcome, turnaround, and account-specific restrictions were not tested.",
        ],
      },
    };
  }

  if (["calendly.com", "developer.calendly.com", "www.calendly.com"].includes(guide.domain)) {
    const source = reviewedSource(guide, pages, [
      "https://developer.calendly.com/docs/authentication/creating-an-oauth-app",
      "https://developer.calendly.com/docs/authentication/creating-an-oauth-app.md",
    ], [/exactly one URI/i, /every OAuth app must use/i, /HTTP Basic authentication/i, /cannot view.*client ID again/i]);
    if (!source) return guide;

    const scopesSource = reviewedSource(guide, pages, [
      "https://developer.calendly.com/docs/authentication/scopes",
      "https://developer.calendly.com/docs/authentication/scopes.md",
    ], [/scheduled_events:read/, /not required if.*polling/i]);
    const scheduledEventsOnly = !!scopesSource && isReadOnlyIntent(intent) &&
      /scheduled (?:events|meetings)|read (?:their )?events|\/scheduled_events/.test(active) &&
      !/\b(?:availability|event types?|profile|user information|contacts?|routing|webhooks?)\b|\/users\/me/.test(active);
    const rules = [
      {
        matches: (step: GuideStep) => /creat|register|redirect|callback|configur/i.test(step.title),
        title: "Register a Sandbox app with one callback",
        detail: "Create a Sandbox app in Calendly's Developer tools with exactly one callback and at least one scope. Sandbox permits HTTPS or HTTP on localhost; Production requires HTTPS. Use a separate Production app for real customer data.",
      },
      {
        matches: (step: GuideStep) => /credential|client.*(?:id|secret)|signing key/i.test(step.title),
        title: "Save the one-time credentials",
        detail: "Before leaving creation, save the client ID, client secret, and webhook signing key securely. The reviewed documentation says none can currently be viewed again in Developer tools.",
      },
      {
        matches: (step: GuideStep) => /pkce|token|exchange|authorization code/i.test(step.title) || /code[_ ]verifier/i.test(step.detail),
        title: "Use S256 PKCE and authenticate the token exchange",
        detail: "Every app requires S256 PKCE. Send the challenge with authorization; retain the verifier for code exchange. POST code, client_id, redirect_uri, grant_type=authorization_code and code_verifier to https://auth.calendly.com/oauth/token. Server apps also use HTTP Basic with client ID and client secret.",
      },
      {
        matches: (step: GuideStep) => /review|approv|publish|launch|production/i.test(step.title) || /\b(?:private|public) app\b/i.test(step.detail),
        title: "Confirm external-production requirements",
        detail: "The reviewed registration instructions distinguish Sandbox testing from Production use, but do not establish a separate review process or turnaround. Ask Calendly whether the selected scopes and audience have additional production requirements before promising launch.",
        evidence: "unverified" as const,
      },
    ];
    return {
      ...guide,
      review: "The reviewed registration instructions distinguish Sandbox testing from Production real-user apps. They do not establish a separate provider approval process or turnaround. Confirm external-production requirements with Calendly before promising a launch date.",
      difficulty: "Needs investigation",
      waitTime: "Not established by reviewed sources",
      prerequisites: ["A Calendly account with access to Developer tools.", "The integration's callback URL and a list of intended API endpoints.", "Secure storage for the creation credentials and a server-side OAuth handler supporting S256 PKCE."],
      ...(scheduledEventsOnly ? { recommendedScopes: ["scheduled_events:read"], scopeNote: "The reviewed scope catalog requires scheduled_events:read for scheduled-event and invitee reads. Polling does not need webhooks:write. Calling additional endpoints, such as /users/me, needs a separate scope check." } : {}),
      steps: replaceSteps(guide.steps, rules, source.id, source.url),
      blockers: [
        ...guide.blockers.filter((item) => !/private|public|review|approval|production launch|redirect|callback|client[\s_-]*(?:id|secret)|credential|signing[\s_-]*key/i.test(`${item.title} ${item.detail} ${item.resolution}`)),
        { title: "Creation credentials were not saved", detail: "The reviewed Calendly instructions say the client ID, client secret, and webhook signing key cannot currently be viewed again in Developer tools after creation.", resolution: "Save all three securely before leaving creation. If a value is missing, check Calendly's current credential-replacement process in Developer tools or contact support. Do not assume an existing secret can be displayed again.", sourceIds: [source.id] },
        { title: "The callback must fit the selected environment", detail: "Each Calendly app accepts exactly one redirect URI. Sandbox permits HTTPS or HTTP on localhost; Production requires HTTPS.", resolution: "For local HTTP testing, use a Sandbox app and a localhost callback. For real customers, use a separate Production app with an HTTPS callback. Keep the registered redirect URI consistent in the authorization and token requests.", sourceIds: [source.id] },
        { title: "Production eligibility is not established by registration alone", detail: "The fetched registration instructions do not settle additional requirements for the intended external launch.", resolution: "Ask Calendly support about the exact audience, scopes, and Production app configuration. Submit a review only if Calendly confirms one is required.", sourceIds: [source.id] },
      ],
      validation: {
        ...guide.validation,
        correction: `Reviewed Calendly policy notes checked ${checkedAt} were applied to the fetched registration document: callback/environment limits, one-time credentials, and S256 token exchange. These are dated editorial corrections to a generated draft. Production approval eligibility and real OAuth behavior remain untested.`,
        checked: [...guide.validation.checked, `Applied reviewed Calendly setup notes (${checkedAt}) after matching the exact source URL and policy markers.`],
        notChecked: [
          ...guide.validation.notChecked.filter((item) => !/\b(?:private|public) app mode/i.test(item)),
          "Additional external-production requirements beyond the reviewed registration instructions still need confirmation with Calendly.",
        ],
      },
    };
  }
  return guide;
}
