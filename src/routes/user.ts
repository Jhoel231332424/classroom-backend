import express from "express";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../db/index.js";
import { user } from "../db/schema/index.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre o email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filtrar por rol
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
 *         description: Lista de usuarios
 */
router.get("/", async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;

        const currentPage = Math.max(1, parseInt(String(page), 10) || 1);
        const limitPerPage = Math.min(
            Math.max(1, parseInt(String(limit), 10) || 10),
            100
        );
        const offset = (currentPage - 1) * limitPerPage;

        const filterConditions = [];

        if (search) {
            filterConditions.push(
                or(
                    ilike(user.name, `%${search}%`),
                    ilike(user.email, `%${search}%`)
                )
            );
        }

        if (role) {
            filterConditions.push(eq(user.role, String(role) as "super_admin" | "admin"));
        }

        const whereClause =
            filterConditions.length > 0 ? and(...filterConditions) : undefined;

        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(user)
            .where(whereClause);

        const totalCount = Number(countResult[0]?.count ?? 0);

        const usersList = await db
            .select()
            .from(user)
            .where(whereClause)
            .orderBy(desc(user.createdAt))
            .limit(limitPerPage)
            .offset(offset);

        res.status(200).json({
            data: usersList,
            pagination: {
                page: currentPage,
                limit: limitPerPage,
                total: totalCount,
                totalPages: Math.ceil(totalCount / limitPerPage),
            },
        });
    } catch (error) {
        console.error("GET /users error:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const userId = req.params.id;

        const [userRecord] = await db
            .select()
            .from(user)
            .where(eq(user.id, userId))
            .limit(1);

        if (!userRecord) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.status(200).json({ data: userRecord });
    } catch (error) {
        console.error("GET /users/:id error:", error);
        res.status(500).json({ error: "Failed to fetch user" });
    }
});

export default router;