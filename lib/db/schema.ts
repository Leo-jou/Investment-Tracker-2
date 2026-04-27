import {
  boolean,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";

export const assetTypeEnum = pgEnum("asset_type", [
  "CRYPTO",
  "STOCK",
  "ETF",
  "COMMODITY",
  "CASH",
  "MANUAL"
]);

export const currencyEnum = pgEnum("currency", ["EUR", "USD"]);

export const providerEnum = pgEnum("price_provider", [
  "coingecko",
  "twelve-data",
  "fmp",
  "manual",
  "mock"
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "BUY",
  "SELL",
  "DEPOSIT",
  "WITHDRAW",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "MANUAL_VALUE",
  "CASH_ADJUSTMENT"
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email)
  })
);

export const portfolios = pgTable(
  "portfolios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    baseCurrency: currencyEnum("base_currency").notNull().default("EUR"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    userIdx: index("portfolios_user_idx").on(table.userId),
    userNameIdx: uniqueIndex("portfolios_user_name_idx").on(table.userId, table.name)
  })
);

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    type: assetTypeEnum("type").notNull(),
    currency: currencyEnum("currency").notNull(),
    exchange: text("exchange"),
    provider: providerEnum("provider").notNull(),
    externalId: text("external_id").notNull(),
    color: text("color").notNull().default("#3b82f6"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    symbolIdx: index("assets_symbol_idx").on(table.symbol),
    providerExternalIdx: uniqueIndex("assets_provider_external_idx").on(
      table.provider,
      table.externalId
    )
  })
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "set null" }),
    type: transactionTypeEnum("type").notNull(),
    occurredOn: date("occurred_on").notNull(),
    quantity: numeric("quantity", { precision: 28, scale: 10, mode: "number" }),
    grossAmount: numeric("gross_amount", { precision: 18, scale: 4, mode: "number" }).notNull(),
    currency: currencyEnum("currency").notNull(),
    fees: numeric("fees", { precision: 18, scale: 4, mode: "number" }).notNull().default(0),
    platform: text("platform"),
    note: text("note"),
    transferGroupId: uuid("transfer_group_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    portfolioDateIdx: index("transactions_portfolio_date_idx").on(
      table.portfolioId,
      table.occurredOn
    ),
    assetIdx: index("transactions_asset_idx").on(table.assetId),
    transferGroupIdx: index("transactions_transfer_group_idx").on(table.transferGroupId)
  })
);

export const manualPositions = pgTable(
  "manual_positions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    value: numeric("value", { precision: 18, scale: 4, mode: "number" }).notNull(),
    currency: currencyEnum("currency").notNull(),
    note: text("note"),
    valuedOn: date("valued_on").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    portfolioIdx: index("manual_positions_portfolio_idx").on(table.portfolioId)
  })
);

export const priceSnapshots = pgTable(
  "price_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    provider: providerEnum("provider").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    price: numeric("price", { precision: 18, scale: 8, mode: "number" }).notNull(),
    currency: currencyEnum("currency").notNull()
  },
  (table) => ({
    assetCapturedIdx: uniqueIndex("price_snapshots_asset_captured_idx").on(
      table.assetId,
      table.provider,
      table.capturedAt
    )
  })
);

export const fxSnapshots = pgTable(
  "fx_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    baseCurrency: currencyEnum("base_currency").notNull(),
    quoteCurrency: currencyEnum("quote_currency").notNull(),
    rate: numeric("rate", { precision: 18, scale: 8, mode: "number" }).notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    pairCapturedIdx: uniqueIndex("fx_snapshots_pair_captured_idx").on(
      table.baseCurrency,
      table.quoteCurrency,
      table.capturedAt
    )
  })
);

export const portfolioSnapshots = pgTable(
  "portfolio_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    snapshotDate: date("snapshot_date").notNull(),
    valueEur: numeric("value_eur", { precision: 18, scale: 4, mode: "number" }).notNull(),
    valueUsd: numeric("value_usd", { precision: 18, scale: 4, mode: "number" }).notNull(),
    investedCapitalEur: numeric("invested_capital_eur", {
      precision: 18,
      scale: 4,
      mode: "number"
    }).notNull(),
    externalCashFlowEur: numeric("external_cash_flow_eur", {
      precision: 18,
      scale: 4,
      mode: "number"
    })
      .notNull()
      .default(0),
    twrPercent: numeric("twr_percent", { precision: 10, scale: 4, mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    portfolioDateIdx: uniqueIndex("portfolio_snapshots_portfolio_date_idx").on(
      table.portfolioId,
      table.snapshotDate
    )
  })
);
