const { env } = require('../utils/env')

let options = {}

if (env === 'dev') {
  options = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'book',
    port: 3306
  }
} else {
  options = {
    host: '148.70.23.39',
    user: 'root',
    password: 'qq19930220',
    database: 'book',
    port: 3307
  }
}

module.exports = options
