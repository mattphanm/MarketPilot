"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  formatTradeDateInput,
  parseTradeDateInput,
} from "@/lib/trades/date-input";
import type { TradeDto, TradePayload, TradeSide } from "@/lib/trades/types";

type TradeJournalProps = {
  initialTrades: TradeDto[];
};

type TradeFormState = {
  symbol: string;
  side: TradeSide;
  quantity: string;
  entry: string;
  exit: string;
  openedAt: string;
  closedAt: string;
  notes: string;
};

type ApiIssue = {
  path?: Array<string | number>;
  message?: string;
};

type ApiTradeBody = {
  trade?: TradeDto;
  error?: string;
  issues?: ApiIssue[];
};

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US");

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

function createEmptyForm(): TradeFormState {
  return {
    symbol: "",
    side: "buy",
    quantity: "",
    entry: "",
    exit: "",
    openedAt: formatTradeDateInput(new Date().toISOString()),
    closedAt: "",
    notes: "",
  };
}

function tradeToForm(trade: TradeDto): TradeFormState {
  return {
    symbol: trade.symbol,
    side: trade.side,
    quantity: String(trade.quantity),
    entry: String(trade.entry),
    exit: trade.exit === null ? "" : String(trade.exit),
    openedAt: formatTradeDateInput(trade.openedAt),
    closedAt: formatTradeDateInput(trade.closedAt),
    notes: trade.notes ?? "",
  };
}

function normalizeTrade(trade: TradeDto): TradeDto {
  return {
    ...trade,
    openedAt: new Date(trade.openedAt).toISOString(),
    closedAt: trade.closedAt ? new Date(trade.closedAt).toISOString() : null,
    createdAt: new Date(trade.createdAt).toISOString(),
    updatedAt: new Date(trade.updatedAt).toISOString(),
  };
}

