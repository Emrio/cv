import { promises as fs } from 'fs'
import path from 'path'
import express from 'express'
import helmet from 'helmet'

const ASSETS_DIR = process.env.CV_ASSETS_DIR ?? path.join(__dirname, '..', 'assets')
const DEFAULT_LANGUAGE = process.env.CV_DEFAULT_LANGUAGE ?? 'en'
const FILENAME = process.env.CV_FILENAME ?? 'My CV.pdf'
const PORT = process.env.CV_PORT ?? 8080

const app = express()

app.use(helmet())

app.all('*', async (req, res) => {
  try {
    const assets = await getAssets()

    const pathLanguage = req.path.split('/').at(1)
    if (pathLanguage && pathLanguage in assets) {
      return serveFile(pathLanguage)
    }

    const userLanguages = req.acceptsLanguages()
    for (const userLanguage of userLanguages) {
      const language = userLanguage.split('-').at(0)

      if (language && language in assets) {
        return serveFile(language)
      }
    }

    if (DEFAULT_LANGUAGE && DEFAULT_LANGUAGE in assets) {
      return serveFile(DEFAULT_LANGUAGE)
    }

    res.status(404).end('No assets found :(')

    function serveFile(language: string) {
      res.sendFile(assets[language], {
        headers: {
          'Content-Language': language,
          'Content-Disposition': `inline; filename="${FILENAME}"`
        }
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).end('Internal server error')
  }
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

async function getAssets(): Promise<Record<string, string>> {
  const files = await fs.readdir(ASSETS_DIR)
  const pdfFiles = files.filter((file) => file.endsWith('.pdf'))

  const assets: Record<string, string> = {}

  for (const file of pdfFiles) {
    const language = file.split('.').at(0)

    if (!language) {
      continue
    }

    const filePath = path.join(ASSETS_DIR, file)
    assets[language] = filePath
  }

  return assets
}
