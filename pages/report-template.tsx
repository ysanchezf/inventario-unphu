// pages/report-template.tsx
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import Head from 'next/head'
import { prisma } from '../lib/prisma'

type Props = {
  totalItems: number
  totalDepartments: number
  counts: Record<'PENDIENTE'|'APROBADA'|'RECHAZADA'|'FINALIZADA', number>
  byDept: { nombre: string; total: number; available: number }[]
}

export default function ReportTemplate({ totalItems, totalDepartments, counts, byDept }: Props) {
  return (
    <>
      <Head>
        <title>Reporte Inventario UNPHU</title>
        <style>{`
          body { font-family: sans-serif; padding: 2rem; color: #333 }
          h1,h2 { color: #165C4F; margin-bottom: .5rem }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0 2rem }
          th, td { border: 1px solid #ccc; padding: .5rem; text-align: left }
          ul { list-style: none; padding-left: 0; }
          ul li { margin-bottom: .25rem }
        `}</style>
      </Head>

      <h1>Reporte de Inventario UNPHU</h1>
      <p>Fecha: {new Date().toLocaleDateString()}</p>

      <h2>Resumen Ejecutivo</h2>
      <ul>
        <li><strong>Total Equipos:</strong> {totalItems}</li>
        <li><strong>Total Departamentos:</strong> {totalDepartments}</li>
        <li>
          <strong>Solicitudes:</strong>
          <ul>
            <li>Pendientes: {counts.PENDIENTE}</li>
            <li>Aprobadas: {counts.APROBADA}</li>
            <li>Rechazadas: {counts.RECHAZADA}</li>
            <li>Finalizadas: {counts.FINALIZADA}</li>
          </ul>
        </li>
      </ul>

      <h2>Inventario por Departamento</h2>
      <table>
        <thead>
          <tr>
            <th>Departamento</th>
            <th>Total Equipos</th>
            <th>Disponibles</th>
          </tr>
        </thead>
        <tbody>
          {byDept.map(d => (
            <tr key={d.nombre}>
              <td>{d.nombre}</td>
              <td>{d.total}</td>
              <td>{d.available}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async ctx => {
  // 1) Protegemos ruta: solo ADMIN
  const session = await getSession(ctx)
  if (!session?.user || (session.user as any).rol !== 'ADMIN') {
    return { redirect: { destination: '/auth/signin', permanent: false } }
  }

  // 2) Totales
  const totalItems = await prisma.item.count()
  const totalDepartments = await prisma.departamento.count()

  // 3) Conteo solicitudes por estado
  const estados = ['PENDIENTE','APROBADA','RECHAZADA','FINALIZADA'] as const
  const countsArr = await Promise.all(
    estados.map(e => prisma.solicitud.count({ where: { estado: e } }))
  )
  const counts = Object.fromEntries(estados.map((e,i)=>[e, countsArr[i]])) as Props['counts']

  // 4) Inventario por departamento
  const raw = await prisma.departamento.findMany({
    select: {
      nombre: true,
      items: {
        select: { cantidadTotal: true, cantidadDisponible: true }
      }
    }
  })
  const byDept = raw.map(d => ({
    nombre: d.nombre,
    total: d.items.reduce((s, it) => s + it.cantidadTotal, 0),
    available: d.items.reduce((s, it) => s + it.cantidadDisponible, 0),
  }))

  return {
    props: { totalItems, totalDepartments, counts, byDept }
  }
}
