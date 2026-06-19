import { Router } from "express";
import { db } from "../db/index.js";
import { products, purchases } from "../db/schema/app.js";
import { eq, sql, desc } from "drizzle-orm";
import crypto from "node:crypto";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Purchase:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         productoId:
 *           type: string
 *         proveedorId:
 *           type: string
 *         costoTotalCaja:
 *           type: number
 *         unidadesPorCaja:
 *           type: integer
 *         cantidadCajas:
 *           type: integer
 *         costoUnitarioCalculado:
 *           type: number
 *         fechaIngreso:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Obtener el historial de compras (ingresos de mercadería)
 *     tags: [Purchases]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de compras
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Purchase'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const currentPage = Math.max(1, Number(page));
        const limitPerPage = Math.max(1, Number(limit));
        const offset = (currentPage - 1) * limitPerPage;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(purchases);

        const totalCount = Number(countResult[0]?.count ?? 0);

        const data = await db
            .select()
            .from(purchases)
            .orderBy(desc(purchases.fechaIngreso))
            .limit(limitPerPage)
            .offset(offset);

        // Convertir strings decimales a números
        const formattedData = data.map(p => ({
            ...p,
            costoTotalCaja: Number(p.costoTotalCaja),
            costoUnitarioCalculado: Number(p.costoUnitarioCalculado),
        }));

        res.json({
            data: formattedData,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (error) {
        console.error("Error en GET /api/purchases:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * @swagger
 * /api/purchases:
 *   post:
 *     summary: Registra un ingreso de mercadería (compra)
 *     tags: [Purchases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productoId
 *               - proveedorId
 *               - costoTotalCaja
 *               - unidadesPorCaja
 *               - cantidadCajas
 *             properties:
 *               productoId:
 *                 type: string
 *               proveedorId:
 *                 type: string
 *               costoTotalCaja:
 *                 type: number
 *               unidadesPorCaja:
 *                 type: integer
 *               cantidadCajas:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Compra registrada exitosamente
 *       400:
 *         description: Error en los datos enviados
 *       500:
 *         description: Error interno del servidor
 */
router.post("/", async (req, res) => {
    try {
        const { productoId, proveedorId, costoTotalCaja, unidadesPorCaja, cantidadCajas } = req.body;

        if (!productoId || !proveedorId || !costoTotalCaja || !unidadesPorCaja || !cantidadCajas) {
            res.status(400).json({ error: "Faltan campos obligatorios" });
            return;
        }

        const costoUnitarioCalculado = Number(costoTotalCaja) / Number(unidadesPorCaja);
        const totalUnidades = Number(unidadesPorCaja) * Number(cantidadCajas);

        await db.transaction(async (tx) => {
            // 1. Insertar el registro en la tabla purchases
            await tx.insert(purchases).values({
                id: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex'), // Simulación de id único si no hay cuid2 helper a mano, o usar el que prefiera el sistema. En este caso generamos uno.
                productoId,
                proveedorId,
                costoTotalCaja: costoTotalCaja.toString(),
                unidadesPorCaja,
                cantidadCajas,
                costoUnitarioCalculado: costoUnitarioCalculado.toFixed(4),
            });

            // 2. Actualizar el producto: Sumar stock y actualizar costo_unitario_real
            await tx.update(products)
                .set({
                    stockDisponible: sql`${products.stockDisponible} + ${totalUnidades}`,
                    costoUnitarioReal: costoUnitarioCalculado.toFixed(4),
                })
                .where(eq(products.id, productoId));
        });

        res.status(201).json({ message: "Compra registrada y stock actualizado correctamente" });
    } catch (error) {
        console.error("Error en POST /api/purchases:", error);
        res.status(500).json({ error: "Error interno al registrar la compra" });
    }
});

export default router;
