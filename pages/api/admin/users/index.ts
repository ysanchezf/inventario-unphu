// pages/api/admin/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import bcrypt from 'bcrypt'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Autorización vía JWT
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return res.status(401).json({ message: 'No autorizado' })
  if ((token as any).rol !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  // 2) GET /api/admin/users → lista usuarios
  if (req.method === 'GET') {
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        matricula: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
      },
      orderBy: { nombre: 'asc' },
    })
    return res.status(200).json(users)
  }

  // 3) POST /api/admin/users → crea usuario
  if (req.method === 'POST') {
    const { matricula, nombre, apellido, email, rol, password } = req.body
    if (!matricula || !nombre || !apellido || !email || !rol || !password) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }
    try {
      const hash = await bcrypt.hash(password, 10)
      const created = await prisma.usuario.create({
        data: { matricula, nombre, apellido, email, rol, password: hash, confirmed: true },
        select: {
          id: true,
          matricula: true,
          nombre: true,
          apellido: true,
          email: true,
          rol: true,
        },
      })
      return res.status(201).json(created)
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ message: 'Error al crear usuario' })
    }
  }

  // 4) Métodos no permitidos
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).end()
}