function sortTrades(trades: TradeDto[]) {
  return [...trades].sort((a, b) => {
    const openedDiff =
      new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime();

    if (openedDiff !== 0) {
      return openedDiff;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function getTradePnl(trade: TradeDto) {
  if (trade.exit === null) {
    return null;
  }

  const direction = trade.side === "buy" ? 1 : -1;
  return (trade.exit - trade.entry) * trade.quantity * direction;
}

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDate(iso: string | null) {
  if (!iso) {
    return "Open";
  }

  return `${dateFormatter.format(new Date(iso))} UTC`;
}

function formatIssue(issue: ApiIssue) {
  const field =
    issue.path && issue.path.length > 0 ? issue.path.join(".") : "input";

  return issue.message ? `${field}: ${issue.message}` : "";
}

function formatApiError(body: ApiTradeBody | null, fallback: string) {
  const issueText = body?.issues?.map(formatIssue).filter(Boolean).join("; ");

  if (body?.error && issueText) {
    return `${body.error}: ${issueText}`;
  }

  return body?.error ?? issueText ?? fallback;
}

async function readApiBody(response: Response) {
  try {
    return (await response.json()) as ApiTradeBody;
  } catch {
    return null;
  }
}

function buildPayload(
  form: TradeFormState,
  editingTrade: TradeDto | null
): { payload: TradePayload; error: null } | { payload: null; error: string } {
  const symbol = form.symbol.trim().toUpperCase();
  const entry = Number(form.entry);
  const quantity = Number(form.quantity);
  const openedAtResult = parseTradeDateInput(form.openedAt);
  const exitValue = form.exit.trim();
  const closedAtValue = form.closedAt.trim();
  const notes = form.notes.trim();

  if (!symbol) {
    return { payload: null, error: "Symbol is required." };
  }

  if (!Number.isFinite(entry) || entry <= 0) {
    return { payload: null, error: "Entry must be a positive number." };
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { payload: null, error: "Quantity must be a positive whole number." };
  }

  if (!openedAtResult.ok) {
    return { payload: null, error: `Opened date: ${openedAtResult.error}` };
  }

  if (editingTrade && editingTrade.exit !== null && exitValue === "") {
    return {
      payload: null,
      error: "Enter an exit price before saving this edit.",
    };
  }

  if (editingTrade && editingTrade.closedAt !== null && closedAtValue === "") {
    return {
      payload: null,
      error: "Enter a closed date before saving this edit.",
    };
  }

  const payload: TradePayload = {
    symbol,
    side: form.side,
    entry,
    quantity,
    openedAt: openedAtResult.iso,
  };

  if (exitValue) {
    const exit = Number(exitValue);

    if (!Number.isFinite(exit) || exit <= 0) {
      return { payload: null, error: "Exit must be a positive number." };
    }

    payload.exit = exit;
  }

  if (closedAtValue) {
    const closedAtResult = parseTradeDateInput(closedAtValue);

    if (!closedAtResult.ok) {
      return { payload: null, error: `Closed date: ${closedAtResult.error}` };
    }

    if (new Date(closedAtResult.iso) < new Date(openedAtResult.iso)) {
      return {
        payload: null,
        error: "Closed date must be after the opened date.",
      };
    }

    payload.closedAt = closedAtResult.iso;
  }

  if (notes || editingTrade?.notes) {
    payload.notes = notes;
  }

  return { payload, error: null };
}

export default function TradeJournal({ initialTrades }: TradeJournalProps) {
  const [trades, setTrades] = useState(() =>
    sortTrades(initialTrades.map(normalizeTrade))
  );
  const [form, setForm] = useState<TradeFormState>(() => createEmptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingTrade = useMemo(
    () => trades.find((trade) => trade.id === editingId) ?? null,
    [editingId, trades]
  );

  const summary = useMemo(() => {
    const pnlValues = trades
      .map((trade) => getTradePnl(trade))
      .filter((value): value is number => value !== null);
    const realizedPnl = pnlValues.reduce((total, value) => total + value, 0);

    return {
      total: trades.length,
      closed: trades.filter(
        (trade) => trade.closedAt !== null || trade.exit !== null
      ).length,
      wins: pnlValues.filter((value) => value > 0).length,
      realizedPnl,
    };
  }, [trades]);

  function updateForm<Key extends keyof TradeFormState>(
    key: Key,
    value: TradeFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(createEmptyForm());
    setError(null);
  }

  function startEdit(trade: TradeDto) {
    setEditingId(trade.id);
    setForm(tradeToForm(trade));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const result = buildPayload(form, editingTrade);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        editingTrade ? `/api/trades/${editingTrade.id}` : "/api/trades",
        {
          method: editingTrade ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result.payload),
        }
      );
      const body = await readApiBody(response);

      if (!response.ok || !body?.trade) {
        throw new Error(
          formatApiError(body, "Unable to save this trade. Try again.")
        );
      }

      const nextTrade = normalizeTrade(body.trade);
      setTrades((current) =>
        sortTrades(
          editingTrade
            ? current.map((trade) =>
                trade.id === nextTrade.id ? nextTrade : trade
              )
            : [nextTrade, ...current]
        )
      );
      resetForm();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save this trade. Try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(trade: TradeDto) {
    if (!window.confirm(`Delete ${trade.symbol} trade?`)) {
      return;
    }

    setDeletingId(trade.id);
    setError(null);

    try {
      const response = await fetch(`/api/trades/${trade.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await readApiBody(response);
        throw new Error(
          formatApiError(body, "Unable to delete this trade. Try again.")
        );
      }

      setTrades((current) =>
        current.filter((currentTrade) => currentTrade.id !== trade.id)
      );

      if (editingId === trade.id) {
        resetForm();
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to delete this trade. Try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Trades
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {numberFormatter.format(summary.total)}
          </p>
        </div>
        <div className="border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Closed
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {numberFormatter.format(summary.closed)}
          </p>
        </div>
        <div className="border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Wins
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">
            {numberFormatter.format(summary.wins)}
          </p>
        </div>
        <div className="border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
            Realized P&amp;L
          </p>
          <p
            className={`mt-2 text-2xl font-semibold ${
              summary.realizedPnl >= 0 ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {formatMoney(summary.realizedPnl)}
          </p>
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-950">
                {editingTrade ? "Edit trade" : "New trade"}
              </h2>
              {editingTrade ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {editingTrade.symbol} opened {formatDate(editingTrade.openedAt)}
                </p>
              ) : null}
            </div>
            {editingTrade ? (
              <button
                type="button"
                onClick={resetForm}
                className="h-8 border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                Cancel
              </button>
            ) : null}
          </div>

          {error ? (
            <p
              role="alert"
              className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {error}
            </p>
          ) : null}

          <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Symbol
              <input
                value={form.symbol}
                onChange={(event) => updateForm("symbol", event.target.value)}
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="AAPL"
                maxLength={20}
                disabled={saving}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Side
                <select
                  value={form.side}
                  onChange={(event) =>
                    updateForm("side", event.target.value as TradeSide)
                  }
                  className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  disabled={saving}
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </label>

              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Quantity
                <input
                  value={form.quantity}
                  onChange={(event) =>
                    updateForm("quantity", event.target.value)
                  }
                  className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  inputMode="numeric"
                  min="1"
                  step="1"
                  type="number"
                  disabled={saving}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Entry
                <input
                  value={form.entry}
                  onChange={(event) => updateForm("entry", event.target.value)}
                  className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  type="number"
                  disabled={saving}
                />
              </label>

              <label className="grid gap-1 text-sm font-medium text-zinc-700">
                Exit
                <input
                  value={form.exit}
                  onChange={(event) => updateForm("exit", event.target.value)}
                  className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  type="number"
                  disabled={saving}
                />
              </label>
            </div>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Opened
              <input
                value={form.openedAt}
                onChange={(event) => updateForm("openedAt", event.target.value)}
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="2026-06-20 14:30"
                type="text"
                disabled={saving}
              />
              <span className="text-xs font-normal text-zinc-500">
                Use 24-hour time, for example 6/20 14:30 or 1430.
              </span>
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Closed
              <input
                value={form.closedAt}
                onChange={(event) => updateForm("closedAt", event.target.value)}
                className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                placeholder="2026-06-20 15:45"
                type="text"
                disabled={saving}
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-zinc-700">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                className="min-h-24 resize-y border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                maxLength={5000}
                disabled={saving}
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-1 h-10 bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {saving
                ? "Saving..."
                : editingTrade
                  ? "Save changes"
                  : "Create trade"}
            </button>
          </form>
        </section>

        <section className="min-w-0 border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-950">
              Trade history
            </h2>
            <p className="text-sm text-zinc-500">
              {numberFormatter.format(trades.length)} records
            </p>
          </div>

          {trades.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-zinc-800">No trades yet</p>
              <p className="mt-2 text-sm text-zinc-500">
                Add your first trade to start the journal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-500">
                  <tr>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Symbol
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Qty
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Entry
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Exit
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Opened
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Closed
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 font-semibold">
                      Notes
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 text-right font-semibold">
                      P&amp;L
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => {
                    const pnl = getTradePnl(trade);
                    const deleting = deletingId === trade.id;

                    return (
                      <tr
                        key={trade.id}
                        className={`border-b border-zinc-100 transition ${
                          deleting ? "opacity-50" : "hover:bg-zinc-50"
                        }`}
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-zinc-950">
                            {trade.symbol}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.12em] text-zinc-500">
                            {trade.side}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {numberFormatter.format(trade.quantity)}
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {formatMoney(trade.entry)}
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {trade.exit === null ? "Open" : formatMoney(trade.exit)}
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {formatDate(trade.openedAt)}
                        </td>
                        <td className="px-4 py-3 align-top text-zinc-700">
                          {formatDate(trade.closedAt)}
                        </td>
                        <td className="max-w-56 px-4 py-3 align-top text-zinc-700">
                          <div className="truncate">
                            {trade.notes ? (
                              trade.notes
                            ) : (
                              <span className="text-zinc-400">None</span>
                            )}
                          </div>
                        </td>
                        <td
                          className={`px-4 py-3 text-right align-top font-semibold ${
                            pnl === null
                              ? "text-zinc-400"
                              : pnl >= 0
                                ? "text-emerald-700"
                                : "text-red-700"
                          }`}
                        >
                          {pnl === null ? "Open" : formatMoney(pnl)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(trade)}
                              disabled={saving || deleting}
                              className="h-8 border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(trade)}
                              disabled={saving || deleting}
                              className="h-8 border border-red-200 px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
