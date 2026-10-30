import { publicUrl } from "./sources.ts";

const catalogUrl =
  "https://cdn.jsdelivr.net/npm/simple-icons@latest/_data/simple-icons.json";
const maxCatalogBytes = 1_000_000;
const cacheLifetime = 60 * 60 * 1000;
const sharedHosts = [
  "github.com",
  "github.io",
  "wikipedia.org",
  "wikimedia.org",
  "jsdelivr.net",
  "unpkg.com",
  "npmjs.com",
  "simpleicons.org",
];

interface Brand {
  title: string;
  source: string;
}

export interface ProviderLead {
  name: string;
  domain: string;
  urls: string[];
  method: "brand-catalog";
}

const catalogCache = new WeakMap<
  typeof fetch,
  { expiresAt: number; brands: Brand[] }
>();

function normalizedName(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
}

async function readCatalog(fetcher: typeof fetch): Promise<Brand[]> {
  const cached = catalogCache.get(fetcher);
  if (cached && cached.expiresAt > Date.now()) return cached.brands;

  const response = await fetcher(catalogUrl, {
    headers: { accept: "application/json" },
    redirect: "manual",
    signal: AbortSignal.timeout(8_000),
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("application/json") ||
    Number(response.headers.get("content-length")) > maxCatalogBytes ||
    !response.body
  ) {
    throw new Error("The brand catalog is unavailable.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxCatalogBytes) throw new Error("The brand catalog is too large.");
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } finally {
    await reader.cancel();
  }

  const parsed: unknown = JSON.parse(text);
  const entries = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === "object" && "icons" in parsed
      ? parsed.icons
      : null;
  if (!Array.isArray(entries)) throw new Error("The brand catalog is malformed.");
  const brands = entries.filter(
    (entry): entry is Brand =>
      !!entry &&
      typeof entry === "object" &&
      typeof entry.title === "string" &&
      typeof entry.source === "string",
  );
  catalogCache.set(fetcher, { expiresAt: Date.now() + cacheLifetime, brands });
  return brands;
}

// Brand metadata supplies a research lead, not verified provider identity or OAuth support.
export async function discoverProvider(
  query: string,
  { fetcher = fetch }: { fetcher?: typeof fetch } = {},
): Promise<ProviderLead | null> {
  const name = normalizedName(query);
  if (!name) return null;

  try {
    const matches = (await readCatalog(fetcher)).filter(
      (brand) => normalizedName(brand.title) === name,
    );
    if (matches.length !== 1) return null;

    const brand = matches[0];
    const source = publicUrl(brand.source);
    const hostname = source.hostname.toLowerCase().replace(/\.$/, "");
    if (
      sharedHosts.some(
        (host) => hostname === host || hostname.endsWith(`.${host}`),
      )
    ) {
      return null;
    }

    const homepage = new URL("/", source).href;
    return {
      name: brand.title,
      domain: hostname.replace(/^www\./, ""),
      urls: [...new Set([source.href, homepage])],
      method: "brand-catalog",
    };
  } catch {
    // A failed catalog request should leave the direct-website research path usable.
    return null;
  }
}
