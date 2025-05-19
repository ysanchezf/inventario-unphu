// pages/api/admin/users/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import bcrypt from 'bcrypt'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req })
  if (!session || (session.user as any).role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const id = Number(req.query.id)
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID inválido' })
  }

  if (req.method === 'PATCH') {
    const { role, resetPassword, newPassword } = req.body as {
      role?: string
      resetPassword?: boolean
      newPassword?: string
    }

    try {
      const data: any = {}
      if (role) {
        data.rol = role
      }
      if (resetPassword) {
        const pwd = newPassword || 'ChangeMe123'
        const hash = await bcrypt.hash(pwd, 10)
        data.password = hash
      }

      await prisma.usuario.update({
        where: { id },
        data,
      })

      return res.status(200).json({ message: 'Usuario actualizado' })
    } catch (e) {
      console.error(e)
      return res.status(500).json({ message: 'Error interno' })
    }
  }

  res.setHeader('Allow', ['PATCH'])
  return res.status(405).end()
}
