import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-helpers";
import { PROGRAM_TEMPLATES } from "@/lib/fitness/program-templates";

/**
 * GET /api/fitness/programs/templates
 *
 * Lista biblioteca de programas clásicos (data estática).
 */
export async function GET() {
  return withAuth(async () => {
    return NextResponse.json(PROGRAM_TEMPLATES);
  });
}
