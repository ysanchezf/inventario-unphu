// pages/api/admin/items/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return res.status(401).json({ message: 'No autorizado' })
  }
  if ((token as any).rol !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const { id } = req.query
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }
  const itemId = Number(id)

  if (req.method === 'PATCH') {
    const { nombre, descripcion, cantidadTotal, departamentoId } = req.body
    if (!nombre || !cantidadTotal || !departamentoId) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }
    try {
      const updated = await prisma.item.update({
        where: { id: itemId },
        data: {
          nombre,
          descripcion: descripcion || undefined,
          cantidadTotal: Number(cantidadTotal),
          cantidadDisponible: Number(cantidadTotal), // o ajusta si quieres conservar disponible
          departamento: { connect: { id: Number(departamentoId) } },
        },
      })
      return res.status(200).json(updated)
    } catch (err: any) {
      console.error(err)
      return res.status(500).json({ message: 'Error interno al actualizar equipo' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      await prisma.item.delete({ where: { id: itemId } })
      return res.status(204).end()
    } catch (err: any) {
      console.error(err)
      return res.status(500).json({ message: 'Error interno al eliminar equipo' })
    }
  }

  res.setHeader('Allow', ['PATCH', 'DELETE'])
  return res.status(405).end()
}
