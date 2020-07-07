const express = require('express')

const router = express.Router()

const Result = require('../models/Result')

const { login } = require('../services/user')

router.post('/login', (req, res) => {
  const username = req.body.username
  const password = req.body.password

  login(username, password).then(user => {
    if (!user || user.length === 0) {
      new Result('登录失败').fail(res)
    } else {
      new Result(user, '登录成功').success(res)
    }
  })
})

router.get('/info', function(req, res, next) {
  res.json('user info...')
})

module.exports = router
