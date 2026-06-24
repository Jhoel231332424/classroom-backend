import express from "express";
import { desc, ilike, or, sql } from "drizzle-orm";

import { db } from "../db/index.js";
import { products } from "../db/schema/index.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(
            Math.max(1, parseInt(String(limit), 10) || 10),
            100
        );
        const offset = (currentPage - 1) * limitPerPage;

        const whereClause = search
            ? or(
                ilike(products.name, `%${search}%`),
                ilike(products.brand, `%${search}%`),
                ilike(products.sku, `%${search}%`),
                ilike(products.barcode, `%${search}%`)
            )
            : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count ?? 0);

        const productsList = await db
            .select()
            .from(products)
            .where(whereClause)
            .orderBy(desc(products.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: productsList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (error) {
        console.error("GET /products error:", error);
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id) {
            res.status(400).json({ error: "Invalid product id" });
            return;
        }

        const [product] = await db
            .select()
            .from(products)
            .where(sql`${products.id} = ${id}`)
            .limit(1);

        if (!product) {
            res.status(404).json({ error: "Product not found" });
            return;
        }

        res.status(200).json({ data: product });
    } catch (error) {
        console.error("GET /products/:id error:", error);
        res.status(500).json({ error: "Failed to fetch product" });
    }
});

router.post("/", async (req, res) => {
    try {
        const {
            name,
            brand,
            sku,
            barcode,
            description,
            baseUnit,
            attributes,
            currentStock,
            defaultMarginPercent,
            suggestedSalePrice,
            status,
        } = req.body;

        const [createdProduct] = await db
            .insert(products)
            .values({
                name,
                brand: brand || null,
                sku: sku || null,
                barcode: barcode || null,
                description: description || null,
                baseUnit: baseUnit || "unidad",
                attributes: attributes ?? null,
                currentStock: Number(currentStock ?? 0),
                defaultMarginPercent: String(defaultMarginPercent ?? "0"),
                suggestedSalePrice:
                    suggestedSalePrice === "" ||
                    suggestedSalePrice === null ||
                    suggestedSalePrice === undefined
                        ? null
                        : String(suggestedSalePrice),
                status: status || "active",
            })
            .returning();

        res.status(201).json({ data: createdProduct });
    } catch (error) {
        console.error("POST /products error:", error);
        res.status(500).json({ error: "Failed to create product" });
    }
});

export default router;