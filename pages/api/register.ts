// pages/api/register.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { sendConfirmationEmail } from '../../lib/mailer';

type Data = { message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { matricula, nombre, apellido, password, confirmPassword } = req.body;

  if (!matricula || !nombre || !apellido || !password || !confirmPassword) {
    return res.status(400).json({ message: 'Faltan campos obligatorios' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Las contraseñas no coinciden' });
  }

  try {
    const exists = await prisma.usuario.findUnique({ where: { matricula } });
    if (exists) {
      return res.status(400).json({ message: 'Matrícula ya registrada' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.usuario.create({
      data: {
        matricula,
        email: `${matricula}@unphu.edu.do`,
        nombre,
        apellido,
        password: hashed,
        rol: 'USER',
      },
    });

    // Envío obligatorio de correo; si falla hacemos rollback
    try {
      await sendConfirmationEmail(user.email, user.nombre, user.matricula);
    } catch (mailErr) {
      await prisma.usuario.delete({ where: { id: user.id } });
      console.error('Error al enviar correo:', mailErr);
      return res.status(500).json({
        message:
          'No fue posible enviar el correo de confirmación. Inténtalo de nuevo.',
      });
    }

    return res.status(201).json({
      message:
        '¡Registro exitoso! Por favor revisa tu bandeja de entrada para confirmar tu cuenta.',
    });
  } catch (err: any) {
    console.error('Error interno en /api/register:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}
