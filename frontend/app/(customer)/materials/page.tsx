"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPkr } from "@/lib/utils";

type CatalogItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  unit_price: number;
  stock: number;
  seller_type: string;
};

export default function MaterialsMarketplacePage() {
  const qc = useQueryClient();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ["materials-catalog"],
    queryFn: async () => {
      const res = await fetch("/api/materials", { credentials: "include" });
      const json = await res.json();
      return (json.data?.catalog ?? []) as CatalogItem[];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["material-orders"],
    queryFn: async () => {
      const res = await fetch("/api/materials?orders=1", {
        credentials: "include",
      });
      const json = await res.json();
      return json.data?.orders ?? [];
    },
  });

  const total = useMemo(() => {
    return catalog.reduce((sum, item) => {
      const qty = cart[item.id] ?? 0;
      return sum + qty * item.unit_price;
    }, 0);
  }, [cart, catalog]);

  const placeOrder = useMutation({
    mutationFn: async () => {
      const items = Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([catalog_id, qty]) => ({ catalog_id, qty }));
      const res = await fetch("/api/materials", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Order failed");
      return json.data;
    },
    onSuccess: () => {
      setCart({});
      setMessage("Order placed. Track status below.");
      void qc.invalidateQueries({ queryKey: ["materials-catalog"] });
      void qc.invalidateQueries({ queryKey: ["material-orders"] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-bold text-primary-navy">
          Materials marketplace
        </h1>
        <p className="text-sm text-text-secondary">
          Buy cement, bricks, steel and more for your CSC build (order + status
          for v1).
        </p>
      </div>

      {message ? (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-text-secondary">
          {message}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-text-secondary">Loading catalog…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((item) => (
            <div key={item.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-primary-navy">{item.name}</h2>
                <Badge variant="muted">{item.category}</Badge>
              </div>
              <p className="mt-2 tabular-nums font-semibold">
                {formatPkr(item.unit_price)} / {item.unit}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Stock {item.stock} · {item.seller_type}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCart((c) => ({
                      ...c,
                      [item.id]: Math.max(0, (c[item.id] ?? 0) - 1),
                    }))
                  }
                >
                  −
                </Button>
                <span className="w-8 text-center tabular-nums">
                  {cart[item.id] ?? 0}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setCart((c) => ({
                      ...c,
                      [item.id]: (c[item.id] ?? 0) + 1,
                    }))
                  }
                >
                  +
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
        <p className="font-semibold tabular-nums text-primary-navy">
          Cart total: {formatPkr(total)}
        </p>
        <Button
          disabled={total <= 0 || placeOrder.isPending}
          onClick={() => placeOrder.mutate()}
        >
          Place order
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-primary-navy">Your orders</h2>
        {orders.map(
          (o: {
            id: string;
            status: string;
            total_amount: number;
            items: { name: string; qty: number }[];
            created_at: string;
          }) => (
            <div key={o.id} className="rounded-xl border border-border p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">{o.status}</Badge>
                <span className="font-semibold tabular-nums">
                  {formatPkr(o.total_amount)}
                </span>
              </div>
              <p className="mt-1 text-text-secondary">
                {o.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                {new Date(o.created_at).toLocaleString()}
              </p>
            </div>
          ),
        )}
        {!orders.length ? (
          <p className="text-sm text-text-secondary">No materials orders yet.</p>
        ) : null}
      </div>
    </div>
  );
}
