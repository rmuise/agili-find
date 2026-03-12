import { NextResponse } from "next/server";
import { createServerClient } from "@/db";

/**
 * GET /api/classes
 * Returns all unique class names across trials, sorted alphabetically.
 */
export async function GET() {
  const supabase = createServerClient();

  try {
    // Get distinct classes from the trials table
    // classes is a TEXT[] column, so we need to unnest
    const { data, error } = await supabase.rpc("get_unique_classes");

    if (error) {
      // If RPC doesn't exist, fall back to a raw query approach
      // Try fetching a sample of trials and extracting classes
      const { data: trials, error: trialError } = await supabase
        .from("trials")
        .select("classes")
        .not("classes", "is", null)
        .limit(500);

      if (trialError) {
        return NextResponse.json({ error: trialError.message }, { status: 500 });
      }

      // Extract unique classes from all trials
      const classSet = new Set<string>();
      for (const trial of trials || []) {
        if (Array.isArray(trial.classes)) {
          for (const cls of trial.classes) {
            if (cls && cls.trim()) classSet.add(cls.trim());
          }
        }
      }

      const classes = [...classSet].sort();
      return NextResponse.json({ classes });
    }

    return NextResponse.json({ classes: data || [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
