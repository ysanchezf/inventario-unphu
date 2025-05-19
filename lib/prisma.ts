// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  // para evitar múltiples instancias en desarrollo
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ['query', 'error'], // opcional: muestra las queries y errores
  });

// Reusa la instancia en desarrollo
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}
