import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

async function main() {
  const prisma = new PrismaClient()

  const hash = await bcrypt.hash('Admin@123', 10)

  await prisma.usuario.upsert({
    where: { matricula: 'admin' },
    update: {},
    create: {
      matricula: 'admin',
      email: 'admin@unphu.edu.do',
      nombre: 'Super',
      apellido: 'Admin',
      password: hash,
      confirmed: true,
      rol: 'ADMIN',
    },
  })

  console.log('✅ Admin user created/updated')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
