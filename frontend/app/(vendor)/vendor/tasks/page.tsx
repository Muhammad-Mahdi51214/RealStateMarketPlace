"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/forms/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/hooks/use-auth";

export default function VendorTasksPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["vendor-tasks"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/tasks", { credentials: "include" });
      const json = await res.json();
      return json.data?.tasks ?? [];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["vendor-projects"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/projects", { credentials: "include" });
      const json = await res.json();
      return json.data?.projects ?? [];
    },
    enabled: user?.role === "vendor",
  });

  const { data: members = [] } = useQuery({
    queryKey: ["vendor-team"],
    queryFn: async () => {
      const res = await fetch("/api/vendors/team", { credentials: "include" });
      const json = await res.json();
      return json.data?.members ?? [];
    },
    enabled: user?.role === "vendor",
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/vendors/tasks", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          title,
          assignee_member_id: assigneeId || null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
      return json.data;
    },
    onSuccess: () => {
      setTitle("");
      void qc.invalidateQueries({ queryKey: ["vendor-tasks"] });
    },
  });

  const updateTask = useMutation({
    mutationFn: async (payload: {
      task_id: string;
      status: "todo" | "in_progress" | "done";
    }) => {
      const res = await fetch("/api/vendors/tasks", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? "Failed");
      return json.data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["vendor-tasks"] }),
  });

  if (isLoading) {
    return <p className="text-sm text-text-secondary">Loading tasks…</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-primary-navy">Tasks</h2>

      {user?.role === "vendor" ? (
        <form
          className="max-w-lg space-y-3 rounded-xl border border-border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            createTask.mutate();
          }}
        >
          <h3 className="font-semibold">Assign task</h3>
          <div className="space-y-1">
            <Label>Project</Label>
            <select
              className="h-10 w-full rounded-md border border-input px-3 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
            >
              <option value="">Select project</option>
              {projects.map((p: { id: string; title: string }) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Assignee</Label>
            <select
              className="h-10 w-full rounded-md border border-input px-3 text-sm"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m: { id: string; full_name: string }) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>
          <Button disabled={createTask.isPending}>Create task</Button>
        </form>
      ) : null}

      <div className="space-y-3">
        {tasks.map(
          (t: {
            id: string;
            title: string;
            status: "todo" | "in_progress" | "done";
            due_at: string | null;
          }) => (
            <div key={t.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{t.title}</p>
                <Badge variant="muted">{t.status}</Badge>
              </div>
              {t.due_at ? (
                <p className="mt-1 text-xs text-text-secondary">
                  Due {new Date(t.due_at).toLocaleString()}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {(["todo", "in_progress", "done"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={t.status === status ? "default" : "outline"}
                    disabled={updateTask.isPending}
                    onClick={() =>
                      updateTask.mutate({ task_id: t.id, status })
                    }
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          ),
        )}
        {!tasks.length ? (
          <p className="text-sm text-text-secondary">No tasks yet.</p>
        ) : null}
      </div>
    </div>
  );
}
