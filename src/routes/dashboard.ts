import { Router } from "express";
import { db } from "../db/index.js";
import { products, sales } from "../db/schema/app.js";
import { eq, sql, and, gte, lte } from "drizzle-orm";

const router = Router();

/**
 * @swagger
 * /api/dashboard/daily:
 *   get:
 *     summary: Obtiene métricas financieras del día y valor total del inventario
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Métricas financieras calculadas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ingresos_brutos:
 *                   type: number
 *                 utilidad_neta_dia:
 *                   type: number
 *                 cantidad_operaciones:
 *                   type: integer
 *                 fuga_por_redondeos:
 *                   type: number
 *                 capital_invertido:
 *                   type: number
 *       500:
 *         description: Error interno del servidor
 */
router.get("/daily", async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Métricas del Día (Ventas de HOY confirmadas)
        const dailyMetrics = await db
            .select({
                ingresos_brutos: sql<number>`COALESCE(SUM(${sales.montoCobrado}), 0)`,
                utilidad_neta_dia: sql<number>`COALESCE(SUM(${sales.utilidadNeta}), 0)`,
                cantidad_operaciones: sql<number>`COUNT(${sales.id})`,
                fuga_por_redondeos: sql<number>`COALESCE(SUM(${sales.diferenciaRedondeo}), 0)`,
            })
            .from(sales)
            .where(
                and(
                    eq(sales.estado, "confirmada"),
                    gte(sales.fechaVenta, today),
                    lte(sales.fechaVenta, tomorrow)
                )
            );

        // 2. Métrica de Inventario Global
        const inventoryMetric = await db
            .select({
                capital_invertido: sql<number>`COALESCE(SUM(${products.stockDisponible} * ${products.costoUnitarioReal}), 0)`,
            })
            .from(products);

        const result = {
            ...dailyMetrics[0],
            capital_invertido: inventoryMetric[0]?.capital_invertido || 0,
        };

        // Convertir strings de decimales (si los hay) a números
        res.json({
            ingresos_brutos: Number(result.ingresos_brutos),
            utilidad_neta_dia: Number(result.utilidad_neta_dia),
            cantidad_operaciones: Number(result.cantidad_operaciones),
            fuga_por_redondeos: Number(result.fuga_por_redondeos),
            capital_invertido: Number(result.capital_invertido),
        });
    } catch (error) {
        console.error("Error en GET /api/dashboard/daily:", error);
        res.status(500).json({ error: "Error interno al calcular métricas del dashboard" });
    }
});

export default router;
