// pages/api/admin/requests/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import { prisma } from '../../../../lib/prisma'
import { sendStatusEmail } from '../../../../lib/mailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH'])
    return res.status(405).end()
  }

  // 1) Autorización vía JWT
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return res.status(401).json({ message: 'No autorizado' })
  const userId = Number(token.sub)
  const role   = (token as any).rol
  if (isNaN(userId)) return res.status(401).json({ message: 'Token inválido' })

  // 2) ID válido
  const rawId       = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id
  const solicitudId = Number(rawId)
  if (isNaN(solicitudId)) {
    return res.status(400).json({ message: 'ID de solicitud inválido' })
  }

  // 3) Estado válido
  const { estado } = req.body as { estado: 'APROBADA' | 'RECHAZADA' }
  if (!['APROBADA', 'RECHAZADA'].includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido' })
  }

  // 4) Cargo la solicitud con departamento→usuarios
  const sol = await prisma.solicitud.findUnique({
    where: { id: solicitudId },
    include: {
      usuario: true,
      item: {
        include: {
          departamento: {
            include: { usuarios: { select: { id: true } } }
          }
        }
      }
    }
  })
  if (!sol) {
    return res.status(404).json({ message: 'Solicitud no encontrada' })
  }

  // 5) Verifico permisos
  const deptUsers = sol.item.departamento.usuarios.map(u => u.id)
  if (role !== 'ADMIN' && !deptUsers.includes(userId)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  // 6) Preparo la transacción:
  //    - Si es APROBADA, decremento stock.
  //    - Creo el auditLog.
  //    - **AL FINAL** actualizo la solicitud (para que siempre sea el último elemento).
  const tx: Array<Promise<any>> = []

  if (estado === 'APROBADA') {
    tx.push(
      prisma.item.update({
        where: { id: sol.item.id },
        data: { cantidadDisponible: { decrement: 1 } },
      })
    )
  }

  tx.push(
    prisma.auditLog.create({
      data: {
        userId,
        action:    estado === 'APROBADA' ? 'APROBAR' : 'RECHAZAR',
        entity:    'Solicitud',
        entityId:  solicitudId,
        timestamp: new Date(),
        changes: {
          estadoAnterior: sol.estado,
          estadoNuevo:    estado,
        },
      }
    })
  )

  // **SIEMPRE AL FINAL**:
  tx.push(
    prisma.solicitud.update({
      where: { id: solicitudId },
      data:  { estado },
      include: {
        usuario: { select: { nombre: true, email: true } },
        item:    { select: { nombre: true } }
      }
    })
  )

  // 7) Ejecuto la transacción y tomo el último elemento:
  const results = await prisma.$transaction(tx)
  const updated = results[results.length - 1] as {
    id: number
    estado: string
    usuario: { nombre: string; email: string }
    item:    { nombre: string }
  }

  // 8) Armo asunto y cuerpo según APROBADA / RECHAZADA
  const subject = estado === 'APROBADA'
    ? '¡Tu solicitud ha sido aprobada!'
    : 'Lo sentimos, tu solicitud ha sido rechazada'
  const htmlBody = estado === 'APROBADA'
    ? `<p>Hola ${updated.usuario.nombre},</p>
       <p>Tu solicitud para el equipo "<strong>${updated.item.nombre}</strong>" ha sido <strong>aprobada</strong>.</p>
       <p>¡Gracias por usar Inventario UNPHU!</p>`
    : `<p>Hola ${updated.usuario.nombre},</p>
       <p>Tu solicitud para el equipo "<strong>${updated.item.nombre}</strong>" ha sido <strong>rechazada</strong>.</p>
       <p>Si tienes dudas, contacta con el administrador de tu departamento.</p>
       <p>¡Gracias por usar Inventario UNPHU!</p>`

  // 9) Envío correo (no aborta si falla)
  try {
    await sendStatusEmail(updated.usuario.email, subject, htmlBody)
  } catch (e) {
    console.error('Error enviando correo de estado:', e)
  }

  // 10) Respondo al cliente
  return res.status(200).json({
    message: 'Estado actualizado correctamente',
    solicitud: { id: updated.id, estado: updated.estado }
  })
}
