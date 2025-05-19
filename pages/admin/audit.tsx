// pages/admin/audit.tsx
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import Layout from '../../components/Layout'
import { prisma } from '../../lib/prisma'

type Log = {
  id: number
  user: { nombre: string }
  action: string
  entity: string
  entityId: number
  timestamp: string
}

type Props = { logs: Log[] }

export default function AuditPage({ logs }: Props) {
  return (
    <Layout>
      <section className="app-container">
        <h2>Historial de Auditoría</h2>
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Entidad</th>
              <th>Entidad ID</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td>{new Date(l.timestamp).toLocaleString()}</td>
                <td>{l.user.nombre}</td>
                <td>{l.action}</td>
                <td>{l.entity}</td>
                <td>{l.entityId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const session = await getSession(ctx)
  if (!session?.user || (session.user as any).rol !== 'ADMIN') {
    return { redirect: { destination: '/', permanent: false } }
  }
  const raw = await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
    include: { user: { select: { nombre: true } } }
  })
  // Serializa fechas
  const logs = raw.map(l => ({ ...l, timestamp: l.timestamp.toISOString() }))
  return { props: { logs } }
}
