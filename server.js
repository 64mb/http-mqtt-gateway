require('dotenv').config()
const logger = require('./logger')

const http = require('http')
const mqtt = require('mqtt')

const SERVER = {
  http: null,
  mqtt: null,
}

async function init(config) {
  const options = {}

  if (config.username) options.username = config.username
  if (config.password) options.password = config.password

  let url = `mqtt://${config.host}`
  if (config.port != null && config.port !== 1883) url = `${url}:${config.port}`

  const client = mqtt.connect(url, options)
  SERVER.mqtt = client

  const server = http.createServer((request, response) => {
    if (request.method !== 'POST') {
      response.statusCode = 404
      response.end()
      return
    }

    let body = []
    request.on('error', (err) => {
      logger.error({ msg: 'http request error', error: err.stack || err })
    }).on('data', (chunk) => {
      body.push(chunk)
    }).on('end', () => {
      body = Buffer.concat(body)

      const topic = request.url.replace(/^\/+|\/+$/g, '')
      client.publish(topic, body)

      response.statusCode = 200
      response.end()
    })
  })
  SERVER.http = server

  const promise = new Promise((resolve, reject) => {
    client.on('connect', () => {
      logger.info({ msg: 'mqtt client connected', url })
      server.on('error', (err) => {
        logger.error({ msg: 'error http server listen', error: err.stack || err, port: config.httpPort })
        reject(err)
      })
      server.listen(config.httpPort, config.httpHost, () => {
        logger.info({ msg: 'http server listen', host: server.address().address, port: server.address().port })
        resolve(true)
      })
    })

    client.on('error', (err) => {
      logger.error({ msg: 'mqtt client error', error: err.stack || err })
    })
  })

  await promise

  return {
    port: server.address().port,
  }
}

async function stop() {
  const promiseHTTP = new Promise((resolve, reject) => {
    if (!SERVER.http) {
      resolve(true)
      return
    }
    SERVER.http.close((err) => {
      if (err != null) reject(err)
      resolve(true)
    })
  })
  await promiseHTTP

  const promiseMQTT = new Promise((resolve, reject) => {
    if (!SERVER.mqtt) {
      resolve(true)
      return
    }
    SERVER.mqtt.end(false, {}, (err) => {
      if (err != null) reject(err)
      resolve(true)
    })
  })

  await promiseMQTT
}

if (require.main === module) {
  init({
    httpHost: process.env.HTTP_HOST || '0.0.0.0',
    httpPort: process.env.HTTP_PORT || 80,
    host: process.env.MQTT_HOST,
    port: process.env.MQTT_PORT || 1883,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  }).then(() => {
    logger.info({ msg: 'http-mqtt gateway server ready' })
  }).catch((err) => {
    logger.fatal({ msg: 'http-mqtt gateway start failed', error: err.stack || err })
    process.exit(1)
  })
}

module.exports = {
  init,
  stop,
}
