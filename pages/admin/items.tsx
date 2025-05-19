// pages/admin/items.tsx
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import Layout from '../../components/Layout'
import { useState } from 'react'

type Item = {
  id: number
  nombre: string
  descripcion: string | null
  cantidadTotal: number
  cantidadDisponible: number
  departamentoId: number
}

type Departamento = {
  id: number
  nombre: string
}

type Props = {
  items: Item[]
  departamentos?: Departamento[]
}

export default function AdminItems({
  items,
  departamentos = [],        // valor por defecto
}: Props) {
  const [list, setList] = useState<Item[]>(items)
  const [departmentsList, setDepartmentsList] = useState<Departamento[]>(departamentos)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    cantidadTotal: 1,
    departamentoId: '' as string, // '' | id | 'new'
    newDeptName: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ nombre: '', descripcion: '', cantidadTotal: 1, departamentoId: '', newDeptName: '' })
    setError(null)
    setShowModal(true)
  }

  const openEdit = (it: Item) => {
    setEditing(it)
    setForm({
      nombre: it.nombre,
      descripcion: it.descripcion || '',
      cantidadTotal: it.cantidadTotal,
      departamentoId: String(it.departamentoId),
      newDeptName: '',
    })
    setError(null)
    setShowModal(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(f => ({
      ...f,
      [name]: name === 'cantidadTotal'
        ? Number(value)
        : value
    } as any))

    if (name === 'departamentoId' && value !== 'new') {
      setForm(f => ({ ...f, newDeptName: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let deptId: number
    if (form.departamentoId === 'new') {
      if (!form.newDeptName.trim()) {
        setError('Debe indicar nombre de nuevo departamento')
        setLoading(false)
        return
      }
      // Crear departamento
      const resDept = await fetch('/api/departamentos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.newDeptName.trim() }),
      })
      if (!resDept.ok) {
        setError('Error al crear departamento')
        setLoading(false)
        return
      }
      const newDept: Departamento = await resDept.json()
      deptId = newDept.id
      setDepartmentsList(dl => [...dl, newDept])
    } else {
      deptId = Number(form.departamentoId)
    }

    const url = editing
      ? `/api/admin/items/${editing.id}`
      : '/api/admin/items'
    const method = editing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        cantidadTotal: form.cantidadTotal,
        departamentoId: deptId,
      }),
    })

    const text = await res.text()
    let data: Item
    try {
      data = JSON.parse(text)
    } catch {
      setError(`Error en servidor: ${res.status}`)
      setLoading(false)
      return
    }

    setLoading(false)
    if (!res.ok) {
      setError((data as any).message || 'Error al guardar equipo')
    } else {
      if (editing) {
        setList(l => l.map(i => i.id === data.id ? data : i))
      } else {
        setList(l => [data, ...l])
      }
      setShowModal(false)
    }
  }

  return (
    <Layout>
      <section className="app-container header-flex">
        <h2>Gestión de Equipos</h2>
        <button
          className="btn btn-primary btn-lg create-user-button"
          onClick={openCreate}
        >
          Nuevo Equipo
        </button>
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h3>{editing ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>×</button>
            </header>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="form-grid">
                {error && <p className="error-text">{error}</p>}

                <input
                  name="nombre"
                  placeholder="Nombre de equipo"
                  className="input"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />

                <textarea
                  name="descripcion"
                  placeholder="Descripción (opcional)"
                  className="input"
                  rows={2}
                  value={form.descripcion}
                  onChange={handleChange}
                />

                <select
                  name="departamentoId"
                  className="input"
                  value={form.departamentoId}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Selecciona Departamento --</option>
                  {departmentsList?.map(d => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                  <option value="new">+ Crear nuevo departamento</option>
                </select>

                {form.departamentoId === 'new' && (
                  <input
                    name="newDeptName"
                    placeholder="Nombre nuevo departamento"
                    className="input"
                    value={form.newDeptName}
                    onChange={handleChange}
                    required
                  />
                )}

                <input
                  name="cantidadTotal"
                  type="number"
                  min={1}
                  placeholder="Cantidad de equipos a agregar"
                  className="input"
                  value={form.cantidadTotal}
                  onChange={handleChange}
                  required
                />

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Guardando…' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <section className="app-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Disponible</th>
              <th>Total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map(i => (
              <tr key={i.id}>
                <td>{i.nombre}</td>
                <td>{i.cantidadDisponible}</td>
                <td>{i.cantidadTotal}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => openEdit(i)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ctx => {
  const session = await getSession(ctx)
  if (!session?.user || (session.user as any).rol !== 'ADMIN') {
    return { redirect: { destination: '/', permanent: false } }
  }

  const { prisma } = await import('../../lib/prisma')
  const items = await prisma.item.findMany({
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      cantidadTotal: true,
      cantidadDisponible: true,
      departamentoId: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  const departamentos = await prisma.departamento.findMany({
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
  })

  return { props: { items, departamentos } }
}
