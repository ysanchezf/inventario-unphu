// pages/index.tsx
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import Link from 'next/link'
import Landing from '../components/Landing'
import Layout from '../components/Layout'
import { prisma } from '../lib/prisma'
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiClipboard,
} from 'react-icons/fi'

type Props = {
  name?: string
  counts?: Record<'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'FINALIZADA', number>
}

export default function Home({ name, counts }: Props) {
  const { data: session, status } = useSession()

  // Mientras carga la sesión, no renderizamos nada
  if (status === 'loading') return null

  // Si no hay sesión, mostramos la landing
  if (!session) {
    return <Landing />
  }

  // Si hay sesión, renderizamos el dashboard dentro de Layout
  return (
    <Layout>
      {/* Saludo y botón "Nueva Solicitud" */}
      <section className="app-container" style={{ padding: '2rem 1rem' }}>
        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          ¡Bienvenido, {name}!
        </h2>
        <p style={{ marginBottom: '1rem', color: '#555' }}>
          Panel de control del Sistema de Inventario UNPHU
        </p>
        <Link href="/nueva-solicitud" className="button primary">
          Nueva Solicitud
        </Link>
      </section>

      {/* Tarjetas de estado */}
      <section className="features">
        {(
          [
            { key: 'PENDIENTE', icon: <FiClock size={32} color="#f1c40f" />, label: 'Pendientes' },
            { key: 'APROBADA', icon: <FiCheckCircle size={32} color="#3498db" />, label: 'Aprobadas' },
            { key: 'RECHAZADA', icon: <FiXCircle size={32} color="#e74c3c" />, label: 'Rechazadas' },
            { key: 'FINALIZADA', icon: <FiClipboard size={32} color="#2ecc71" />, label: 'Finalizadas' },
          ] as const
        ).map(({ key, icon, label }) => (
          <div key={key} className="card-wrapper">
            <div className="card">
              {icon}
              <h4 style={{ marginTop: '0.5rem' }}>{label}</h4>
              <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
                {counts?.[key] ?? 0}
              </p>
              <Link
                href={`/mis-solicitudes?estado=${key}`}
                className="subtle-link"
              >
                Ver todos
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Guía Rápida */}
      <section className="app-container" style={{ padding: '2rem 1rem' }}>
        <h3>Guía Rápida</h3>
        <ol style={{ marginTop: '1rem', lineHeight: '1.6' }}>
          <li>
            <strong>Solicitar un equipo:</strong> Haz clic en “Nueva Solicitud”,
            selecciona departamento, equipo, fechas y motivo de uso.
          </li>
          <li>
            <strong>Ver mis solicitudes:</strong> Ve a “Mis Solicitudes” para
            consultar el estado y el historial de tus peticiones.
          </li>
          <li>
            <strong>Consultar disponibilidad:</strong> Comprueba la cantidad
            disponible antes de solicitar.
          </li>
        </ol>
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getSession(ctx)

  // Si no está autenticado, devolvemos props vacíos para que se muestre Landing
  if (!session?.user?.email) {
    return { props: {} }
  }

  // Buscamos el usuario
  const user = await prisma.usuario.findUnique({
    where: { email: session.user.email },
  })
  if (!user) {
    return {
      redirect: { destination: '/auth/signin', permanent: false },
    }
  }

  // Contamos solicitudes por estado
  const estados = ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'FINALIZADA'] as const
  const countsArr = await Promise.all(
    estados.map((estado) =>
      prisma.solicitud.count({
        where: { usuarioId: user.id, estado },
      })
    )
  )
  const counts = Object.fromEntries(
    estados.map((e, i) => [e, countsArr[i]])
  ) as Props['counts']

  return {
    props: {
      name: user.nombre,
      counts,
    },
  }
}
