// pages/api/items.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const deptId = parseInt(req.query.departamentoId as string)
  if (isNaN(deptId)) return res.status(400).json({ message: 'Departamento inválido' })

  const items = await prisma.item.findMany({
    where: { departamentoId: deptId, cantidadDisponible: { gt: 0 } },
    orderBy: { nombre: 'asc' },
  })
  res.json(items.map(({ id, nombre }) => ({ id, nombre })))
}
