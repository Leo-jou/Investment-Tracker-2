CREATE TYPE "public"."asset_type" AS ENUM('CRYPTO', 'STOCK', 'ETF', 'COMMODITY', 'CASH', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('EUR', 'USD');--> statement-breakpoint
CREATE TYPE "public"."price_provider" AS ENUM('coingecko', 'twelve-data', 'fmp', 'manual', 'mock');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('BUY', 'SELL', 'DEPOSIT', 'WITHDRAW', 'TRANSFER_IN', 'TRANSFER_OUT', 'MANUAL_VALUE', 'CASH_ADJUSTMENT');--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"type" "asset_type" NOT NULL,
	"currency" "currency" NOT NULL,
	"exchange" text,
	"provider" "price_provider" NOT NULL,
	"external_id" text NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fx_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" "currency" NOT NULL,
	"quote_currency" "currency" NOT NULL,
	"rate" numeric(18, 8) NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manual_positions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"label" text NOT NULL,
	"value" numeric(18, 4) NOT NULL,
	"currency" "currency" NOT NULL,
	"note" text,
	"valued_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"snapshot_date" date NOT NULL,
	"value_eur" numeric(18, 4) NOT NULL,
	"value_usd" numeric(18, 4) NOT NULL,
	"invested_capital_eur" numeric(18, 4) NOT NULL,
	"external_cash_flow_eur" numeric(18, 4) DEFAULT 0 NOT NULL,
	"twr_percent" numeric(10, 4) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"base_currency" "currency" DEFAULT 'EUR' NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"provider" "price_provider" NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"price" numeric(18, 8) NOT NULL,
	"currency" "currency" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"asset_id" uuid,
	"type" "transaction_type" NOT NULL,
	"occurred_on" date NOT NULL,
	"quantity" numeric(28, 10),
	"gross_amount" numeric(18, 4) NOT NULL,
	"currency" "currency" NOT NULL,
	"fees" numeric(18, 4) DEFAULT 0 NOT NULL,
	"platform" text,
	"note" text,
	"transfer_group_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"password_hash" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "manual_positions" ADD CONSTRAINT "manual_positions_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_snapshots" ADD CONSTRAINT "portfolio_snapshots_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_snapshots" ADD CONSTRAINT "price_snapshots_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assets_symbol_idx" ON "assets" USING btree ("symbol");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_provider_external_idx" ON "assets" USING btree ("provider","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fx_snapshots_pair_captured_idx" ON "fx_snapshots" USING btree ("base_currency","quote_currency","captured_at");--> statement-breakpoint
CREATE INDEX "manual_positions_portfolio_idx" ON "manual_positions" USING btree ("portfolio_id");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_snapshots_portfolio_date_idx" ON "portfolio_snapshots" USING btree ("portfolio_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "portfolios_user_idx" ON "portfolios" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolios_user_name_idx" ON "portfolios" USING btree ("user_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "price_snapshots_asset_captured_idx" ON "price_snapshots" USING btree ("asset_id","provider","captured_at");--> statement-breakpoint
CREATE INDEX "transactions_portfolio_date_idx" ON "transactions" USING btree ("portfolio_id","occurred_on");--> statement-breakpoint
CREATE INDEX "transactions_asset_idx" ON "transactions" USING btree ("asset_id");--> statement-breakpoint
CREATE INDEX "transactions_transfer_group_idx" ON "transactions" USING btree ("transfer_group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");