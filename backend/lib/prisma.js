// ─── Prisma Client Singleton ─────────────────────────────────────────────────
// Prevents connection-pool exhaustion when nodemon reloads the server
// repeatedly during development. Import this file everywhere the database
// is accessed instead of instantiating `new PrismaClient()` directly.

const { PrismaClient } = require('@prisma/client');

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
