// pages/api/solicitud.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Autorización con JWT
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    return res.status(401).json({ message: 'No autorizado' })
  }
  const userId = parseInt(token.sub as string, 10)

  if (req.method === 'POST') {
    const { itemId, fechaUso, horaInicio, horaFin, motivo } = req.body

    // 2) Validaciones básicas
    if (!itemId || !fechaUso || !horaInicio || !horaFin || !motivo) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }

    try {
      // 3) Creamos la solicitud ligando usuario e ítem
      const nuevaSolicitud = await prisma.solicitud.create({
        data: {
          usuario:    { connect: { id: userId } },
          item:       { connect: { id: Number(itemId) } },
          fechaUso:   new Date(fechaUso),
          horaInicio: new Date(`${fechaUso}T${horaInicio}`),
          horaFin:    new Date(`${fechaUso}T${horaFin}`),
          motivo,
        },
        include: {
          usuario: { select: { id: true, nombre: true, apellido: true } },
          item: {
            select: {
              id: true,
              nombre: true,
              departamento: { select: { id: true, nombre: true } }
            }
          }
        }
      })
      return res.status(201).json(nuevaSolicitud)
    } catch (error: any) {
      console.error('Error al crear solicitud:', error)
      return res.status(500).json({ message: 'Error interno' })
    }
  }

  // 4) Métodos no permitidos
  res.setHeader('Allow', ['POST'])
  res.status(405).end()
}
