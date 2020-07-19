const express = require('express')

const router = express.Router()

const { body, validationResult } = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')

const Result = require('../models/Result')

const { login } = require('../services/user')

const { PRIVATE_KEY, JWT_EXPIRED } = require('../utils/constant')

router.post('/login',
  [
    body('username').isString().withMessage('username类型不正确'),
    body('password').isString().withMessage('password类型不正确')
  ],
  (req, res, next) => {
    const err = validationResult(req)

    if (!err.isEmpty()) {
      const [{ msg }] = err.errors
      next(boom.badRequest(msg))
    } else {
      const username = req.body.username
      const password = req.body.password

      login(username, password).then(user => {
        if (!user || user.length === 0) {
          new Result('登录失败').fail(res)
        } else {
          const token = jwt.sign(
            { username },
            PRIVATE_KEY,
            { expiresIn: JWT_EXPIRED }
          )
          new Result({ token }, '登录成功').success(res)
        }
      })
    }
})

router.get('/info', function(req, res, next) {
  res.json('user info...')
})

module.exports = router
