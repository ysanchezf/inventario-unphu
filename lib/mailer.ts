// lib/mailer.ts
import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * Envía el email de confirmación al crear cuenta.
 */
export async function sendConfirmationEmail(
  email: string,
  nombre: string,
  matricula: string
) {
  const confirmUrl = `${process.env.NEXTAUTH_URL}/api/confirm?token=${encodeURIComponent(
    matricula
  )}`

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Confirma tu cuenta en Inventario UNPHU',
    html: `
      <p>Hola ${nombre},</p>
      <p>Para activar tu cuenta, haz clic aquí:</p>
      <p><a href="${confirmUrl}">Confirmar mi cuenta</a></p>
      <p>Si no fuiste tú, ignora este mensaje.</p>
    `,
  })

  const preview = nodemailer.getTestMessageUrl(info)
  if (preview) console.log('💌 Preview URL:', preview)
}

/**
 * Envía un email genérico (asunto + HTML) que tú prepares antes de llamarlo.
 * Ideal para notificar aprobación/rechazo u otros estados.
 */
export async function sendStatusEmail(
  to: string,
  subject: string,
  html: string
) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  })
}

/**
 * Envía un email notificando al usuario que su solicitud ha sido devuelta / entregada.
 */
export async function sendReturnEmail(
  to: string,
  item: string
) {
  const subject = `Tu solicitud de "${item}" ha sido entregada`
  const html = `
    <p>Hola,</p>
    <p>Tu solicitud para el equipo <strong>${item}</strong> ha sido <strong>entregada</strong> correctamente.</p>
    <p>¡Gracias por usar el Inventario UNPHU!</p>
  `
  // texto plano para clientes que no muestren HTML
  const text = `Hola,\n\nTu solicitud para el equipo "${item}" ha sido entregada correctamente.\n\n¡Gracias por usar el Inventario UNPHU!`

  await transporter.sendMail({
    from: process.env.EMAIL_FROM!,
    to,
    subject,
    text,
    html,
  })
}