CREATE TYPE "public"."sale_mode" AS ENUM('local', 'viaje');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('pendiente', 'confirmada');--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"margen_local" numeric(10, 2) NOT NULL,
	"margen_viaje" numeric(10, 2) NOT NULL,
	"stock_disponible" integer DEFAULT 0 NOT NULL,
	"costo_unitario_real" numeric(15, 4) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"producto_id" varchar(128) NOT NULL,
	"proveedor_id" varchar(128) NOT NULL,
	"costo_total_caja" numeric(15, 2) NOT NULL,
	"unidades_por_caja" integer NOT NULL,
	"cantidad_cajas" integer NOT NULL,
	"costo_unitario_calculado" numeric(15, 4) NOT NULL,
	"fecha_ingreso" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_details" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"venta_id" varchar(128) NOT NULL,
	"producto_id" varchar(128) NOT NULL,
	"cantidad" integer NOT NULL,
	"precio_unitario" numeric(15, 2) NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"modo_venta" "sale_mode" NOT NULL,
	"monto_sugerido" numeric(15, 2) NOT NULL,
	"monto_cobrado" numeric(15, 2) NOT NULL,
	"diferencia_redondeo" numeric(10, 2) NOT NULL,
	"costo_real_venta" numeric(15, 2) NOT NULL,
	"utilidad_neta" numeric(15, 2) NOT NULL,
	"estado" "sale_status" DEFAULT 'pendiente' NOT NULL,
	"fecha_venta" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "classes" CASCADE;--> statement-breakpoint
DROP TABLE "departments" CASCADE;--> statement-breakpoint
DROP TABLE "enrollments" CASCADE;--> statement-breakpoint
DROP TABLE "subjects" CASCADE;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_producto_id_products_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_proveedor_id_providers_id_fk" FOREIGN KEY ("proveedor_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_details" ADD CONSTRAINT "sale_details_venta_id_sales_id_fk" FOREIGN KEY ("venta_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_details" ADD CONSTRAINT "sale_details_producto_id_products_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP TYPE "public"."class_status";