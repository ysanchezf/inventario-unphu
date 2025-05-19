import { z } from 'zod';

export const DepartamentoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
});

export const SolicitudCreateSchema = z.object({
  itemId: z.number().int(),
  fechaUso: z.string().refine((s) => !isNaN(Date.parse(s)), "Fecha inválida"),
  horaInicio: z.string().refine((s) => !isNaN(Date.parse(s)), "Hora inválida"),
  horaFin: z.string().refine((s) => !isNaN(Date.parse(s)), "Hora inválida"),
  motivo: z.string().min(1, "Debe indicar un motivo"),
});

export const SolicitudUpdateSchema = z.object({
  estado: z.enum(["APROBADA", "RECHAZADA", "FINALIZADA"]),
  comentarios: z.string().optional(),
});
