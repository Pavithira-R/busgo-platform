CREATE TYPE "booking_status" AS ENUM('confirmed', 'cancelled', 'used', 'expired');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('pending', 'paid', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "scan_result" AS ENUM('valid', 'invalid', 'already_used', 'expired');--> statement-breakpoint
CREATE TYPE "service_type" AS ENUM('standard', 'semi_luxury', 'luxury');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('passenger', 'staff', 'admin');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bookings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"ticket_id" varchar(20) NOT NULL UNIQUE,
	"user_id" integer NOT NULL,
	"route_id" integer NOT NULL,
	"travel_date" date NOT NULL,
	"seat_number" varchar(5) NOT NULL,
	"passenger_name" varchar(100) NOT NULL,
	"passenger_email" varchar(150) NOT NULL,
	"passenger_phone" varchar(20),
	"passenger_id_number" varchar(50),
	"base_price" numeric(10,2) NOT NULL,
	"tax_amount" numeric(10,2) NOT NULL,
	"total_amount" numeric(10,2) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending'::"payment_status" NOT NULL,
	"booking_status" "booking_status" DEFAULT 'confirmed'::"booking_status" NOT NULL,
	"qr_payload" jsonb NOT NULL,
	"booked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bus_routes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bus_routes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"route_number" varchar(20) NOT NULL,
	"from_stop_id" integer NOT NULL,
	"to_stop_id" integer NOT NULL,
	"departure_time" time NOT NULL,
	"arrival_time" time NOT NULL,
	"duration_minutes" integer NOT NULL,
	"price" numeric(10,2) NOT NULL,
	"service_type" "service_type" DEFAULT 'standard'::"service_type" NOT NULL,
	"total_seats" integer DEFAULT 48 NOT NULL,
	"bus_number" varchar(20),
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "bus_routes_different_stops" CHECK ("from_stop_id" <> "to_stop_id")
);
--> statement-breakpoint
CREATE TABLE "bus_stops" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "bus_stops_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL UNIQUE,
	"city" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "scan_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"booking_id" integer,
	"scanned_ticket_id" varchar(50) NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"result" "scan_result" NOT NULL,
	"scanned_by" integer,
	"location" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL UNIQUE,
	"phone" varchar(20),
	"password_hash" varchar(255) NOT NULL,
	"id_number" varchar(50),
	"role" "user_role" DEFAULT 'passenger'::"user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_active_seat_uq" ON "bookings" ("route_id","travel_date","seat_number") WHERE "booking_status" <> 'cancelled';--> statement-breakpoint
CREATE INDEX "bookings_user_idx" ON "bookings" ("user_id");--> statement-breakpoint
CREATE INDEX "bus_routes_from_to_idx" ON "bus_routes" ("from_stop_id","to_stop_id");--> statement-breakpoint
CREATE INDEX "scan_logs_booking_idx" ON "scan_logs" ("booking_id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_route_id_bus_routes_id_fkey" FOREIGN KEY ("route_id") REFERENCES "bus_routes"("id");--> statement-breakpoint
ALTER TABLE "bus_routes" ADD CONSTRAINT "bus_routes_from_stop_id_bus_stops_id_fkey" FOREIGN KEY ("from_stop_id") REFERENCES "bus_stops"("id");--> statement-breakpoint
ALTER TABLE "bus_routes" ADD CONSTRAINT "bus_routes_to_stop_id_bus_stops_id_fkey" FOREIGN KEY ("to_stop_id") REFERENCES "bus_stops"("id");--> statement-breakpoint
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_booking_id_bookings_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id");--> statement-breakpoint
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_scanned_by_users_id_fkey" FOREIGN KEY ("scanned_by") REFERENCES "users"("id");