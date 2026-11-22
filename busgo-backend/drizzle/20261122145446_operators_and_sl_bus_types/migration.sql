CREATE TABLE "operators" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "operators_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL UNIQUE,
	"phone" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bus_routes" ADD COLUMN "operator_id" integer;--> statement-breakpoint
-- Existing routes get a placeholder operator so the column can be NOT NULL.
INSERT INTO "operators" ("name") SELECT 'Unassigned Operator' WHERE EXISTS (SELECT 1 FROM "bus_routes");--> statement-breakpoint
UPDATE "bus_routes" SET "operator_id" = (SELECT "id" FROM "operators" WHERE "name" = 'Unassigned Operator') WHERE "operator_id" IS NULL;--> statement-breakpoint
ALTER TABLE "bus_routes" ALTER COLUMN "operator_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bus_routes" ALTER COLUMN "service_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "bus_routes" ALTER COLUMN "service_type" DROP DEFAULT;--> statement-breakpoint
DROP TYPE "service_type";--> statement-breakpoint
CREATE TYPE "service_type" AS ENUM('normal', 'semi_luxury', 'luxury', 'super_luxury');--> statement-breakpoint
ALTER TABLE "bus_routes" ALTER COLUMN "service_type" SET DATA TYPE "service_type" USING (CASE "service_type" WHEN 'standard' THEN 'normal' ELSE "service_type" END)::"service_type";--> statement-breakpoint
ALTER TABLE "bus_routes" ALTER COLUMN "service_type" SET DEFAULT 'normal'::"service_type";--> statement-breakpoint
ALTER TABLE "bus_routes" ALTER COLUMN "total_seats" SET DEFAULT 50;--> statement-breakpoint
CREATE INDEX "bus_routes_operator_idx" ON "bus_routes" ("operator_id");--> statement-breakpoint
ALTER TABLE "bus_routes" ADD CONSTRAINT "bus_routes_operator_id_operators_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "operators"("id");