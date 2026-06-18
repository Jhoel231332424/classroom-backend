import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "../db/index.js"; // your drizzle instance
import * as schema from "../db/schema/auth.js";

if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is not set in .env");
}

if (!process.env.BETTER_AUTH_URL) {
    throw new Error("BETTER_AUTH_URL is not set in .env");
}

if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not set in .env");
}

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    trustedOrigins: [process.env.FRONTEND_URL!],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: "student",
                input: true, // Allow role to be set during registration
            },
            imageCldPubId: {
                type: "string",
                required: false,
                input: true, // Allow imageCldPubId to be set during registration
            },
        },
    },
});
