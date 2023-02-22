const cds = require('@sap/cds-dk')
const swaggerUi = require('swagger-ui-express')
const express = require('express')
const { join } = require('path')
const LOG = cds.log('swagger')

module.exports = (options = {}) => {
  options = Object.assign({ basePath: '/$api-docs', apiPath: '' }, options)
  const router = express.Router()
  
  const cssopt = {
    swaggerOptions: {
      docExpansion: 'none'
    },
    customfavIcon: 'myFavicon_small.png',
    customSiteTitle: 'My Service Name',
    customCss: ``
  }

  cds.on('serving', service => {
    if (!isOData(service)) return
    const apiPath = service.path
    const apiDocPath = join(options.basePath, service.path)
    const mount = apiDocPath.replace('$', '[\\$]')
    const swaggerDoc = toOpenApiDoc(null, service, options)
    LOG._debug && LOG.debug('serving Swagger UI for ', { service: service.name, at: apiDocPath })
    router.use(mount, swaggerUi.serveFiles(swaggerDoc, cssopt), swaggerUi.setup(swaggerDoc, cssopt))
    addLinkToIndexHtml(service, apiPath)
  })
  return router
}

const cache = {}
function toOpenApiDoc (service, options = {}) {
  if (!cache[service.name]) {
    cache[service.name] = cds.compile.to.openapi(service.model, {
      service: service.name,
      'openapi:url': join('/', options.apiPath, service.path),
      'openapi:diagram': ('diagram' in options ? options.diagram : true)
    })
  }
  return cache[service.name]
}

function addLinkToIndexHtml (service, apiPath) {
  const provider = (entity) => {
    if (entity) return // avoid link on entity level, looks too messy
    return { href: apiPath, name: 'Open API Preview', title: 'Show in Swagger UI' }
  }
  service.$linkProviders ? service.$linkProviders.push(provider) : service.$linkProviders = [provider]
}

function isOData (service) {
  return Object.keys(service._adapters).find(a => a.startsWith('odata'))
}

/* eslint no-console:off */
