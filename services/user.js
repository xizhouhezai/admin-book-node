const { querySql } = require('../db')

const { md5 } = require('../utils')

const { PWD_SALT } = require('../utils/constant')

function login(username, password) {
  let pw = md5(`${password}${PWD_SALT}`)

  const sql = `select * from admin_user where username='${username}' and password='${pw}'`
  return querySql(sql)
}

module.exports = {
  login
}
