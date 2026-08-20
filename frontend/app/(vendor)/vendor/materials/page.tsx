"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";
import { formatPkr } from "@/lib/utils";

export default function VendorMaterialsPage() {
  const qc = useQueryClient();
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState("bag");
  const [cost, setCost] = useState("0");
  const [error, setError] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["vendor-projects"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/projects", { credentials: "include" });
      const json = await res.json();
      return json.data?.projects ?? [];
    },
  });

  const { data: logs = [], refetch } = useQuery({
    queryKey: ["project-material-logs", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(
        `/api/materials/project-logs?project_id=${projectId}`,
        { credentials: "include" },
      );
      const json = await res.json();
      return json.data?.logs ?? [];
    },
    enabled: Boolean(projectId),
  });

  const addLog = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/materials/project-logs", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          name,
          qty: Number(qty),
          unit,
          cost: Number(cost),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
      return json.data;
    },
    onSuccess: () => {
      setError("");
      setName("");
      void refetch();
      void qc.invalidateQueries({ queryKey: ["hired-panel"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary-navy">
        Project materials log
      </h2>
      <div className="space-y-1 max-w-md">
        <Label>Project</Label>
        <select
          className="h-10 w-full rounded-md border border-input px-3 text-sm"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Select project</option>
          {projects.map((p: { id: string; title: string }) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {projectId ? (
        <>
          <form
            className="max-w-lg space-y-3 rounded-xl border border-border p-4"
            onSubmit={(e) => {
              e.preventDefault();
              addLog.mutate();
            }}
          >
            <h3 className="font-semibold">Add material usage</h3>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Qty</Label>
                <Input value={qty} onChange={(e) => setQty(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Cost</Label>
                <Input value={cost} onChange={(e) => setCost(e.target.value)} required />
              </div>
            </div>
            {error ? (
              <p className="text-sm text-alert-warning-text">{error}</p>
            ) : null}
            <Button disabled={addLog.isPending}>Log material</Button>
          </form>

          <div className="space-y-2">
            {logs.map(
              (l: {
                id: string;
                name: string;
                qty: number;
                unit: string;
                cost: number;
                created_at: string;
              }) => (
                <div key={l.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                  <p className="font-medium">
                    {l.name} · {l.qty} {l.unit}
                  </p>
                  <p className="text-text-secondary">
                    {formatPkr(l.cost)} · {new Date(l.created_at).toLocaleString()}
                  </p>
                </div>
              ),
            )}
            {!logs.length ? (
              <p className="text-sm text-text-secondary">No materials logged yet.</p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
