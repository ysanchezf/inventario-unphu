// pages/admin/requests.tsx
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import Layout from '../../components/Layout'
import { useState, useEffect } from 'react'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'

type Solicitud = {
  id: number
  motivo: string
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'FINALIZADA'
  fechaSolicitud: string
  usuario: { nombre: string }
  item: { nombre: string }
}

export default function AdminRequestsPage() {
  const { data: session } = useSession()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string|null>(null)

  // 1) Carga inicial
  useEffect(() => {
    fetch('/api/admin/requests', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then((data: Solicitud[]) => setSolicitudes(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // 2) Función común para aprobar/rechazar
  const handleUpdate = async (
    id: number,
    newEstado: 'APROBADA' | 'RECHAZADA'
  ) => {
    const res = await fetch(`/api/admin/requests/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: newEstado }),
    })
    if (!res.ok) {
      alert(`Error ${res.status}`)
    } else {
      setSolicitudes((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, estado: newEstado } : r
        )
      )
    }
  }

  // 3) Función para marcar “Entregado” (devolución)
  const handleDeliver = async (id: number) => {
    const res = await fetch(`/api/solicitudes/${id}/return`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) {
      alert(`Error al marcar entrega: ${res.status}`)
    } else {
      // <-- Aquí actualizamos a FINALIZADA
      setSolicitudes((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, estado: 'FINALIZADA' } : r
        )
      )
    }
  }

  if (loading) return <Layout><p>Cargando…</p></Layout>
  if (error)   return <Layout><p style={{color:'red'}}>Error: {error}</p></Layout>
  if (!session || (session.user as any).rol !== 'ADMIN') {
    return <Layout><p>No tienes permiso para ver esta página.</p></Layout>
  }

  return (
    <Layout>
      <section className="app-container">
        <h2>Revisión de Solicitudes</h2>
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Usuario</th>
              <th>Equipo</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.fechaSolicitud).toLocaleDateString()}</td>
                <td>{s.usuario.nombre}</td>
                <td>{s.item.nombre}</td>
                <td>{s.motivo}</td>
                <td>{s.estado}</td>
                <td>
                  {/* Botones Aprobar / Rechazar */}
                  {s.estado === 'PENDIENTE' && (
                    <>
                      <button
                        className="btn btn-primary btn-small"
                        onClick={() => handleUpdate(s.id, 'APROBADA')}
                      >
                        <FiCheckCircle size={14} /> Aprobar
                      </button>
                      {' '}
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleUpdate(s.id, 'RECHAZADA')}
                      >
                        <FiXCircle size={14} /> Rechazar
                      </button>
                    </>
                  )}

                  {/* Botón Marcar entregado */}
                  {s.estado === 'APROBADA' && (
                    <button
                      className="btn btn-primary btn-small"
                      style={{ marginLeft: '0.5rem' }}
                      onClick={() => handleDeliver(s.id)}
                    >
                      Marcar entregado
                    </button>
                  )}

                  {/* Texto para estados fijos */}
                  {s.estado === 'FINALIZADA' && <span>Finalizada</span>}
                  {s.estado === 'RECHAZADA' && <span>Rechazada</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  )
}
