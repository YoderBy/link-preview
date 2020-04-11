import { ConnectionError, ValidationError } from './error'

const cheerio = require('cheerio')

const getOGProperty = (dom, prop) => {
  return dom(`meta[property='og:${prop}']`).attr(`content`)
}

const getDescription = dom =>
  getOGProperty(dom, 'description') ||
  dom(`meta[name=description]`).attr(`content`) ||
  dom(`meta[name=Document]`).attr(`content`)

const getTitle = dom => getOGProperty(dom, 'title') || dom(`title`).text()

const getSiteName = dom => getOGProperty(dom, 'site_name')

const getImage = dom => getOGProperty(dom, 'image')

const getFaviconPath = dom => {
  const fav = dom(`link[rel=icon]`).attr(`href`)
  return fav ? `${origin}${fav}` : null
}

export async function getMeta(url) {
  let urlDetail
  try {
    urlDetail = new URL(url)
  } catch (error) {
    throw new ValidationError('Invalid URL')
  }

  const { href, hostname, origin } = urlDetail
  try {
    const response = await fetch(url)
    const contentType = response.headers.get('content-type')

    console.log('contentType:', contentType)

    if (/text\/*/g.test(contentType)) {
      const html = await response.text()

      console.log('Fetch page ... OK')

      const head = html.match(/<head.*?>([\s\S]*?)<\/head>/g)[0]

      console.log('Extract head ... OK')

      const doc = cheerio.load(head)

      console.log('Build DOM ... OK')

      return {
        url: href,
        siteName: getSiteName(doc) || hostname || '',
        title: getTitle(doc) || '',
        image: getImage(doc) || getFaviconPath(doc, origin) || '',
        description: getDescription(doc) || '',
      }
    } else {
      // TODO
    }
  } catch (error) {
    // TODO send log to cloud(sentry) logger
    console.error({ url, error })
    throw new ConnectionError("Can't reach the server for the given url")
  }
}
