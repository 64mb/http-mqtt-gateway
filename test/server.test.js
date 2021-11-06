const { test } = require('tap')
const mqttClient = require('mqtt')
const fetch = require('node-fetch')
const nanoid = require('nanoid')
  .customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)
const mqttServer = require('./helper/mqtt_server')
const httpServer = require('../server')
const logger = require('../logger')

// generate random messages
const COUNT_MESSAGES = 5000
const TIMEOUT_CHECK = 28000

test('MQTT-HTTP STRESS TEST', async (t) => {
  const DATA_SEND = {}
  const DATA_CHECK = {}
  let SENDED = 0
  let RECEIVED = 0

  const mqtt = await mqttServer.init(0)
  const mqttUri = `mqtt://127.0.0.1:${mqtt.port}`

  const http = await httpServer.init({
    httpHost: '127.0.0.1',
    httpPort: 0,
    host: '127.0.0.1',
    port: mqtt.port,
  })
  const httpUri = `http://127.0.0.1:${http.port}`

  t.teardown(async () => {
    await httpServer.stop()
    await mqttServer.stop()
  })

  const client = mqttClient.connect(mqttUri)
  client.on('message', (topic, message) => {
    DATA_CHECK[topic] = message.toString()
    RECEIVED += 1
  })

  let promise = new Promise((resolve, reject) => {
    client.on('connect', () => {
      client.subscribe('#', (err) => {
        if (err) reject(err)
        else resolve(true)
      })
    })
    client.on('error', (err) => {
      reject(err)
    })
  })
  await promise

  let i = 0
  while (i < COUNT_MESSAGES) {
    // eslint-disable-next-line no-loop-func
    const key = await nanoid()
    const value = await nanoid()
    DATA_SEND[key] = value
    i += 1
  }

  const time1 = Date.now()

  const progress = setInterval(() => {
    logger.info({
      msg: 'message progress', sended: SENDED, received: RECEIVED,
    })
  }, 1000)

  const promises = []
  Object.keys(DATA_SEND).forEach((key) => {
    promises.push(fetch(`${httpUri}/${key}`, {
      method: 'POST',
      body: DATA_SEND[key],
    }).catch((err) => err).then(() => { SENDED += 1 }))
  })

  await promises

  promise = new Promise((resolve, reject) => {
    let timeout = null

    const interval = setInterval(() => {
      const sendLength = Object.keys(DATA_SEND).length
      if (sendLength === COUNT_MESSAGES
        && sendLength === Object.keys(DATA_CHECK).length) {
        clearInterval(interval)
        if (timeout) clearTimeout(timeout)
        resolve(true)
      }
    }, 100)

    timeout = setTimeout(() => {
      clearInterval(interval)
      reject(new Error('receive mqtt check timeout'))
    }, TIMEOUT_CHECK)
  })
  await promise

  await (new Promise((resolve, reject) => {
    client.end(false, {}, (err) => {
      if (err != null) reject(err)
      resolve(true)
    })
  }))

  clearInterval(progress)

  Object.keys(DATA_SEND).forEach((key) => {
    t.equal(DATA_CHECK[key], DATA_SEND[key])
  })

  const time2 = Date.now()

  const time = (time2 - time1) / (1000)
  const timeS = `${time.toFixed(2)} s`
  const speed = `${(COUNT_MESSAGES / time).toFixed(2)} rq/s`

  logger.info({ msg: 'wasted time', time: timeS, speed })
})
