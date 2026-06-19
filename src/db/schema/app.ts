import { relations, sql } from "drizzle-orm";
import {
    integer,
    pgEnum,
    pgTable,
    timestamp,
    decimal,
    varchar,
} from "drizzle-orm/pg-core";

// Enums
export const saleModeEnum = pgEnum("sale_mode", ["local", "viaje"]);
export const saleStatusEnum = pgEnum("sale_status", ["pendiente", "confirmada"]);

// 1. Proveedores (providers)
export const providers = pgTable("providers", {
    id: varchar("id", { length: 128 }).primaryKey(), // cuid2
    nombre: varchar("nombre", { length: 255 }).notNull(),
    telefono: varchar("telefono", { length: 50 }),
    fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
});

// 2. Productos (products)
export const products = pgTable("products", {
    id: varchar("id", { length: 128 }).primaryKey(),
    nombre: varchar("nombre", { length: 255 }).notNull(),
    margenLocal: decimal("margen_local", { precision: 10, scale: 2 }).notNull(),
    margenViaje: decimal("margen_viaje", { precision: 10, scale: 2 }).notNull(),
    stockDisponible: integer("stock_disponible").default(0).notNull(),
    costoUnitarioReal: decimal("costo_unitario_real", { precision: 15, scale: 4 }).notNull(),
    fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
});

// 3. Ingresos/Compras (purchases)
export const purchases = pgTable("purchases", {
    id: varchar("id", { length: 128 }).primaryKey(),
    productoId: varchar("producto_id", { length: 128 })
        .notNull()
        .references(() => products.id),
    proveedorId: varchar("proveedor_id", { length: 128 })
        .notNull()
        .references(() => providers.id),
    costoTotalCaja: decimal("costo_total_caja", { precision: 15, scale: 2 }).notNull(),
    unidadesPorCaja: integer("unidades_por_caja").notNull(),
    cantidadCajas: integer("cantidad_cajas").notNull(),
    costoUnitarioCalculado: decimal("costo_unitario_calculado", { precision: 15, scale: 4 }).notNull(),
    fechaIngreso: timestamp("fecha_ingreso").defaultNow().notNull(),
});

// 4. Ventas (sales)
export const sales = pgTable("sales", {
    id: varchar("id", { length: 128 }).primaryKey(),
    modoVenta: saleModeEnum("modo_venta").notNull(),
    montoSugerido: decimal("monto_sugerido", { precision: 15, scale: 2 }).notNull(),
    montoCobrado: decimal("monto_cobrado", { precision: 15, scale: 2 }).notNull(),
    diferenciaRedondeo: decimal("diferencia_redondeo", { precision: 10, scale: 2 }).notNull(),
    costoRealVenta: decimal("costo_real_venta", { precision: 15, scale: 2 }).notNull(),
    utilidadNeta: decimal("utilidad_neta", { precision: 15, scale: 2 }).notNull(),
    estado: saleStatusEnum("estado").default("pendiente").notNull(),
    fechaVenta: timestamp("fecha_venta").defaultNow().notNull(),
});

// 5. Detalles de Venta (sale_details)
export const saleDetails = pgTable("sale_details", {
    id: varchar("id", { length: 128 }).primaryKey(),
    ventaId: varchar("venta_id", { length: 128 })
        .notNull()
        .references(() => sales.id),
    productoId: varchar("producto_id", { length: 128 })
        .notNull()
        .references(() => products.id),
    cantidad: integer("cantidad").notNull(),
    precioUnitario: decimal("precio_unitario", { precision: 15, scale: 2 }).notNull(),
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
        fields: [purchases.productoId],
        references: [products.id],
    }),
    provider: one(providers, {
        fields: [purchases.proveedorId],
        references: [providers.id],
    }),
}));

export const salesRelations = relations(sales, ({ many }) => ({
    details: many(saleDetails),
}));

export const saleDetailsRelations = relations(saleDetails, ({ one }) => ({
    sale: one(sales, {
        fields: [saleDetails.ventaId],
        references: [sales.id],
    }),
    product: one(products, {
        fields: [saleDetails.productoId],
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
