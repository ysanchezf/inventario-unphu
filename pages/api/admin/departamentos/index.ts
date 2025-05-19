// pages/api/admin/departamentos/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Autorización
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return res.status(401).json({ message: 'No autorizado' })
  if ((token as any).rol !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' })

  // 2) Listar departamentos
  if (req.method === 'GET') {
    const deps = await prisma.departamento.findMany({
      include: { usuarios: { select: { id: true } } },
      orderBy: { nombre: 'asc' },
    })
    return res.status(200).json(deps)
  }

  // 3) Crear nuevo departamento
  if (req.method === 'POST') {
    const { nombre, descripcion } = req.body
    if (!nombre) {
      return res.status(400).json({ message: 'Falta nombre' })
    }
    try {
      const created = await prisma.departamento.create({
        data: { nombre, descripcion: descripcion || undefined },
      })
      return res.status(201).json(created)
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ message: 'Error al crear departamento' })
    }
  }

  // Métodos no permitidos
  res.setHeader('Allow', ['GET','POST'])
  return res.status(405).end()
}
