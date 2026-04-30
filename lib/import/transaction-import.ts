import type { Currency, Transaction, TransactionType } from "../types.ts";

export type ImportField =
  | "date"
  | "type"
  | "symbol"
  | "quantity"
  | "total"
  | "fees"
  | "currency"
  | "platform"
  | "notes";

export type ImportMapping = Partial<Record<ImportField, string>>;

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
};

export type CsvRow = {
  lineNumber: number;
  values: Record<string, string>;
};

export type ImportRowStatus = "valid" | "warning" | "invalid";

export type ImportTransactionInput = {
  portfolioId?: string;
  type: Extract<TransactionType, "BUY" | "SELL" | "DEPOSIT" | "WITHDRAW">;
  assetSymbol?: string;
  occurredOn: string;
  quantity?: number;
  grossAmount: number;
  currency: Currency;
  fees: number;
  platform?: string;
  note?: string;
};

export type ImportPreviewRow = {
  lineNumber: number;
  status: ImportRowStatus;
  messages: string[];
  fingerprint: string | null;
  input?: ImportTransactionInput;
  raw: Record<string, string>;
};

export type ImportPreview = {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  duplicateRows: number;
  rows: ImportPreviewRow[];
};

const requiredFields: ImportField[] = ["date", "type", "total"];

const headerAliases: Record<ImportField, string[]> = {
  date: ["date", "occurred", "occurred on", "trade date", "transaction date", "time"],
  type: ["type", "side", "action", "transaction type", "operation"],
  symbol: ["symbol", "ticker", "asset", "asset symbol", "instrument", "coin"],
  quantity: ["quantity", "qty", "amount", "shares", "units"],
  total: ["total", "gross amount", "gross", "value", "net amount", "amount paid", "amount received"],
  fees: ["fees", "fee", "commission", "commissions", "costs"],
  currency: ["currency", "ccy", "base currency"],
  platform: ["platform", "broker", "exchange", "account"],
  notes: ["note", "notes", "description", "memo", "comment"]
};

export function parseCsv(text: string): ParsedCsv {
  const table = readCsvTable(text);
  const nonEmptyRows = table.filter((row) => row.cells.some((cell) => cell.trim()));
  if (nonEmptyRows.length === 0) return { headers: [], rows: [] };

  const headers = dedupeHeaders(nonEmptyRows[0].cells.map((cell) => cell.trim()));
  const rows = nonEmptyRows.slice(1).map((row) => {
    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      values[header] = row.cells[index]?.trim() ?? "";
    });
    return { lineNumber: row.lineNumber, values } satisfies CsvRow;
  });

  return { headers, rows };
}

export function suggestImportMapping(headers: string[]): ImportMapping {
  const normalizedHeaders = headers.map((header) => ({ header, key: normalizeHeader(header) }));
  const mapping: ImportMapping = {};

  for (const field of Object.keys(headerAliases) as ImportField[]) {
    const aliases = headerAliases[field].map(normalizeHeader);
    const exact = normalizedHeaders.find(({ key }) => aliases.includes(key));
    const partial =
      exact ??
      normalizedHeaders.find(({ key }) =>
        aliases.some((alias) => key.includes(alias) || alias.includes(key))
      );

    if (partial) mapping[field] = partial.header;
  }

  return mapping;
}

export function buildImportPreview({
  parsed,
  mapping,
  portfolioId,
  existingTransactions = []
}: {
  parsed: ParsedCsv;
  mapping: ImportMapping;
  portfolioId?: string;
  existingTransactions?: Transaction[];
}): ImportPreview {
  const existingFingerprints = new Set(
    existingTransactions.map((transaction) => fingerprintTransaction(transaction)).filter(Boolean)
  );
  const seenFingerprints = new Set<string>();
  const rows = parsed.rows.map((row) =>
    normalizeImportRow({ row, mapping, portfolioId, existingFingerprints, seenFingerprints })
  );

  return {
    totalRows: rows.length,
    validRows: rows.filter((row) => row.status === "valid").length,
    warningRows: rows.filter((row) => row.status === "warning").length,
    invalidRows: rows.filter((row) => row.status === "invalid").length,
    duplicateRows: rows.filter((row) => row.messages.some((message) => /duplicate/i.test(message))).length,
    rows
  };
}

export function importableRows(preview: ImportPreview) {
  return preview.rows.filter((row) => row.input && row.status !== "invalid");
}

