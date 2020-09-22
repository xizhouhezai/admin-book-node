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
    host: '',
    user: 'root',
    password: '',
    database: 'book',
    port: ''
  }
}

module.exports = options
