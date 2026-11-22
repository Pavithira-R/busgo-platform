CREATE TYPE "payment_method" AS ENUM('card', 'ez_cash', 'bank_transfer');--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "boarding_point_id" integer;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "service_fee" numeric(10,2);--> statement-breakpoint
-- Existing bookings: the fee is whatever the total charged above the fare.
UPDATE "bookings" SET "service_fee" = "total_amount" - "base_price";--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "service_fee" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "cancellation_charge" numeric(10,2);--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "refund_amount" numeric(10,2);--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_boarding_point_id_boarding_points_id_fkey" FOREIGN KEY ("boarding_point_id") REFERENCES "boarding_points"("id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_total_matches" CHECK ("total_amount" = "base_price" + "service_fee");