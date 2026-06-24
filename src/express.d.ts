declare global {
    namespace Express {
        interface Request {
            user?: {
                role?: "super_admin" | "admin";
            };
        }
    }
}

export {};
