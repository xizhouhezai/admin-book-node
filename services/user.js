const { querySql, queryOne } = require('../db')

const { md5 } = require('../utils')

const { PWD_SALT } = require('../utils/constant')

function login(username, password) {
  let pw = md5(`${password}${PWD_SALT}`)

  const sql = `select * from admin_user where username='${username}' and password='${pw}'`
  return querySql(sql)
}

function findUser(username) {
  const sql = `select * from admin_user where username='${username}'`
  return queryOne(sql)
}

function register(data) {
  const sql = `INSERT INTO user (  ) VALUES (  )`
}

module.exports = {
  login,
  findUser
}
