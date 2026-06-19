import { Router } from "express";
import { db } from "../db/index.js";
import { products, sales, saleDetails } from "../db/schema/app.js";
import { eq, sql } from "drizzle-orm";
import crypto from "node:crypto";

const router = Router();

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Registra una nueva venta con sus detalles
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modoVenta
 *               - detalles
 *             properties:
 *               modoVenta:
 *                 type: string
 *                 enum: [local, viaje]
 *               detalles:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productoId
 *                     - cantidad
 *                     - precioCobrado
 *                   properties:
 *                     productoId:
 *                       type: string
 *                     cantidad:
 *                       type: integer
 *                     precioCobrado:
 *                       type: number
 *     responses:
 *       201:
 *         description: Venta registrada exitosamente
 *       400:
 *         description: Stock insuficiente o datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post("/", async (req, res) => {
    try {
        const { modoVenta, detalles } = req.body;

        if (!modoVenta || !detalles || !Array.isArray(detalles) || detalles.length === 0) {
            res.status(400).json({ error: "Datos de venta inválidos" });
            return;
        }

        const result = await db.transaction(async (tx) => {
            let totalMontoSugerido = 0;
            let totalMontoCobrado = 0;
            let totalCostoRealVenta = 0;
            let totalUtilidadNeta = 0;
            let totalDiferenciaRedondeo = 0;

            const itemsToInsert = [];
            const saleId = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex');

            for (const detalle of detalles) {
                const { productoId, cantidad, precioCobrado } = detalle;

                // 1. Obtener producto y verificar stock
                const [product] = await tx.select().from(products).where(eq(products.id, productoId)).limit(1);

                if (!product) {
                    throw new Error(`Producto ${productoId} no encontrado`);
                }

                if (product.stockDisponible < cantidad) {
                    throw new Error(`Stock insuficiente para el producto ${product.nombre}`);
                }

                const margen = modoVenta === 'local' ? Number(product.margenLocal) : Number(product.margenViaje);
                const costoUnitario = Number(product.costoUnitarioReal);
                
                // Lógica de precio sugerido: costo + margen
                const precioSugeridoUnitario = costoUnitario + margen;
                const montoSugeridoDetalle = precioSugeridoUnitario * cantidad;
                const montoCobradoDetalle = Number(precioCobrado) * cantidad;
                const costoTotalDetalle = costoUnitario * cantidad;
                const utilidadNetaDetalle = montoCobradoDetalle - costoTotalDetalle;
                const diferenciaRedondeoDetalle = montoSugeridoDetalle - montoCobradoDetalle;

                totalMontoSugerido += montoSugeridoDetalle;
                totalMontoCobrado += montoCobradoDetalle;
                totalCostoRealVenta += costoTotalDetalle;
                totalUtilidadNeta += utilidadNetaDetalle;
                totalDiferenciaRedondeo += diferenciaRedondeoDetalle;

                itemsToInsert.push({
                    id: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex'),
                    ventaId: saleId,
                    productoId,
                    cantidad,
                    precioUnitario: precioCobrado.toString(),
                    subtotal: montoCobradoDetalle.toFixed(2),
                });

                // 2. Actualizar stock del producto
                await tx.update(products)
                    .set({
                        stockDisponible: sql`${products.stockDisponible} - ${cantidad}`,
                    })
                    .where(eq(products.id, productoId));
            }

            // 3. Insertar cabecera de venta
            await tx.insert(sales).values({
                id: saleId,
                modoVenta,
                montoSugerido: totalMontoSugerido.toFixed(2),
                montoCobrado: totalMontoCobrado.toFixed(2),
                diferenciaRedondeo: totalDiferenciaRedondeo.toFixed(2),
                costoRealVenta: totalCostoRealVenta.toFixed(2),
                utilidadNeta: totalUtilidadNeta.toFixed(2),
                estado: "confirmada",
            });

            // 4. Insertar detalles
            await tx.insert(saleDetails).values(itemsToInsert);

            return { saleId };
        });

        res.status(201).json({ message: "Venta registrada exitosamente", saleId: result.saleId });
    } catch (error: any) {
        console.error("Error en POST /api/sales:", error);
        const status = error.message?.includes("insuficiente") || error.message?.includes("no encontrado") ? 400 : 500;
        res.status(status).json({ error: error.message || "Error interno al registrar la venta" });
    }
});

export default router;
