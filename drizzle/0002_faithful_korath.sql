CREATE TYPE "public"."product_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"brand" varchar(255),
	"sku" varchar(100),
	"barcode" varchar(100),
	"description" text,
	"base_unit" varchar(50) DEFAULT 'unidad' NOT NULL,
	"attributes" jsonb,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"default_margin_percent" numeric(10, 2) DEFAULT '0' NOT NULL,
	"suggested_sale_price" numeric(10, 2),
	"status" "product_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
DROP TABLE "classes" CASCADE;--> statement-breakpoint
DROP TABLE "departments" CASCADE;--> statement-breakpoint
DROP TABLE "enrollments" CASCADE;--> statement-breakpoint
DROP TABLE "subjects" CASCADE;--> statement-breakpoint
DROP TYPE "public"."class_status";