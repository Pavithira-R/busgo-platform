CREATE TABLE "boarding_points" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "boarding_points_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"route_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"stop_order" integer NOT NULL,
	"minutes_from_start" integer NOT NULL,
	CONSTRAINT "boarding_points_order_positive" CHECK ("stop_order" > 0),
	CONSTRAINT "boarding_points_minutes_positive" CHECK ("minutes_from_start" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "boarding_points_route_order_uq" ON "boarding_points" ("route_id","stop_order");--> statement-breakpoint
ALTER TABLE "boarding_points" ADD CONSTRAINT "boarding_points_route_id_bus_routes_id_fkey" FOREIGN KEY ("route_id") REFERENCES "bus_routes"("id") ON DELETE CASCADE;