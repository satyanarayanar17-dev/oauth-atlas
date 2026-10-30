export interface ResearchPage {
  url: string;
  title: string;
  text: string;
  links: string[];
}

export class ResearchError extends Error {
  readonly status: number;
  constructor(message: string, status = 422) {
    super(message);
    this.name = "ResearchError";
    this.status = status;
  }
}

export function publicUrl(input: string, base?: string): URL {
  let url: URL;
  try {
    url = new URL(input, base);
  } catch {
    throw new ResearchError(
      "Enter an app name or a valid public HTTPS website.",
    );
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  ) {
    throw new ResearchError(
      "Research supports public HTTPS websites without credentials or custom ports.",
    );
  }
  if (
    !host.includes(".") ||
    host.startsWith("[") ||
    /^[\d.]+$/.test(host) ||
    /(^|\.)(localhost|local|internal|test|invalid|example|onion)$/.test(host)
  ) {
    throw new ResearchError(
      "Use a public provider website. Local networks and IP addresses cannot be investigated.",
    );
  }
  url.hash = "";
  return url;
}

export function isPublicAddress(address: string): boolean {
  if (address.includes(":")) {
    const normalized = address.toLowerCase();
    if (
      !/^[23][0-9a-f]{3}:/.test(normalized) ||
      normalized.startsWith("2002:") ||
      normalized.startsWith("2001:db8:")
    )
      return false;
    if (
      normalized.startsWith("2001:") &&
      parseInt(normalized.split(":")[1] || "0", 16) < 0x200
    )
      return false;
    return /^[0-9a-f:]+$/.test(normalized);
  }
  const parts = address.split(".");
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)
  )
    return false;
  const [a, b, c] = parts.map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}

export async function assertPublicDns(
  hostname: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const responses = await Promise.all(
    ["A", "AAAA"].map(async (type) => {
      const response = await fetcher(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=${type}`,
        {
          headers: { accept: "application/dns-json" },
          signal: AbortSignal.timeout(5_000),
          redirect: "manual",
        },
      );
      if (!response.ok)
        throw new ResearchError(
          "The provider’s public DNS could not be verified. Try again shortly.",
        );
      return (await response.json()) as {
        Status?: number;
        Answer?: Array<{ type: number; data: string }>;
      };
    }),
  );
  const answers = responses.flatMap((response) => response.Answer || []);
  if (responses.some((response) => response.Status !== 0))
    throw new ResearchError("The provider’s public DNS could not be verified.");
  const addresses = answers.filter(
    (answer) => answer.type === 1 || answer.type === 28,
  );
  if (
    !addresses.length ||
    addresses.some((answer) => !isPublicAddress(answer.data))
  )
    throw new ResearchError(
      "This website does not resolve exclusively to public internet addresses.",
    );
  for (const answer of answers)
    if (answer.type === 5)
      publicUrl(`https://${answer.data.replace(/\.$/, "")}`);
}

function decodeEntities(text: string): string {
  return text.replace(
    /&(?:amp|lt|gt|quot|apos|nbsp);|&#(\d+);|&#x([0-9a-f]+);/gi,
    (entity, decimal, hex) => {
      if (decimal || hex) {
        const point = parseInt(decimal || hex, decimal ? 10 : 16);
        return point > 0 && point <= 0x10ffff
          ? String.fromCodePoint(point)
          : "";
      }
      return (
        (
          {
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
            "&quot;": '"',
            "&apos;": "'",
            "&nbsp;": " ",
          } as Record<string, string>
        )[entity.toLowerCase()] || " "
      );
    },
  );
}

export function parsePage(html: string, url: string): ResearchPage {
  const cleaned = html
    .replace(
      /<(script|style|noscript|svg|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi,
      " ",
    )
    .replace(/<!--[\s\S]*?-->/g, " ");
  const title = decodeEntities(
    (
      html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
      html.match(/^#\s+(.+)$/m)?.[1] ||
      new URL(url).hostname
    ).replace(/<[^>]+>/g, ""),
  ).trim();
  const main =
    cleaned.match(
      /<(?:main|article)\b[^>]*>([\s\S]*?)<\/(?:main|article)>/i,
    )?.[1] || cleaned;
  const text = decodeEntities(
    main
      .replace(/<\/(?:p|li|h[1-6]|div|section|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[\t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 45_000);
  const links = new Set<string>();
  const linkMarkup = html.replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );
  for (const match of linkMarkup.matchAll(
    /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi,
  )) {
    try {
      links.add(publicUrl(decodeEntities(match[1]), url).href);
    } catch {
      /* Ignore non-public navigation links. */
    }
  }
  for (const match of cleaned.matchAll(
    /\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g,
  )) {
    try {
      links.add(publicUrl(match[1], url).href);
    } catch {
      /* Ignore non-web Markdown links. */
    }
  }
  return { url, title: title.slice(0, 160), text, links: [...links] };
}

export function documentationLinks(page: ResearchPage): string[] {
  const ownHost = new URL(page.url).hostname.replace(
    /^(www|docs|developer|developers|api)\./,
    "",
  );
  return page.links
    .filter((link) => {
      const url = new URL(link);
      const belongsToProvider =
        url.hostname === ownHost || url.hostname.endsWith(`.${ownHost}`);
      return (
        belongsToProvider &&
        /oauth|authentication|authorization|developer|integrations|docs|scope|review|approval/i.test(
          url.href,
        ) &&
        !/\/blog\/|\/login|\/signin|logout|\.(png|jpg|pdf|zip|mp4)(?:\?|$)/i.test(
          url.pathname,
        )
      );
    })
    .sort((a, b) => Number(/oauth/i.test(b)) - Number(/oauth/i.test(a)))
    .slice(0, 8);
}

async function readBounded(response: Response): Promise<string> {
  if (Number(response.headers.get("content-length")) > 1_000_000)
    throw new ResearchError(
      "The documentation page is too large to read safely.",
    );
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1_000_000)
        throw new ResearchError(
          "The documentation page is too large to read safely.",
        );
      body += decoder.decode(value, { stream: true });
    }
    return body + decoder.decode();
  } finally {
    await reader.cancel();
  }
}

export async function fetchPage(
  input: string,
  fetcher: typeof fetch = fetch,
  verifyDns: (hostname: string) => Promise<void> = assertPublicDns,
): Promise<ResearchPage> {
  let url = publicUrl(input);
  const signal = AbortSignal.timeout(12_000);
  for (let redirects = 0; redirects <= 3; redirects++) {
    await verifyDns(url.hostname);
    const response = await fetcher(url, {
      signal,
      redirect: "manual",
      headers: {
        "user-agent": "OAuthAtlas/1.0 (public documentation research)",
        accept: "text/html,text/plain,text/markdown;q=0.9",
      },
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location)
        throw new ResearchError(
          "The provider returned an incomplete redirect.",
        );
      url = publicUrl(location, url.href);
      continue;
    }
    if (!response.ok)
      throw new ResearchError(
        `The provider documentation returned HTTP ${response.status}. Try a direct OAuth documentation URL.`,
      );
    const type = response.headers.get("content-type") || "";
    if (
      !/(text\/html|text\/plain|text\/markdown|application\/xhtml)/i.test(type)
    ) {
      throw new ResearchError(
        "This URL does not return readable documentation. Try its OAuth documentation page.",
      );
    }
    const page = parsePage(await readBounded(response), url.href);
    if (page.text.length < 120)
      throw new ResearchError(
        "This page requires a browser or sign-in. Try a public documentation URL.",
      );
    return page;
  }
  throw new ResearchError(
    "The documentation redirected too many times. Try its final public URL.",
  );
}
