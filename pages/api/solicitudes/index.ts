// pages/api/solicitudes/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Autorización
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return res.status(401).json({ message: 'No autorizado' })
  const userId = Number(token.sub)

  // 2) Recupero departamento del usuario
  const usr = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { departamentoId: true }
  })
  const deptoId = usr?.departamentoId

  if (req.method === 'GET') {
    // 3) Leo filtros de la query
    const q      = Array.isArray(req.query.q)      ? req.query.q[0]      : req.query.q
    const estado = Array.isArray(req.query.estado) ? req.query.estado[0] : req.query.estado

    // 4) Armo cláusula OR de “propias o de mi depto”
    const baseOr: any[] = [
      { usuarioId: userId },
      ...(deptoId != null ? [{ item: { departamentoId: deptoId } }] : [])
    ]

    // 5) Armo condiciones adicionales
    const and: any[] = []
    if (q)      and.push({ item: { nombre: { contains: q, mode: 'insensitive' } } })
    if (estado) and.push({ estado })

    // 6) Combino todo
    const where = {
      AND: [
        { OR: baseOr },
        ...and
      ]
    }

    // 7) Traigo y aplanamiento
    const raw = await prisma.solicitud.findMany({
      where,
      include: {
        item: {
          select: {
            nombre: true,
            departamento: { select: { nombre: true }}
          }
        },
        usuario: { select: { nombre: true, apellido: true }}
      },
      orderBy: { fechaSolicitud: 'desc' }
    })
    const lista = raw.map(s => ({
      id:             s.id,
      motivo:         s.motivo,
      estado:         s.estado,
      fechaSolicitud: s.fechaSolicitud.toISOString(),
      item: {
        nombre:       s.item.nombre,
        departamento: s.item.departamento.nombre
      },
      usuario: {
        nombre:   s.usuario.nombre,
        apellido: s.usuario.apellido
      }
    }))
    return res.status(200).json(lista)
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end()
}
