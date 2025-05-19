// pages/admin/users.tsx
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import Layout from '../../components/Layout'
import { useState } from 'react'

type User = {
  id: number
  matricula: string
  nombre: string
  apellido: string
  email: string
  rol: 'ADMIN' | 'USER'
}

type Props = { users: User[] }

export default function AdminUsers({ users }: Props) {
  const [list, setList] = useState<User[]>(users)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState({
    matricula: '',
    nombre: '',
    apellido: '',
    email: '',
    rol: 'USER' as 'USER' | 'ADMIN',
    password: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({
      matricula: '',
      nombre: '',
      apellido: '',
      email: '',
      rol: 'USER',
      password: '',
    })
    setError(null)
    setShowModal(true)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setForm({
      matricula: u.matricula,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      rol: u.rol,
      password: '',
    })
    setError(null)
    setShowModal(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const isEdit = Boolean(editing)
    const url = isEdit
      ? `/api/admin/users/${editing!.id}`
      : '/api/admin/users'
    const method = isEdit ? 'PATCH' : 'POST'

    // build payload
    const payload: any = {
      nombre: form.nombre,
      apellido: form.apellido,
      email: form.email,
      rol: form.rol,
    }
    if (!isEdit) {
      payload.matricula = form.matricula
    }
    if (form.password) {
      payload.password = form.password
    }

    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const text = await res.text()
    let data: User
    try {
      data = JSON.parse(text)
    } catch {
      setError(`Error en servidor: ${res.status}`)
      setLoading(false)
      return
    }

    setLoading(false)
    if (!res.ok) {
      setError(data.message || 'Error al guardar usuario')
    } else {
      if (isEdit) {
        setList(l => l.map(u => (u.id === data.id ? data : u)))
      } else {
        setList(l => [data, ...l])
      }
      setShowModal(false)
    }
  }

  return (
    <Layout>
      <section className="app-container header-flex">
        <h2>Gestión de Usuarios</h2>
        <button
          className="btn btn-primary btn-lg create-user-button"
          onClick={openCreate}
        >
          Nuevo Usuario
        </button>
      </section>

      <section className="app-container">
        <table className="table-minimal">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map(u => (
              <tr key={u.id}>
                <td>{u.matricula}</td>
                <td>{u.nombre} {u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.rol}</td>
                <td>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => openEdit(u)}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <header className="modal-header">
              <h3>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>×</button>
            </header>
            <div className="modal-body">
              <form onSubmit={handleSubmit} className="form-grid">
                {error && <p className="error-text">{error}</p>}

                {!editing && (
                  <input
                    name="matricula"
                    placeholder="Matrícula"
                    className="input"
                    value={form.matricula}
                    onChange={handleChange}
                    required
                  />
                )}

                <input
                  name="nombre"
                  placeholder="Nombre"
                  className="input"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
                <input
                  name="apellido"
                  placeholder="Apellido"
                  className="input"
                  value={form.apellido}
                  onChange={handleChange}
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
                <select
                  name="rol"
                  className="input"
                  value={form.rol}
                  onChange={handleChange}
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <input
                  name="password"
                  type="password"
                  placeholder={editing ? "Nueva contraseña (opcional)" : "Contraseña"}
                  className="input"
                  value={form.password}
                  onChange={handleChange}
                  {...(!editing && { required: true })}
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
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ctx => {
  const session = await getSession(ctx)
  if (!session?.user || (session.user as any).rol !== 'ADMIN') {
    return { redirect: { destination: '/', permanent: false } }
  }
  const { prisma } = await import('../../lib/prisma')
  const users = await prisma.usuario.findMany({
    select: {
      id: true,
      matricula: true,
      nombre: true,
      apellido: true,
      email: true,
      rol: true,
    },
    orderBy: { nombre: 'asc' },
  })
  return { props: { users } }
}
