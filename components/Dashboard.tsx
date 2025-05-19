// components/Dashboard.tsx
import Link from 'next/link'
import { FiClock, FiCheckCircle, FiXCircle, FiClipboard } from 'react-icons/fi'

type DashboardProps = {
  name: string
  counts: Record<'PENDIENTE'|'APROBADA'|'RECHAZADA'|'FINALIZADA', number>
}

export default function Dashboard({ name, counts }: DashboardProps) {
  return (
    <>
      <header>
        <div className="app-container">
          <h1>UNPHU Inventario</h1>
          {/* Los botones de login/registro ya están ocultos desde Layout */}
          <div style={{ textAlign: 'right' }}>
            <Link href="/nueva-solicitud" className="button primary">
              Nueva Solicitud
            </Link>
          </div>
        </div>
      </header>

      <section className="app-container" style={{ padding: '2rem 1rem' }}>
        <h2>¡Bienvenido, {name}!</h2>
        <p style={{ color: '#555' }}>
          Panel de control del Sistema de Inventario UNPHU
        </p>
      </section>

      <section className="features">
        {([
          { key: 'PENDIENTE', icon: <FiClock size={32} color="#f1c40f" />, label: 'Pendientes' },
          { key: 'APROBADA', icon: <FiCheckCircle size={32} color="#3498db" />, label: 'Aprobadas' },
          { key: 'RECHAZADA', icon: <FiXCircle size={32} color="#e74c3c" />, label: 'Rechazadas' },
          { key: 'FINALIZADA', icon: <FiClipboard size={32} color="#2ecc71" />, label: 'Finalizadas' },
        ] as const).map(({ key, icon, label }) => (
          <div key={key} className="card-wrapper">
            <div className="card">
              {icon}
              <h4 style={{ marginTop: '0.5rem' }}>{label}</h4>
              <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{counts[key]}</p>
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

      <footer>
        <div className="app-container">
          <span>© {new Date().getFullYear()} UNPHU – Sistema de Inventario</span>
          <span>República Dominicana</span>
        </div>
      </footer>
    </>
  )
}
