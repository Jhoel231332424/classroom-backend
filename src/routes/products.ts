import { Router } from "express";
import { db } from "../db/index.js";
import { products } from "../db/schema/app.js";
import { eq, ilike, or, sql, desc } from "drizzle-orm";
import crypto from "node:crypto";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         nombre:
 *           type: string
 *         margenLocal:
 *           type: number
 *         margenViaje:
 *           type: number
 *         stockDisponible:
 *           type: integer
 *         costoUnitarioReal:
 *           type: number
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtener todos los productos con paginación
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre
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
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
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
        const { search, page = 1, limit = 10 } = req.query;
        const currentPage = Math.max(1, Number(page));
        const limitPerPage = Math.max(1, Number(limit));
        const offset = (currentPage - 1) * limitPerPage;

        const whereClause = search ? ilike(products.nombre, `%${search}%`) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(products)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count ?? 0);

        const data = await db
            .select()
            .from(products)
            .where(whereClause)
            .orderBy(desc(products.fechaCreacion))
            .limit(limitPerPage)
            .offset(offset);

        // Convertir strings decimales a números
        const formattedData = data.map(p => ({
            ...p,
            margenLocal: Number(p.margenLocal),
            margenViaje: Number(p.margenViaje),
            costoUnitarioReal: Number(p.costoUnitarioReal),
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
        console.error("Error en GET /api/products:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear un nuevo producto
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - margenLocal
 *               - margenViaje
 *               - costoUnitarioReal
 *             properties:
 *               nombre:
 *                 type: string
 *               margenLocal:
 *                 type: number
 *               margenViaje:
 *                 type: number
 *               costoUnitarioReal:
 *                 type: number
 *               stockDisponible:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Producto creado
 */
router.post("/", async (req, res) => {
    try {
        const { nombre, margenLocal, margenViaje, costoUnitarioReal, stockDisponible } = req.body;
        const id = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex');

        const [newProduct] = await db.insert(products).values({
            id,
            nombre,
            margenLocal: margenLocal.toString(),
            margenViaje: margenViaje.toString(),
            costoUnitarioReal: costoUnitarioReal.toString(),
            stockDisponible: stockDisponible || 0,
        }).returning();

        res.status(201).json({
            ...newProduct,
            margenLocal: Number(newProduct.margenLocal),
            margenViaje: Number(newProduct.margenViaje),
            costoUnitarioReal: Number(newProduct.costoUnitarioReal),
        });
    } catch (error) {
        console.error("Error en POST /api/products:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del producto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Producto no encontrado
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);

        if (!product) {
            res.status(404).json({ error: "Producto no encontrado" });
            return;
        }

        res.json({
            ...product,
            margenLocal: Number(product.margenLocal),
            margenViaje: Number(product.margenViaje),
            costoUnitarioReal: Number(product.costoUnitarioReal),
        });
    } catch (error) {
        console.error("Error en GET /api/products/:id:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar un producto existente
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               margenLocal:
 *                 type: number
 *               margenViaje:
 *                 type: number
 *               costoUnitarioReal:
 *                 type: number
 *               stockDisponible:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Producto actualizado
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, margenLocal, margenViaje, costoUnitarioReal, stockDisponible } = req.body;

        const [updatedProduct] = await db.update(products)
            .set({
                nombre,
                margenLocal: margenLocal?.toString(),
                margenViaje: margenViaje?.toString(),
                costoUnitarioReal: costoUnitarioReal?.toString(),
                stockDisponible,
            })
            .where(eq(products.id, id))
            .returning();

        if (!updatedProduct) {
            res.status(404).json({ error: "Producto no encontrado" });
            return;
        }

        res.json({
            ...updatedProduct,
            margenLocal: Number(updatedProduct.margenLocal),
            margenViaje: Number(updatedProduct.margenViaje),
            costoUnitarioReal: Number(updatedProduct.costoUnitarioReal),
        });
    } catch (error) {
        console.error("Error en PUT /api/products/:id:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto eliminado
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [deletedProduct] = await db.delete(products).where(eq(products.id, id)).returning();

        if (!deletedProduct) {
            res.status(404).json({ error: "Producto no encontrado" });
            return;
        }

        res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
        console.error("Error en DELETE /api/products/:id:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

export default router;
