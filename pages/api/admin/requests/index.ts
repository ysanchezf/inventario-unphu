// pages/api/admin/requests/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return res.status(401).json({ message: 'No autorizado' })
  const userId = Number(token.sub)
  const role   = (token as any).rol

  if (req.method === 'GET') {
    // filtros
    const q      = Array.isArray(req.query.q)      ? req.query.q[0]      : req.query.q
    const estado = Array.isArray(req.query.estado) ? req.query.estado[0] : req.query.estado

    // baseWhere según rol
    const baseWhere = role === 'ADMIN'
      ? {}
      : { item: { departamento: { usuarios: { some: { id: userId } } } } }

    // condiciones extras
    const and: any[] = []
    if (q)      and.push({ item: { nombre: { contains: q, mode: 'insensitive' } } })
    if (estado) and.push({ estado })

    const where = Object.keys(baseWhere).length
      ? { AND: [ baseWhere, ...and ] }
      : { AND: and }

    const raw = await prisma.solicitud.findMany({
      where,
      include: {
        item: {
          select: {
            nombre: true,
            departamento: { select: { nombre: true } }
          }
        },
        usuario: { select: { nombre: true, apellido: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const solicitudes = raw.map(s => ({
      id:             s.id,
      motivo:         s.motivo,
      estado:         s.estado,
      fechaSolicitud: s.fechaSolicitud.toISOString(),
      item:           { nombre: s.item.nombre, departamento: s.item.departamento.nombre },
      usuario:        { nombre: s.usuario.nombre, apellido: s.usuario.apellido, email: s.usuario.email },
    }))
    return res.status(200).json(solicitudes)
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end()
}
