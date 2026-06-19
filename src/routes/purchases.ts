import { Router } from "express";
import { db } from "../db/index.js";
import { products, purchases } from "../db/schema/app.js";
import { eq, sql } from "drizzle-orm";
import crypto from "node:crypto";

const router = Router();

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
