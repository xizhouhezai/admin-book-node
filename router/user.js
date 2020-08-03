const express = require('express')

const router = express.Router()

const { body, validationResult } = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')

const Result = require('../models/Result')

const { login, findUser } = require('../services/user')

const { PRIVATE_KEY, JWT_EXPIRED } = require('../utils/constant')

const { decode } = require('../utils')

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
  const decoded = decode(req)
  if (decoded && decoded.username) {
    findUser(decoded.username).then(user => {
      if (user) {
        user.roles = [user.role]
        new Result(user, '获取用户信息成功').success(res)
      } else {
        new Result('获取用户信息失败').fail(res)
      }
    })
  } else {
    new Result('用户信息解析失败').fail(res)
  }
})

// 前端用户注册接口
router.post('/register', (req, res, next) => {
  new Result('获取用户信息成功').success(res)
})

module.exports = router
