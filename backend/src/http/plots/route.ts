import { NextRequest, NextResponse } from "next/server";
import { getAmenities, getPhases, getPlots } from "@backend/inventory/queries";
import { plotsQuerySchema } from "@backend/validation/plots";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = plotsQuerySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const [plots, phases, amenities] = await Promise.all([
    getPlots(parsed.data),
    getPhases(),
    getAmenities(),
  ]);

  return NextResponse.json({
    success: true,
    data: { plots, phases, amenities },
  });
}
