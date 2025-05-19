// components/Landing.tsx
import Link from 'next/link'
import { FiBox, FiClipboard, FiCheckSquare } from 'react-icons/fi'

export default function Landing() {
  return (
    <>
      <header>
        <div className="app-container">
          <h1>UNPHU Inventario</h1>
          <div>
            <Link href="/auth/signin" className="button primary">
              Iniciar Sesión
            </Link>{' '}
            <Link href="/register" className="button secondary">
              Registrarse
            </Link>
          </div>
        </div>
      </header>

      <section className="hero">
        <h2>Sistema de Inventario UNPHU</h2>
        <p>
          Gestiona de manera eficiente el inventario de equipos tecnológicos y
          audiovisuales de la universidad.
        </p>
        <div className="hero-buttons">
          <Link href="/auth/signin" className="button primary large">
            Iniciar Sesión
          </Link>
          <Link href="/register" className="button secondary large">
            Registrarse
          </Link>
        </div>
      </section>

      <section>
        <h3>Características del Sistema</h3>
        <div className="features">
          {[
            {
              icon: <FiBox size={32} color="#16A085" />,
              title: 'Gestión de Inventario',
              text:
                'Control completo de los equipos disponibles en los departamentos de Audiovisual y Tecnología.',
            },
            {
              icon: <FiClipboard size={32} color="#16A085" />,
              title: 'Solicitudes de Préstamo',
              text:
                'Solicita equipos de forma fácil y rápida especificando fechas, horas y motivo de uso.',
            },
            {
              icon: <FiCheckSquare size={32} color="#16A085" />,
              title: 'Aprobación de Solicitudes',
              text:
                'Sistema de aprobación para administradores con seguimiento del estado de cada solicitud.',
            },
          ].map(({ icon, title, text }) => (
            <div key={title} className="card-wrapper">
              <h4 className="card-title">{title}</h4>
              <div className="card">
                {icon}
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
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
