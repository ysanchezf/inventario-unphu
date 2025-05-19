// pages/mis-solicitudes.tsx
import { GetServerSideProps } from 'next'
import { getSession, useSession } from 'next-auth/react'
import Layout from '../components/Layout'
import { useState, useEffect } from 'react'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'

type Solicitud = {
  id: number
  motivo: string
  estado: string
  fechaSolicitud: string
  item: { nombre: string; departamento: string }
  usuario: { email: string; nombre: string; apellido: string }
}

export default function MisSolicitudes() {
  const { data: session, status } = useSession()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string|null>(null)

  // filtros
  const [search,  setSearch]  = useState('')
  const [estado,  setEstado]  = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search)  params.set('search', search)
    if (estado)  params.set('estado', estado)

    fetch(`/api/solicitudes?${params.toString()}`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`Error ${res.status}`)
        return res.json()
      })
      .then((data: Solicitud[]) => setSolicitudes(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [search, estado])

  const handleDelete = async (id: number) => {
    await fetch(`/api/solicitudes/${id}/delete`, {
      method: 'DELETE',
      credentials: 'include'
    })
    // refrescar
    setSolicitudes(s => s.filter(x => x.id !== id))
  }

  if (status === 'loading') return null

  return (
    <Layout>
      <section className="app-container">
        <h2>Mis Solicitudes</h2>

        {/* —————— FILTROS —————— */}
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'1rem' }}>
          <input
            type="text"
            placeholder="Buscar equipo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="APROBADA">Aprobada</option>
            <option value="RECHAZADA">Rechazada</option>
            <option value="FINALIZADA">Finalizada</option>
          </select>
        </div>

        {loading ? (
          <p>Cargando solicitudes…</p>
        ) : error ? (
          <p style={{ color:'red' }}>Error: {error}</p>
        ) : solicitudes.length === 0 ? (
          <p>No tienes solicitudes para mostrar.</p>
        ) : (
          <table className="table-minimal">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Departamento</th>
                <th>Equipo</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th>Acciones</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => {
                const esPropia     = s.usuario.email === session?.user?.email
                const puedeActuar  = s.estado === 'PENDIENTE' && !esPropia
                const rol          = (session?.user as any)?.rol
                const puedeDevolver= s.estado === 'APROBADA' && (esPropia || rol === 'ADMIN')

                return (
                  <tr key={s.id}>
                    <td>{new Date(s.fechaSolicitud).toLocaleDateString()}</td>
                    <td>{s.item.departamento}</td>
                    <td>{s.item.nombre}</td>
                    <td>{s.motivo}</td>
                    <td>{s.estado}</td>
                    <td>
                      {puedeActuar && (
                        <>
                          <button
                            className="btn btn-small btn-primary"
                            onClick={() => fetch(`/api/admin/requests/${s.id}`, {
                              method: 'PATCH',
                              credentials:'include',
                              headers:{'Content-Type':'application/json'},
                              body: JSON.stringify({ estado:'APROBADA'})
                            }).then(() => setSolicitudes(ms =>
                              ms.map(x => x.id===s.id?{...x,estado:'APROBADA'}:x)
                            ))}
                          >
                            <FiCheckCircle size={14}/> Aprobar
                          </button>
                          <button
                            className="btn btn-small btn-secondary"
                            onClick={() => fetch(`/api/admin/requests/${s.id}`, {
                              method: 'PATCH',
                              credentials:'include',
                              headers:{'Content-Type':'application/json'},
                              body: JSON.stringify({ estado:'RECHAZADA'})
                            }).then(() => setSolicitudes(ms =>
                              ms.map(x => x.id===s.id?{...x,estado:'RECHAZADA'}:x)
                            ))}
                          >
                            <FiXCircle size={14}/> Rechazar
                          </button>
                        </>
                      )}
                      {puedeDevolver && (
                        <button
                          className="btn btn-small btn-primary"
                          style={{ marginLeft: puedeActuar ? '.5rem' : 0 }}
                          onClick={async () => {
                            const r = await fetch(`/api/solicitudes/${s.id}/return`, {
                              method:'POST', credentials:'include'
                            })
                            if (r.ok) setSolicitudes(ms =>
                              ms.map(x => x.id===s.id?{...x,estado:'FINALIZADA'}:x)
                            )
                          }}
                        >
                          Devolver
                        </button>
                      )}
                      {(!puedeActuar && !puedeDevolver) && '—'}
                    </td>
                    <td>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleDelete(s.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx)
  if (!session?.user) {
    return { redirect: { destination:'/auth/signin', permanent:false } }
  }
  return { props: {} }
}
