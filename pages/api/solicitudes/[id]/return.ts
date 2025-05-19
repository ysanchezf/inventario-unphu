// pages/api/solicitudes/[id]/return.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken }            from 'next-auth/jwt'
import { prisma }              from '../../../../lib/prisma'
import { sendReturnEmail }     from '../../../../lib/mailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Sólo POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end()
  }

  // 2) Autorización usando JWT para poder obtener el id numérico
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return res.status(401).json({ message: 'No autorizado' })
  const userId = Number(token.sub)
  if (isNaN(userId)) return res.status(401).json({ message: 'Token inválido' })

  // 3) Parsea y valida el ID
  const idParam = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const solicitudId = Number(idParam)
  if (isNaN(solicitudId)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  // 4) Trae la solicitud con(item, usuario)
  const solicitud = await prisma.solicitud.findUnique({
    where: { id: solicitudId },
    include: {
      item:    { select: { id: true, nombre: true } },
      usuario: { select: { id: true, email: true, nombre: true } },
    },
  })
  if (!solicitud) {
    return res.status(404).json({ message: 'Solicitud no encontrada' })
  }
  if (solicitud.estado !== 'APROBADA') {
    return res.status(400).json({ message: 'Solo solicitudes aprobadas pueden devolverse' })
  }

  // 5) Transacción: marco como FINALIZADA, repongo stock y escribo auditLog
  try {
    await prisma.$transaction([
      prisma.solicitud.update({
        where: { id: solicitudId },
        data:  { estado: 'FINALIZADA' }              // <-- Sin “user: { … }”
      }),
      prisma.item.update({
        where: { id: solicitud.item.id },
        data:  { cantidadDisponible: { increment: 1 } }
      }),
      prisma.auditLog.create({
        data: {
          userId,                                     // sólo el escalar
          action:    'DEVOLVER',
          entity:    'Solicitud',
          entityId:  solicitudId,
          timestamp: new Date(),
          changes:   { nuevoEstado: 'FINALIZADA' }
        }
      })
    ])
  } catch (err) {
    console.error('Error en transacción de devolución:', err)
    return res.status(500).json({ message: 'Error al procesar la devolución' })
  }

  // 6) Envío de correo de devolución
  try {
    await sendReturnEmail(
      solicitud.usuario.email,
      solicitud.item.nombre
    )
  } catch (err) {
    console.error('Error enviando email de devolución:', err)
    // No abortamos la respuesta por un fallo en el correo
  }

  return res.status(200).json({ message: 'Devolución registrada y correo enviado' })
}
