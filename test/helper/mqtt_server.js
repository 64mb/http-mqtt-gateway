/* eslint-disable no-console */
require('dotenv').config()
const aedes = require('aedes')
const net = require('net')

const SERVER = {
  tcp: null,
  aedes: null,
}

async function init(port) {
  const serverAedes = aedes({})
  SERVER.aedes = serverAedes

  const serverTCP = net.createServer(serverAedes.handle)
  SERVER.tcp = serverTCP

  const promiseTCP = new Promise((resolve, reject) => {
    serverTCP.on('error', (err) => {
      console.error({ msg: 'error mqtt server listen tcp', error: err.stack || err, port })
      reject(err)
    })
    serverTCP.listen(port, () => {
      console.info({ msg: 'mqtt tcp server started', port: serverTCP.address().port })
      resolve(true)
    })
  })

  await promiseTCP

  return {
    port: serverTCP.address().port,
  }
}

async function stop() {
  const promiseTCP = new Promise((resolve, reject) => {
    SERVER.tcp.close((err) => {
      if (err != null) reject(err)
      resolve(true)
    })
  })

  const promiseAedes = new Promise((resolve, reject) => {
    SERVER.aedes.close((err) => {
      if (err != null) reject(err)
      resolve(true)
    })
  })

  await promiseTCP
  await promiseAedes
}

if (require.main === module) {
  init({
    port: process.env.MQTT_PORT || 1883,
  }).then(() => {
    console.info({ msg: 'mqtt server ready' })
  }).catch((err) => {
    console.fatal({ msg: 'mqtt server start failed', error: err.stack || err })
    process.exit(1)
  })
}

module.exports = {
  init,
  stop,
}
