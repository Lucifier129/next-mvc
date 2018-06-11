const path = require('path')

module.exports = {
  webpack: config => {
    config.resolve.alias['next-mvc'] = path.join(__dirname, '../../lib/index')
    console.log('config', config)
    return config
  }
}