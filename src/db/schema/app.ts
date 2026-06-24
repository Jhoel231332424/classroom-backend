import {
    integer,
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
};

export const productStatusEnum = pgEnum("product_status", [
    "active",
    "inactive",
]);

export const products = pgTable("products", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),

    name: varchar("name", { length: 255 }).notNull(),
    brand: varchar("brand", { length: 255 }),
    sku: varchar("sku", { length: 100 }).unique(),
    barcode: varchar("barcode", { length: 100 }),
    description: text("description"),

    baseUnit: varchar("base_unit", { length: 50 }).notNull().default("unidad"),
    attributes: jsonb("attributes").$type<Record<string, string | number | boolean>>(),

    currentStock: integer("current_stock").notNull().default(0),
    defaultMarginPercent: numeric("default_margin_percent", {
        precision: 10,
        scale: 2,
    }).notNull().default("0"),
    suggestedSalePrice: numeric("suggested_sale_price", {
        precision: 10,
        scale: 2,
    }),

    status: productStatusEnum("status").notNull().default("active"),

    ...timestamps,
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;