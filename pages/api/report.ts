// pages/api/report.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import puppeteer from 'puppeteer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Arranca Puppeteer
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  const page = await browser.newPage()

  // 2) Inyecta la cookie de sesión de NextAuth
  const cookieHeader = req.headers.cookie || ''
  if (cookieHeader) {
    await page.setExtraHTTPHeaders({ cookie: cookieHeader })
  }

  // 3) Opciones de viewport y media
  await page.setViewport({ width: 1200, height: 800 })
  await page.emulateMediaType('screen')

  // 4) Construye la URL absoluta
  const base = process.env.NEXTAUTH_URL?.replace(/\/+$/, '') || 'http://localhost:3000'
  const url = `${base}/report-template`

  // 5) Navega y espera a que realmente cargue el contenido
  await page.goto(url, {
    waitUntil: 'networkidle2',  // o 'networkidle0' si prefieres
    timeout: 30000,
  })
  await page.waitForSelector('body') // asegura que <body> esté presente

  // 6) Genera el PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '1cm', bottom: '1cm', left: '1cm', right: '1cm' },
  })

  await browser.close()

  // 7) Envía el PDF al cliente
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-inventario.pdf"')
  res.send(pdfBuffer)
}