function normalizeImportRow({
  row,
  mapping,
  portfolioId,
  existingFingerprints,
  seenFingerprints
}: {
  row: CsvRow;
  mapping: ImportMapping;
  portfolioId?: string;
  existingFingerprints: Set<string>;
  seenFingerprints: Set<string>;
}): ImportPreviewRow {
  const messages: string[] = [];

  for (const field of requiredFields) {
    if (!mapping[field]) messages.push(`Map the ${field} column.`);
  }

  const type = normalizeTransactionType(readMapped(row, mapping, "type"));
  const occurredOn = normalizeDate(readMapped(row, mapping, "date"));
  const assetSymbol = normalizeSymbol(readMapped(row, mapping, "symbol"));
  const quantity = parseAmount(readMapped(row, mapping, "quantity"));
  const grossAmount = parseAmount(readMapped(row, mapping, "total"));
  const fees = parseAmount(readMapped(row, mapping, "fees")) ?? 0;
  const currency = normalizeCurrency(readMapped(row, mapping, "currency"));
  const platform = emptyToUndefined(readMapped(row, mapping, "platform"));
  const note = emptyToUndefined(readMapped(row, mapping, "notes"));

  if (!type) messages.push("Unsupported transaction type. Use BUY, SELL, DEPOSIT, or WITHDRAW.");
  if (!occurredOn) messages.push("Invalid or missing date.");
  if (!currency) messages.push("Currency must be USD or EUR.");
  if (grossAmount === undefined || grossAmount <= 0) messages.push("Total must be a positive number.");
  if (fees < 0) messages.push("Fees cannot be negative.");

  if (type === "BUY" || type === "SELL") {
    if (!assetSymbol) messages.push("Trades need a symbol.");
    if (quantity === undefined || quantity <= 0) messages.push("Trades need a positive quantity.");
    if (type === "SELL") {
      messages.push("Sell rows require an existing holding and may be rejected during import if quantity is unavailable.");
    }
  }

  if ((type === "DEPOSIT" || type === "WITHDRAW") && assetSymbol) {
    messages.push("Cash-flow rows ignore the symbol column.");
  }

  const invalid = messages.some((message) =>
    /map the|unsupported|invalid|missing|required|positive|cannot be negative|currency must/i.test(message)
  );

  const input =
    !invalid && type && occurredOn && currency && grossAmount !== undefined
      ? ({
          portfolioId,
          type,
          assetSymbol: type === "BUY" || type === "SELL" ? assetSymbol : undefined,
          occurredOn,
          quantity: type === "BUY" || type === "SELL" ? quantity : undefined,
          grossAmount,
          currency,
          fees,
          platform,
          note
        } satisfies ImportTransactionInput)
      : undefined;

  const fingerprint = input ? fingerprintImportInput(input) : null;
  if (fingerprint) {
    if (existingFingerprints.has(fingerprint)) {
      messages.push("Possible duplicate of an existing transaction.");
    }
    if (seenFingerprints.has(fingerprint)) {
      messages.push("Duplicate row inside this CSV.");
    }
    seenFingerprints.add(fingerprint);
  }

  const hasDuplicate = messages.some((message) => /duplicate/i.test(message));
  const status: ImportRowStatus = invalid ? "invalid" : messages.length > 0 || hasDuplicate ? "warning" : "valid";

  return {
    lineNumber: row.lineNumber,
    status,
    messages,
    fingerprint,
    input,
    raw: row.values
  };
}

function readMapped(row: CsvRow, mapping: ImportMapping, field: ImportField) {
  const header = mapping[field];
  return header ? row.values[header] ?? "" : "";
}

function normalizeTransactionType(value: string): ImportTransactionInput["type"] | null {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (["BUY", "BOUGHT", "PURCHASE"].includes(normalized)) return "BUY";
  if (["SELL", "SOLD", "SALE"].includes(normalized)) return "SELL";
  if (["DEPOSIT", "CASH_IN", "FUNDING"].includes(normalized)) return "DEPOSIT";
  if (["WITHDRAW", "WITHDRAWAL", "CASH_OUT"].includes(normalized)) return "WITHDRAW";
  return null;
}

function normalizeCurrency(value: string): Currency | null {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return "USD";
  if (normalized === "USD" || normalized === "EUR") return normalized;
  return null;
}

function normalizeSymbol(value: string) {
  return value.trim().toUpperCase().replace(/^[$€]/, "");
}

function normalizeDate(value: string) {
  const raw = value.trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return formatDateParts(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const first = Number(slash[1]);
    const second = Number(slash[2]);
    const year = normalizeYear(Number(slash[3]));
    const dayFirst = first > 12;
    return dayFirst ? formatDateParts(year, second, first) : formatDateParts(year, first, second);
  }

  return null;
}

function formatDateParts(year: number, month: number, day: number) {
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function normalizeYear(year: number) {
  return year < 100 ? 2000 + year : year;
}

function parseAmount(value: string) {
  const raw = value.trim();
  if (!raw) return undefined;
  const withoutCurrency = raw.replace(/[€$£]/g, "").trim();
  const normalized = normalizeDecimalSeparators(withoutCurrency);
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeDecimalSeparators(value: string) {
  const compact = value.replace(/\s/g, "");
  const commaIndex = compact.lastIndexOf(",");
  const dotIndex = compact.lastIndexOf(".");

  if (commaIndex > dotIndex) {
    return compact.replace(/\./g, "").replace(",", ".");
  }

  return compact.replace(/,/g, "");
}

function emptyToUndefined(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function fingerprintTransaction(transaction: Transaction) {
  return [
    transaction.date,
    transaction.type,
    transaction.assetSymbol ?? "",
    transaction.quantity ?? "",
    transaction.grossAmount,
    transaction.currency,
    transaction.fees,
    transaction.platform ?? ""
  ].join("|");
}

function fingerprintImportInput(input: ImportTransactionInput) {
  return [
    input.occurredOn,
    input.type,
    input.assetSymbol ?? "",
    input.quantity ?? "",
    input.grossAmount,
    input.currency,
    input.fees,
    input.platform ?? ""
  ].join("|");
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function dedupeHeaders(headers: string[]) {
  const counts = new Map<string, number>();
  return headers.map((header, index) => {
    const fallback = header || `Column ${index + 1}`;
    const count = counts.get(fallback) ?? 0;
    counts.set(fallback, count + 1);
    return count === 0 ? fallback : `${fallback} ${count + 1}`;
  });
}

function readCsvTable(text: string) {
  const rows: Array<{ lineNumber: number; cells: string[] }> = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let lineNumber = 1;
  let rowStartLine = 1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      cells.push(cell);
      rows.push({ lineNumber: rowStartLine, cells });
      cells = [];
      cell = "";
      if (char === "\r" && next === "\n") index += 1;
      lineNumber += 1;
      rowStartLine = lineNumber;
      continue;
    }

    if (char === "\n") lineNumber += 1;
    cell += char;
  }

  cells.push(cell);
  rows.push({ lineNumber: rowStartLine, cells });
  return rows;
}
