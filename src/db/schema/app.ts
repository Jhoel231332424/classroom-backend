import { relations } from "drizzle-orm";
import {
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    decimal,
    varchar,
} from "drizzle-orm/pg-core";

export const saleModeEnum = pgEnum("sale_mode", ["local", "viaje"]);
export const saleStatusEnum = pgEnum("sale_status", ["pendiente", "confirmada"]);

export const providers = pgTable("providers", {
    id: varchar("id", { length: 128 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
    id: varchar("id", { length: 128 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    localMargin: decimal("margen_local", { precision: 10, scale: 2 }).notNull(),
    travelMargin: decimal("margen_viaje", { precision: 10, scale: 2 }).notNull(),
    availableStock: integer("stock_disponible").default(0).notNull(),
    realUnitCost: decimal("costo_unitario_real", { precision: 15, scale: 4 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const purchases = pgTable("purchases", {
    id: varchar("id", { length: 128 }).primaryKey(),
    productId: varchar("producto_id", { length: 128 })
        .notNull()
        .references(() => products.id),
    providerId: varchar("proveedor_id", { length: 128 })
        .notNull()
        .references(() => providers.id),
    boxTotalCost: decimal("costo_total_caja", { precision: 15, scale: 2 }).notNull(),
    unitsPerBox: integer("unidades_por_caja").notNull(),
    boxQuantity: integer("cantidad_cajas").notNull(),
    calculatedUnitCost: decimal("costo_unitario_calculado", { precision: 15, scale: 4 }).notNull(),
    arrivalDate: timestamp("fecha_ingreso").defaultNow().notNull(),
});

export const sales = pgTable("sales", {
    id: varchar("id", { length: 128 }).primaryKey(),
    saleMode: saleModeEnum("modo_venta").notNull(),
    suggestedAmount: decimal("monto_sugerido", { precision: 15, scale: 2 }).notNull(),
    collectedAmount: decimal("monto_cobrado", { precision: 15, scale: 2 }).notNull(),
    roundingDifference: decimal("diferencia_redondeo", { precision: 10, scale: 2 }).notNull(),
    realSaleCost: decimal("costo_real_venta", { precision: 15, scale: 2 }).notNull(),
    netUtility: decimal("utilidad_neta", { precision: 15, scale: 2 }).notNull(),
    status: saleStatusEnum("estado").default("pendiente").notNull(),
    saleDate: timestamp("fecha_venta").defaultNow().notNull(),
});

export const saleDetails = pgTable("sale_details", {
    id: varchar("id", { length: 128 }).primaryKey(),
    saleId: varchar("venta_id", { length: 128 })
        .notNull()
        .references(() => sales.id),
    productId: varchar("producto_id", { length: 128 })
        .notNull()
        .references(() => products.id),
    quantity: integer("cantidad").notNull(),
    unitPrice: decimal("precio_unitario", { precision: 15, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
});

// Relations
export const providersRelations = relations(providers, ({ many }) => ({
    purchases: many(purchases),
}));

export const productsRelations = relations(products, ({ many }) => ({
    purchases: many(purchases),
    saleDetails: many(saleDetails),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
    product: one(products, {
        fields: [purchases.productId],
        references: [products.id],
    }),
    provider: one(providers, {
        fields: [purchases.providerId],
        references: [providers.id],
    }),
}));

export const salesRelations = relations(sales, ({ many }) => ({
    details: many(saleDetails),
}));

export const saleDetailsRelations = relations(saleDetails, ({ one }) => ({
    sale: one(sales, {
        fields: [saleDetails.saleId],
        references: [sales.id],
    }),
    product: one(products, {
        fields: [saleDetails.productId],
        references: [products.id],
    }),
}));

// Types
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export type SaleDetail = typeof saleDetails.$inferSelect;
export type NewSaleDetail = typeof saleDetails.$inferInsert;
