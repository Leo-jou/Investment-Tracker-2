"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { MoreHorizontal, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currencyValue, formatMoney } from "@/lib/format";
import type { Currency, ManualPosition } from "@/lib/types";

type ManualPositionsCardProps = {
  positions: ManualPosition[];
  currency: Currency;
  portfolioId?: string;
};

export function ManualPositionsCard({ positions, currency, portfolioId }: ManualPositionsCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);

    const response = await fetch("/api/manual-positions", {
      method: "POST",
      body: new FormData(event.currentTarget)
    });

    setIsSaving(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not save manual position.");
      return;
    }

    window.location.reload();
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>, position: ManualPosition) {
    event.preventDefault();
    setSavingId(position.id);
    setError(null);

    const response = await fetch(`/api/manual-positions/${position.id}`, {
      method: "PATCH",
      body: new FormData(event.currentTarget)
    });

    setSavingId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not update manual position.");
      return;
    }

    window.location.reload();
  }

  async function handleDelete(position: ManualPosition) {
    const confirmed = window.confirm(`Delete manual position "${position.label}"?`);
    if (!confirmed) return;

    setDeletingId(position.id);
    setError(null);

    const response = await fetch(`/api/manual-positions/${position.id}`, {
      method: "DELETE"
    });

    setDeletingId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not delete manual position.");
      return;
    }

    window.location.reload();
  }

  return (
    <section className="rounded-[8px] border border-[#2b2b2f] bg-black p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manual positions</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Cash, external holdings, private assets, or anything without automatic pricing.
          </p>
        </div>
        <Button variant="subtle">
          <Plus className="h-4 w-4" />
          Add manual value
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.7fr_0.5fr_auto]">
        {portfolioId && <input type="hidden" name="portfolioId" value={portfolioId} />}
        <Input name="label" placeholder="Label" required />
        <Input name="value" placeholder="Value" inputMode="decimal" required />
        <Input name="currency" placeholder="Currency" defaultValue={currency} />
        <Button disabled={isSaving}>
          <Plus className="h-4 w-4" />
          {isSaving ? "Saving" : "Save"}
        </Button>
      </form>
      {error && <p className="mt-4 text-sm text-[#ff4d64]">{error}</p>}

      <div className="mt-6 divide-y divide-[#202024]">
        {positions.map((position) => (
          <div key={position.id} className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-zinc-200">{position.label}</p>
                <p className="mt-1 text-xs text-zinc-500">Updated {position.updatedAt}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="mr-2 text-right font-semibold text-zinc-100">
                  {formatMoney(currencyValue(position, currency), currency)}
                </p>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-zinc-500 hover:bg-[#202024] hover:text-white"
                  type="button"
                  title="Edit manual position"
                  onClick={() => setEditingId(editingId === position.id ? null : position.id)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-zinc-500 hover:bg-[#202024] hover:text-white disabled:opacity-50"
                  type="button"
                  title="Delete manual position"
                  disabled={deletingId === position.id}
                  onClick={() => handleDelete(position)}
                >
                  {deletingId === position.id ? (
                    <MoreHorizontal className="h-4 w-4" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {editingId === position.id && (
              <form
                onSubmit={(event) => handleEditSubmit(event, position)}
                className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.55fr_0.4fr_0.55fr_1fr_auto]"
              >
                <Input name="label" placeholder="Label" defaultValue={position.label} required />
                <Input
                  name="value"
                  placeholder="Value"
                  inputMode="decimal"
                  defaultValue={currencyValue(position, position.currency)}
                  required
                />
                <Input name="currency" placeholder="Currency" defaultValue={position.currency} />
                <Input name="valuedOn" type="date" defaultValue={position.updatedAt} />
                <Input name="note" placeholder="Note" defaultValue={position.note ?? ""} />
                <div className="flex gap-2">
                  <Button size="compactIcon" disabled={savingId === position.id}>
                    {savingId === position.id ? (
                      <MoreHorizontal className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="compactIcon"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
