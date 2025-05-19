// lib/admin.ts
import { GetServerSidePropsContext } from 'next'
import { getSession } from 'next-auth/react'

export async function ensureAdmin(ctx: GetServerSidePropsContext) {
  const session = await getSession(ctx)
  if (!session || (session.user as any).role !== 'ADMIN') {
    return { redirect: { destination: '/', permanent: false } }
  }
  return { session }
}
