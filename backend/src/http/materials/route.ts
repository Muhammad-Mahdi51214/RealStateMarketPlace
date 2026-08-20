import { z } from "zod";
import { requireAdmin, requireSessionUser } from "@backend/auth/session";
import { fail, fromService, ok } from "@backend/vendors/http-helpers";
import {
  listCatalog,
  listMaterialOrders,
  placeMaterialOrder,
  setMaterialActive,
} from "@backend/vendors/service";

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        catalog_id: z.string().min(1),
        qty: z.number().positive(),
      }),
    )
    .min(1),
});

const moderateSchema = z.object({
  catalog_id: z.string().min(1),
  active: z.boolean(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("orders") === "1") {
      const user = await requireSessionUser();
      return ok({ orders: listMaterialOrders(user) });
    }
    return ok({ catalog: listCatalog(true) });
  } catch (error) {
    return fromService(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireSessionUser();
    const body = orderSchema.parse(await request.json());
    const order = placeMaterialOrder(user, body.items);
    return ok({ order }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = moderateSchema.parse(await request.json());
    const item = setMaterialActive(body.catalog_id, body.active);
    return ok({ item });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400, error.flatten());
    }
    return fromService(error);
  }
}
