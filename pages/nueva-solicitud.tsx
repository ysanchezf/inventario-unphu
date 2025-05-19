// pages/nueva-solicitud.tsx
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import Layout from '../components/Layout'
import { prisma } from '../lib/prisma'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

type Departamento = { id: number; nombre: string }
type Item = { id: number; nombre: string }

type Props = { departamentos: Departamento[] }

export default function NuevaSolicitud({ departamentos }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [form, setForm] = useState({
    departamentoId: departamentos[0]?.id || 0,
    itemId: 0,
    fechaUso: '',
    horaInicio: '',
    horaFin: '',
    motivo: '',
  })
  const [error, setError] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Cuando cambie el departamento, recarga los equipos de ese depto
  useEffect(() => {
    if (!form.departamentoId) return
    fetch(`/api/items?departamentoId=${form.departamentoId}`, {
      credentials: 'include'
    })
      .then(r => r.json())
      .then((data: Item[]) => {
        setItems(data)
        setForm(f => ({ ...f, itemId: data[0]?.id || 0 }))
      })
      .catch(() => setItems([]))
  }, [form.departamentoId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>
  ) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/solicitud', {
      method: 'POST',
      credentials: 'include',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.message || 'Error al crear la solicitud')
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <Layout>
        <section className="page-center">
          <div className="form-card">
            <h2>¡Solicitud enviada!</h2>
            <p>Tu petición ha sido creada correctamente.</p>
            <button
              className="button primary"
              onClick={() => router.push('/mis-solicitudes')}
            >
              Ver Mis Solicitudes
            </button>
          </div>
        </section>
      </Layout>
    )
  }

  return (
    <Layout>
      <section className="page-center">
        <div className="form-card">
          <h2>Nueva Solicitud</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            {error && <p className="error-text">{error}</p>}

            <label>Departamento</label>
            <select
              name="departamentoId"
              value={form.departamentoId}
              onChange={handleChange}
              required
            >
              {departamentos.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>

            <label>Equipo</label>
            <select
              name="itemId"
              value={form.itemId}
              onChange={handleChange}
              required
            >
              {items.map(it => (
                <option key={it.id} value={it.id}>{it.nombre}</option>
              ))}
            </select>

            <label>Fecha de uso</label>
            <input
              type="date"
              name="fechaUso"
              value={form.fechaUso}
              onChange={handleChange}
              required
            />

            <div className="two-col">
              <div>
                <label>Hora inicio</label>
                <input
                  type="time"
                  name="horaInicio"
                  value={form.horaInicio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label>Hora fin</label>
                <input
                  type="time"
                  name="horaFin"
                  value={form.horaFin}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <label>Motivo</label>
            <textarea
              name="motivo"
              rows={4}
              value={form.motivo}
              onChange={handleChange}
              required
            />

            <button
              type="submit"
              className="button primary"
              disabled={loading}
            >
              {loading ? 'Enviando…' : 'Enviar Solicitud'}
            </button>
          </form>
        </div>
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ctx => {
  const session = await getSession(ctx)
  if (!session?.user?.email) {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }
  const departamentos = await prisma.departamento.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })
  return { props: { departamentos } }
}
