import { NextResponse } from "next/server";

/**
 * Standardized API error response.
 */
export function apiError(
  message: string,
  status: number,
  details?: string
) {
  const body: { error: string; details?: string } = { error: message };
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}
