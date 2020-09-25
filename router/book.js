const express = require('express')
const multer = require('multer')
const boom = require('boom')

const Book = require('../models/Book')
const { UPLOAD_PATH } = require('../utils/constant')
const Result = require('../models/Result')

const { decoded } = require('../utils')
const bookService = require('../services/Book')

const db = require('../db')

const router = express.Router()


router.post(
  '/upload',
  multer({ dest: `${UPLOAD_PATH}/book` }).single('file'),
  (req, res, next) => {
    console.log('-----=====>', req.file)
    if (!req.file || req.file.length === 0) {
      new Result('上传电子书失败').fail(res)
    } else {
      const book = new Book(req.file)

      book.parse().then(book => {
        console.log('book===>', book)
        new Result(book, '上传电子书成功').success(res)
      }).catch(err => {
        console.log('-----=====>', err)
        next(boom.badImplementation(err))
      })
    }
  }
)

router.post(
  '/create',
  function(req, res, next) {
    const decode = decoded(req)
    if (decode && decode.username) {
      req.body.username = decode.username
    }
    const book = new Book(null, req.body)
    bookService.insertBook(book).then(() => {
      new Result('添加电子书成功').success(res)
    }).catch(err => {
      next(boom.badImplementation(err))
    })
  }
)

// let shijing = require('../shijing.json')
// router.post('/shijing', async (req, res, next) => {
//   // console.log(JSON.parse(shijing))
//   shijing.forEach(async (item) => {
//     console.log(item)
//     let toDb = {}
//     toDb.title = item.title
//     toDb.chapter = item.chapter
//     toDb.section = item.section
//     toDb.content = JSON.stringify(item.content)
//     await db.insert(toDb, 'shijing')
//   })
//   // console.log(shijing[0])
//   // let toDb = {}
//   // toDb.title = shijing[0].title
//   // toDb.chapter = shijing[0].chapter
//   // toDb.section = shijing[0].section
//   // toDb.content = JSON.stringify(shijing[0].content)
//   // console.log(toDb)
//   // await db.insert(toDb, 'shijing')
//   new Result('123131').success(res)
//   next()
// })

module.exports = router
