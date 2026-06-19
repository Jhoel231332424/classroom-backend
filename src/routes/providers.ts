import { Router } from "express";
import { db } from "../db/index.js";
import { providers } from "../db/schema/app.js";
import { eq, ilike, sql, desc } from "drizzle-orm";
import crypto from "node:crypto";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Provider:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         nombre:
 *           type: string
 *         telefono:
 *           type: string
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/providers:
 *   get:
 *     summary: Obtener todos los proveedores con paginación
 *     tags: [Providers]
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
 *         description: Lista de proveedores
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Provider'
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

        const whereClause = search ? ilike(providers.nombre, `%${search}%`) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(providers)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count ?? 0);

        const data = await db
            .select()
            .from(providers)
            .where(whereClause)
            .orderBy(desc(providers.fechaCreacion))
            .limit(limitPerPage)
            .offset(offset);

        res.json({
            data,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (error) {
        console.error("Error en GET /api/providers:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * @swagger
 * /api/providers:
 *   post:
 *     summary: Crear un nuevo proveedor
 *     tags: [Providers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               telefono:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proveedor creado
 */
router.post("/", async (req, res) => {
    try {
        const { nombre, telefono } = req.body;
        const id = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex');

        const [newProvider] = await db.insert(providers).values({
            id,
            nombre,
            telefono,
        }).returning();

        res.status(201).json(newProvider);
    } catch (error) {
        console.error("Error en POST /api/providers:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * @swagger
 * /api/providers/{id}:
 *   put:
 *     summary: Actualizar un proveedor existente
 *     tags: [Providers]
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
 *               telefono:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 */
router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono } = req.body;

        const [updatedProvider] = await db.update(providers)
            .set({
                nombre,
                telefono,
            })
            .where(eq(providers.id, id))
            .returning();

        if (!updatedProvider) {
            res.status(404).json({ error: "Proveedor no encontrado" });
            return;
        }

        res.json(updatedProvider);
    } catch (error) {
        console.error("Error en PUT /api/providers/:id:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

/**
 * @swagger
 * /api/providers/{id}:
 *   delete:
 *     summary: Eliminar un proveedor
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Proveedor eliminado
 */
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [deletedProvider] = await db.delete(providers).where(eq(providers.id, id)).returning();

        if (!deletedProvider) {
            res.status(404).json({ error: "Proveedor no encontrado" });
            return;
        }

        res.json({ message: "Proveedor eliminado correctamente" });
    } catch (error) {
        console.error("Error en DELETE /api/providers/:id:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

export default router;
