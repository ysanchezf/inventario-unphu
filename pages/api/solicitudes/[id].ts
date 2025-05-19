import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { SolicitudUpdateSchema } from "../../../lib/zodSchemas";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { sendStatusEmail } from "../../../lib/mailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN")
    return res.status(403).json({ error: "Solo admin" });

  try {
    const { id } = req.query;
    if (req.method === "PATCH") {
      const upd = SolicitudUpdateSchema.parse(req.body);
      const sol = await prisma.solicitud.update({
        where: { id: Number(id) },
        data: upd,
        include: { usuario: true, item: true },
      });

      // enviar correo al solicitante
      await sendStatusEmail(sol.usuario.email, sol.estado, sol.item.nombre);

      return res.status(200).json(sol);
    }

    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).end();
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}
