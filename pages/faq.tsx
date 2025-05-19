// pages/faq.tsx
import Layout from '../components/Layout'

export default function FAQ() {
  return (
    <Layout>
      <section className="app-container">
        <h2>Preguntas Frecuentes (FAQ)</h2>
        <dl>
          <dt>¿Cómo creo una solicitud?</dt>
          <dd>Ve a "Nueva Solicitud", selecciona departamento, equipo y fechas.</dd>
          <dt>¿Qué pasa si rechazan mi solicitud?</dt>
          <dd>Recibes un correo y podrás ver el motivo en "Mis Solicitudes".</dd>
          <dt>¿Cómo devuelvo un equipo?</dt>
          <dd>En "Mis Solicitudes", haz clic en <strong>Devolver</strong> para cambiar el estado.</dd>
          {/* … más ítems … */}
        </dl>
      </section>
    </Layout>
  )
}
