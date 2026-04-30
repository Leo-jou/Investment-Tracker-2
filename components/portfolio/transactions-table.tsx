"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import type { FormEvent } from "react";
import {
  Download,
  MoreHorizontal,
  Pencil,
  Save,
  Search,
  Trash2,
  Upload,
  X
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateUnitPrice } from "@/lib/metrics";
import { formatMoney, formatQuantity, trendClass } from "@/lib/format";
import type { Asset, Currency, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

type TransactionsTableProps = {
  transactions: Transaction[];
  assets: Asset[];
  currency: Currency;
};

type TransactionFilter = "Trades" | "Cash" | "Dividends";

export function TransactionsTable({ transactions, assets, currency }: TransactionsTableProps) {
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>("Trades");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((transaction) => {
    if (activeFilter === "Trades") return ["BUY", "SELL"].includes(transaction.type);
    if (activeFilter === "Cash") {
      return ["DEPOSIT", "WITHDRAW", "TRANSFER_IN", "TRANSFER_OUT", "CASH_ADJUSTMENT"].includes(
        transaction.type
      );
    }
    return false;
  });

  async function handleDelete(transaction: Transaction) {
    const confirmed = window.confirm(`Delete ${transaction.type.replace("_", " ")} transaction?`);
    if (!confirmed) return;

    setDeletingId(transaction.id);
    setError(null);

    const response = await fetch(`/api/transactions/${transaction.id}`, {
      method: "DELETE"
    });

    setDeletingId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not delete transaction.");
      return;
    }

    window.location.reload();
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>, transaction: Transaction) {
    event.preventDefault();
    setSavingId(transaction.id);
    setError(null);

    const response = await fetch(`/api/transactions/${transaction.id}`, {
      method: "PATCH",
      body: new FormData(event.currentTarget)
    });

    setSavingId(null);

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Could not update transaction.");
      return;
    }

    window.location.reload();
  }

  return (
    <section>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold">Transactions</h2>
          <p className="mt-2 text-sm text-zinc-500">Display currency: {currency}</p>
          <div className="mt-8 flex gap-2">
            {(["Trades", "Cash", "Dividends"] as TransactionFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={cn(
                  "rounded-full bg-[#2c2c2f] px-4 py-2 text-sm text-zinc-300",
                  activeFilter === tab && "bg-white text-black"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" title="Upload a generic CSV transaction file.">
            <Link href="#import-transactions">
              <Upload className="h-5 w-5" />
              Upload
            </Link>
          </Button>
          <Button variant="ghost" disabled title="Export is not implemented yet.">
            <Download className="h-5 w-5" />
            Download
          </Button>
        </div>
      </div>
      {error && <p className="mb-4 text-sm text-[#ff4d64]">{error}</p>}

      <div className="overflow-x-auto tv-scrollbar">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-[#2b2b2f] text-left text-zinc-500">
              <th className="w-[330px] py-3 font-medium">
                <div className="flex items-center gap-4">
                  <Search className="h-6 w-6 text-zinc-200" strokeWidth={1.5} />
                  <span>
                    Symbol
                    <span className="block text-xs text-zinc-400">
	                      {filteredTransactions.length} transactions
                    </span>
                  </span>
                </div>
              </th>
              <th className="py-3 font-medium">Side</th>
              <th className="py-3 text-right font-medium">Date</th>
              <th className="py-3 text-right font-medium">Qty</th>
              <th className="py-3 text-right font-medium">Price</th>
              <th className="py-3 text-right font-medium">Commission</th>
              <th className="py-3 text-right font-medium">Total</th>
              <th className="py-3 text-left font-medium">Notes</th>
              <th className="py-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => {
              const asset = transaction.assetId ? assetById.get(transaction.assetId) : null;
              const unitPrice = calculateUnitPrice(transaction);
              const isCashIncrease = ["SELL", "DEPOSIT", "TRANSFER_IN"].includes(transaction.type);

              return (
                <Fragment key={transaction.id}>
                  <tr className="border-b border-[#202024] hover:bg-[#121214]">
                    <td className="py-3 pr-4">
                      {asset ? (
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black"
                            style={{ backgroundColor: asset.color }}
                          >
                            {asset.symbol.slice(0, 1)}
                          </span>
                          <Badge>{asset.symbol}</Badge>
                          <span className="truncate text-sm text-zinc-200">{asset.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">
                            C
                          </span>
                          <Badge>{transaction.currency}</Badge>
                          <span className="text-sm text-zinc-200">{transaction.type}</span>
                        </div>
                      )}
                    </td>
                    <td
                      className={cn(
                        "py-3 font-medium",
                        isCashIncrease ? "text-[#00c2a8]" : trendClass(-1)
                      )}
                    >
                      {transaction.type.replace("_", " ")}
                    </td>
                    <td className="py-3 text-right text-zinc-300">{transaction.date}</td>
                    <td className="py-3 text-right text-zinc-300">
                      {transaction.quantity ? formatQuantity(transaction.quantity) : "-"}
                    </td>
                    <td className="py-3 text-right text-zinc-300">
                      {unitPrice ? formatMoney(unitPrice, transaction.currency) : "-"}
                    </td>
                    <td className="py-3 text-right text-zinc-300">
                      {formatMoney(transaction.fees, transaction.currency)}
                    </td>
                    <td className="py-3 text-right text-zinc-200">
                      {formatMoney(transaction.grossAmount, transaction.currency)}
                    </td>
                    <td className="max-w-[220px] truncate py-3 text-zinc-500">
                      {transaction.note}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-zinc-400 hover:bg-[#202024] hover:text-white"
                          title="Edit transaction"
                          onClick={() =>
                            setEditingId(editingId === transaction.id ? null : transaction.id)
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] text-zinc-400 hover:bg-[#202024] hover:text-white disabled:opacity-50"
                          title="Delete transaction"
                          disabled={deletingId === transaction.id}
                          onClick={() => handleDelete(transaction)}
                        >
                          {deletingId === transaction.id ? (
                            <MoreHorizontal className="h-5 w-5" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {editingId === transaction.id && (
                    <tr className="border-b border-[#202024] bg-[#080809]">
                      <td colSpan={9} className="py-4">
                        <form
                          onSubmit={(event) => handleEditSubmit(event, transaction)}
                          className="grid gap-3 lg:grid-cols-[0.8fr_0.75fr_0.75fr_0.6fr_0.75fr_0.5fr_0.7fr_0.8fr_1fr_auto]"
                        >
                          <select
                            name="type"
                            defaultValue={transaction.type}
                            className="h-10 rounded-[6px] border border-[#2b2b2f] bg-[#050505] px-3 text-sm text-zinc-100 outline-none focus:border-[#3b82f6]"
                          >
                            <option value="BUY">Buy</option>
                            <option value="SELL">Sell</option>
                            <option value="DEPOSIT">Deposit</option>
                            <option value="WITHDRAW">Withdraw</option>
                            <option value="CASH_ADJUSTMENT">Cash adjustment</option>
                          </select>
                          <Input
                            name="assetSymbol"
                            placeholder="Symbol"
                            defaultValue={transaction.assetSymbol ?? ""}
                          />
                          <Input
                            name="occurredOn"
                            type="date"
                            defaultValue={transaction.date}
                          />
                          <Input
                            name="quantity"
                            placeholder="Qty"
                            inputMode="decimal"
                            defaultValue={transaction.quantity ?? ""}
                          />
                          <Input
                            name="grossAmount"
                            placeholder="Total"
                            inputMode="decimal"
                            defaultValue={transaction.grossAmount}
                            required
                          />
                          <Input
                            name="currency"
                            placeholder="Currency"
                            defaultValue={transaction.currency}
                          />
                          <Input
                            name="fees"
                            placeholder="Fees"
                            inputMode="decimal"
                            defaultValue={transaction.fees}
                          />
                          <Input
                            name="platform"
                            placeholder="Platform"
                            defaultValue={transaction.platform ?? ""}
                          />
                          <Input
                            name="note"
                            placeholder="Note"
                            defaultValue={transaction.note ?? ""}
                          />
                          <div className="flex gap-2">
                            <Button size="compactIcon" disabled={savingId === transaction.id}>
                              {savingId === transaction.id ? (
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
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-zinc-500">
                  {activeFilter === "Dividends"
                    ? "Dividend tracking is not implemented yet."
                    : "No transactions in this filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
