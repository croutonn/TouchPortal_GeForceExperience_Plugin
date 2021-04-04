import config from './config'

function logIt(...args: unknown[]) {
  const curTime = new Date().toISOString()
  const message = [...args]
  const type = message.shift()
  console.log(curTime, ':', config.pluginId, `:${type}:`, message.join(' '))
}

export default logIt
