// pages/admin/index.tsx
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import Layout from '../../components/Layout'
import Link from 'next/link'
import {
  FiFileText,
  FiUserPlus,
  FiHome,
  FiBox,
  FiClipboard,
} from 'react-icons/fi'

type Props = {
  name: string
}

export default function AdminDashboard({ name }: Props) {
  return (
    <Layout>
      <section className="app-container" style={{ padding: '2rem 1rem' }}>
        <h2>¡Bienvenido, {name}!</h2>
        <p style={{ color: '#555' }}>Panel de Administración</p>
      </section>
<section className="app-container" style={{ padding: '1rem 0' }}>
        <button
          className="btn-primary"
          onClick={() => window.open('/api/report')}
        >
          Descargar Reporte PDF
        </button>
      </section>
      <section className="features">
        <Link href="/admin/requests" className="card-wrapper">
          <div className="card">
            <FiFileText size={32} color="#3498db" />
            <h4>Solicitudes</h4>
            <p>Revisar y aprobar/rechazar</p>
          </div>
        </Link>
        <Link href="/admin/users" className="card-wrapper">
          <div className="card">
            <FiUserPlus size={32} color="#16A085" />
            <h4>Usuarios</h4>
            <p>Crear y gestionar usuarios</p>
          </div>
        </Link>
        <Link href="/admin/departments" className="card-wrapper">
          <div className="card">
            <FiHome size={32} color="#f39c12" />
            <h4>Departamentos</h4>
            <p>Crear/editar departamentos</p>
          </div>
        </Link>
        <Link href="/admin/items" className="card-wrapper">
          <div className="card">
            <FiBox size={32} color="#2ecc71" />
            <h4>Equipos</h4>
            <p>Registrar/editar equipos</p>
          </div>
        </Link>
<Link href="/admin/audit" className="card-wrapper">
  <div className="card">
    <FiClipboard size={32} color="#9b59b6" />
    <h4>Auditoría</h4>
    <p>Ver historial de cambios</p>
  </div>
</Link>

      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  // 1) Comprobamos sesión y rol
  const session = await getSession(ctx)
  if (!session?.user || (session.user as any).rol !== 'ADMIN') {
    return { redirect: { destination: '/', permanent: false } }
  }

  // 2) Import dinámico de Prisma en servidor
  const { prisma } = await import('../../lib/prisma')

  // 3) Obtenemos el nombre para el saludo
  const user = await prisma.usuario.findUnique({
    where: { email: session.user.email! },
  })
  if (!user) {
    return { redirect: { destination: '/', permanent: false } }
  }

  return {
    props: {
      name: user.nombre,
    },
  }
}
