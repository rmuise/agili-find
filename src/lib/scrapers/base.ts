import { ScrapedTrial, ScrapePageResult } from "@/types/scraper";
import { OrganizationId } from "@/types/trial";

export interface ScraperOptions {
  /** Delay between requests in milliseconds */
  requestDelay?: number;
  /** Maximum retries per request */
  maxRetries?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** User-Agent string */
  userAgent?: string;
}

const DEFAULT_OPTIONS: Required<ScraperOptions> = {
  requestDelay: 2000,
  maxRetries: 3,
  timeout: 30000,
  userAgent:
    "AgiliFind/1.0 (Dog Agility Trial Aggregator; +https://agili-find.vercel.app)",
};

export abstract class BaseScraper {
  protected orgId: OrganizationId;
  protected options: Required<ScraperOptions>;
  private lastRequestTime = 0;

  constructor(orgId: OrganizationId, options?: ScraperOptions) {
    this.orgId = orgId;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Subclasses implement this to scrape trials */
  abstract scrape(cursor?: unknown): Promise<ScrapePageResult>;

  /** Rate-limited fetch with retry */
  protected async fetchWithRetry(
    url: string,
    init?: RequestInit
  ): Promise<Response> {
    await this.rateLimit();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.options.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          this.options.timeout
        );

        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
          headers: {
            "User-Agent": this.options.userAgent,
            ...init?.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `[${this.orgId}] Attempt ${attempt + 1}/${this.options.maxRetries} failed for ${url}: ${lastError.message}`
        );

        if (attempt < this.options.maxRetries - 1) {
          // Exponential backoff: 2s, 4s, 8s...
          const backoff = this.options.requestDelay * Math.pow(2, attempt);
          await this.sleep(backoff);
        }
      }
    }

    throw lastError || new Error("Fetch failed after retries");
  }

  /** Fetch and return HTML text */
  protected async fetchHtml(url: string): Promise<string> {
    const response = await this.fetchWithRetry(url, {
      headers: { Accept: "text/html" },
    });
    return response.text();
  }

  /** Fetch and return JSON */
  protected async fetchJson<T = unknown>(
    url: string,
    init?: RequestInit
  ): Promise<T> {
    const response = await this.fetchWithRetry(url, {
      ...init,
      headers: { Accept: "application/json", ...init?.headers },
    });
    return response.json();
  }

  /** Enforce rate limiting between requests */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.options.requestDelay) {
      await this.sleep(this.options.requestDelay - elapsed);
    }
    this.lastRequestTime = Date.now();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Parse a date string in various formats */
  protected parseDate(dateStr: string): string | null {
    try {
      const cleaned = dateStr.trim();
      // Try ISO format first
      const d = new Date(cleaned);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Build a result with metadata */
  protected buildResult(
    trials: ScrapedTrial[],
    nextCursor?: unknown
  ): ScrapePageResult {
    return {
      trials,
      hasMore: !!nextCursor,
      cursor: nextCursor,
      scrapedAt: new Date().toISOString(),
    };
  }
}
