/* Loads a URL then starts looking for links.
 Emits a full page whenever a new link is found. */
import url from 'url'
import path from 'path'
import glob from 'glob-to-regexp'
import Chromy from 'chromy'

export default class Crawler {
  constructor (baseUrl, options) {
    this.baseUrl = baseUrl
    const { protocol, host } = url.parse(baseUrl)
    this.protocol = protocol
    this.host = host
    this.paths = [...options.include]
    this.exclude = options.exclude.map((g) => glob(g, { extended: true, globstar: true }))
    this.processed = {}
    this.chromy = new Chromy({ visible: false })
      .chain()
      .console((text) => console.log(text))
  }

  crawl (handler) {
    this.handler = handler
    console.log(`🕷   Starting crawling ${this.baseUrl}`)
    return this.snap()
      .then(() => {
        console.log(`🕸   Finished crawling.`)
        Chromy.cleanup()
      })
  }

  snap () {
    let urlPath = this.paths.shift()
    if (!urlPath) return Promise.resolve()
    urlPath = url.resolve('/', urlPath) // Resolve removes trailing slashes
    if (this.processed[urlPath]) {
      return this.snap()
    } else {
      this.processed[urlPath] = true
    }

    return this.chromy
      .goto(`${this.protocol}//${this.host}${urlPath}`)
      .evaluate(() => {
        const html = window.document.documentElement.outerHTML
        return {
          html
        }
      })
      .result((res) => {
        this.handler({ urlPath, html: res.html })
      })
      .end()
      .then(() => this.snap())
  }
}
