import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * GET /api/judges — Return all judge names with slugs.
 *
 * First tries the judges table. Falls back to deduplicating from trials
 * for any names not yet in the judges table.
 * Results are cached for 1 hour.
 */
export async function GET() {
  const supabase = createServerClient();

  try {
    // Try the judges table first
    const { data: judgeRows, error: judgeError } = await supabase
      .from("judges")
      .select("name, slug")
      .order("name");

    if (!judgeError && judgeRows && judgeRows.length > 0) {
      return NextResponse.json(
        {
          judges: judgeRows.map((j) => j.name),
          slugs: Object.fromEntries(judgeRows.map((j) => [j.name, j.slug])),
          total: judgeRows.length,
        },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=3600, stale-while-revalidate=7200",
          },
        }
      );
    }

    // Fallback: deduplicate from trials (pre-migration compatibility)
    const { data, error } = await supabase
      .from("trials")
      .select("judges")
      .not("judges", "eq", "{}");

    if (error) {
      console.error("Judges query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch judges", details: error.message },
        { status: 500 }
      );
    }

    const judgeSet = new Set<string>();
    for (const row of data || []) {
      const judges = row.judges as string[] | null;
      if (judges) {
        for (const j of judges) {
          const trimmed = j.trim();
          if (trimmed && trimmed !== "TBA") {
            judgeSet.add(trimmed);
          }
        }
      }
    }

    const judges = [...judgeSet].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" })
    );

    return NextResponse.json(
      { judges, total: judges.length },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Judges error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
