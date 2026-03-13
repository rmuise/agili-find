import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

interface AuthResult {
  user: User;
  role: string;
}

/**
 * Authenticate the current request and return the user + their profile role.
 * Returns a NextResponse error if unauthenticated.
 */
export async function authenticateUser(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { user, role: profile?.role ?? "user" };
}

/**
 * Require the user to be authenticated and have provider (or admin) role.
 * Returns the user or a NextResponse error.
 */
export async function requireProvider(): Promise<AuthResult | NextResponse> {
  const result = await authenticateUser();
  if (result instanceof NextResponse) return result;

  if (result.role !== "provider" && result.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden — provider role required" },
      { status: 403 }
    );
  }

  return result;
}

/**
 * Check if the authenticated user owns a specific provider record.
 */
export async function requireProviderOwner(
  providerId: string
): Promise<{ user: User; providerId: string } | NextResponse> {
  const result = await requireProvider();
  if (result instanceof NextResponse) return result;

  const admin = createAdminClient();
  const { data: provider } = await admin
    .from("srv_providers")
    .select("id, owner_id")
    .eq("id", providerId)
    .single();

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 });
  }

  if (provider.owner_id !== result.user.id && result.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden — not the owner of this provider" },
      { status: 403 }
    );
  }

  return { user: result.user, providerId: provider.id };
}

export function isErrorResponse(
  result: AuthResult | { user: User; providerId: string } | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
