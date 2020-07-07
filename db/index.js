const mysql = require('mysql')

const { 
  host,
  user,
  password,
  database
} = require('./config')

const debug = require('../utils/constant').debug

function connect() {
  return mysql.createConnection({
    host,
    user,
    password,
    database
  })
}

function querySql(sql) {
  const conn = connect()
  debug && console.log(sql)
  return new Promise((resolve, reject) => {
    try {
      conn.query(sql, (err, results) => {
        if (err) {
          debug && console.log('查询失败，原因:' + JSON.stringify(err))
          reject(err)
        } else {
          debug && console.log('查询成功', JSON.stringify(results))
          resolve(results)
        }
      })
    } catch (e) {
      reject(e)
    } finally {
      conn.end()
    }
  })
}

module.exports = { querySql }