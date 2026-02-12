-- AlterTable: Change default margin from 20% to 13%
ALTER TABLE "cpq"."quote_parameters" ALTER COLUMN "margin_pct" SET DEFAULT 13;
