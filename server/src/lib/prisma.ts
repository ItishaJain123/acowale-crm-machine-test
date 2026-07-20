import { PrismaClient } from "@prisma/client";

// Single shared Prisma client instance for the whole app.
// Avoids exhausting DB connections when modules import it repeatedly.
export const prisma = new PrismaClient();
