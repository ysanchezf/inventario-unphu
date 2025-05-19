// pages/api/admin/items/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Autorización: extraemos token de la cookie
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return res.status(401).json({ message: 'No autorizado' })
  }
  // 2) Comprobamos rol ADMIN
  if ((token as any).rol !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  if (req.method === 'GET') {
    // Listar items
    const items = await prisma.item.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        cantidadTotal: true,
        cantidadDisponible: true,
        departamentoId: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return res.status(200).json(items)
  }

  if (req.method === 'POST') {
    const { nombre, descripcion, cantidadTotal, departamentoId } = req.body
    if (!nombre || !cantidadTotal || !departamentoId) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }

    try {
      const newItem = await prisma.item.create({
        data: {
          nombre,
          descripcion: descripcion || undefined,
          cantidadTotal: Number(cantidadTotal),
          cantidadDisponible: Number(cantidadTotal),
          departamento: { connect: { id: Number(departamentoId) } },
        },
      })
      return res.status(201).json(newItem)
    } catch (err: any) {
      console.error(err)
      return res.status(500).json({ message: 'Error interno al crear equipo' })
    }
  }

  // Métodos no permitidos
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end()
}
