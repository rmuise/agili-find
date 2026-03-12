import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * GET /api/judges — Return all unique judge names from the database
 *
 * Returns a sorted, deduplicated list of judge names across all trials.
 * Results are cached for 1 hour since judges don't change frequently.
 */
export async function GET() {
  const supabase = createServerClient();

  try {
    // Query all non-empty judges arrays
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

    // Flatten and deduplicate judge names
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
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Judges error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
