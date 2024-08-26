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
    const userLanguages = req.acceptsLanguages()

    const assets = await getAssets()

    for (const userLanguage of userLanguages) {
      const language = userLanguage.split('-').at(0)

      if (language && language in assets) {
        return res.sendFile(assets[language], {
          headers: {
            'Content-Language': language,
            'Content-Disposition': `inline; filename="${FILENAME}"`
          }
        })
      }
    }

    if (DEFAULT_LANGUAGE && DEFAULT_LANGUAGE in assets) {
      return res.sendFile(assets[DEFAULT_LANGUAGE], {
        headers: {
          'Content-Language': DEFAULT_LANGUAGE,
          'Content-Disposition': `inline; filename="${FILENAME}"`
        }
      })
    }

    res.status(404).end('No assets found :(')
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
