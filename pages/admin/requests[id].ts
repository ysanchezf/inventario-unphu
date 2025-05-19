// pages/api/admin/requests/[id].ts
import { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req })
  if (!session || (session.user as any).role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const id = Number(req.query.id)
  if (req.method === 'PATCH') {
    const { estado } = req.body as { estado: string }
    await prisma.solicitud.update({
      where: { id },
      data: { estado },
    })
    return res.status(200).end()
  }

  res.setHeader('Allow', ['PATCH'])
  res.status(405).end()
}
