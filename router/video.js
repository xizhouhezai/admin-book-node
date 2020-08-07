const express = require('express')
let fs = require('fs-extra')
let path = require('path')
let concat = require('concat-files')
let formidable = require('formidable')

const Result = require('../models/Result')
const { UPLOAD_PATH } = require('../utils/constant')

const router = express.Router()

// 检查文件的MD5
router.get('/check/file', (req, resp) => {
  let query = req.query
  console.log(query)
  let fileName = query.fileName
  let fileMd5Value = query.fileMd5Value
  // 获取文件Chunk列表
  getChunkList(
    path.join(`${UPLOAD_PATH}/video`, fileName),
    path.join(`${UPLOAD_PATH}/video`, fileMd5Value),
    data => {
      new Result(data, '检验成功').success(resp)
    }
  )
})

// 检查chunk的MD5
router.get('/check/chunk', (req, resp) => {
  let query = req.query
  let chunkIndex = query.index
  let md5 = query.md5

  fs.stat(path.join(`${UPLOAD_PATH}/video`, md5, chunkIndex), (err, stats) => {
    if (stats) {
      new Result({
        exit: true,
        desc: 'Exit 1'
      }).success(resp)
    } else {
      new Result({
        exit: false,
        desc: 'Exit 0'
      }).success(resp)
    }
  })
})

// 合并分片的文件
router.get('/merge', (req, resp) => {
  const { md5, fileName } = req.query

  console.log(md5, fileName)
  mergeFiles(path.join(`${UPLOAD_PATH}/video`, md5), `${UPLOAD_PATH}/video`, fileName).then(res => {
    new Result(res).success(resp)
  }, err => {
    new Result('合并失败').fail(res)
  })
})

router.post('/upload', (req, resp) => {
  var form = new formidable.IncomingForm({
    uploadDir: `${UPLOAD_PATH}/video`
  })

  form.parse(req, function (err, fields, file) {
    let index = fields.index
    let total = fields.total
    let fileMd5Value = fields.fileMd5Value
    let folder = path.resolve(`${UPLOAD_PATH}/video`, fileMd5Value)
    folderIsExit(folder).then(val => {
      let destFile = path.resolve(folder, fields.index)
      console.log('----------->', file.data.path, destFile)
      copyFile(file.data.path, destFile).then(
        successLog => {
          new Result({
            index: index
          }, successLog).success(resp)
        },
        errorLog => {
          new Result({
            desc: errorLog
          }).success(resp)
        }
      )
    })
  })
})

// 文件夹是否存在, 不存在则创建文件
function folderIsExit(folder) {
  return new Promise(async (resolve, reject) => {
    let result = await fs.ensureDirSync(path.join(folder))
    console.log('result----', result)
    resolve(true)
  })
}
// 把文件从一个目录拷贝到别一个目录
function copyFile(src, dest) {
  return new Promise((resolve, reject) => {
    fs.rename(src, dest, err => {
      if (err) {
        reject(err)
      } else {
        resolve('copy file:' + dest + ' success!')
      }
    })
  })
}

// 获取文件Chunk列表
async function getChunkList(filePath, folderPath, callback) {
  let isFileExit = await isExist(filePath)
  let result = {}
  // 如果文件已在存在, 不用再继续上传, 真接秒传
  if (isFileExit) {
    result = {
      file: {
        isExist: true,
        name: filePath
      },
      desc: 'file is exist'
    }
  } else {
    let isFolderExist = await isExist(folderPath)
    console.log(folderPath)
    // 如果文件夹(md5值后的文件)存在, 就获取已经上传的块
    let fileList = []
    if (isFolderExist) {
      fileList = await listDir(folderPath)
    }
    result = {
      chunkList: fileList,
      desc: 'folder list'
    }
  }
  callback(result)
}

// 文件或文件夹是否存在
function isExist(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      // 文件不存在
      if (err && err.code === 'ENOENT') {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

// 列出文件夹下所有文件
function listDir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, data) => {
      if (err) {
        reject(err)
        return
      }
      // 把mac系统下的临时文件去掉
      if (data && data.length > 0 && data[0] === '.DS_Store') {
        data.splice(0, 1)
      }
      resolve(data)
    })
  })
}
// 合并文件
async function mergeFiles(srcDir, targetDir, newFileName) {
  console.log(...arguments)
  let targetStream = fs.createWriteStream(path.join(targetDir, newFileName))
  let fileArr = await listDir(srcDir)
  // 把文件名加上文件夹的前缀
  for (let i = 0; i < fileArr.length; i++) {
    fileArr[i] = srcDir + '/' + fileArr[i]
  }
  console.log(fileArr)
  return new Promise((resolve, reject) => {
    concat(fileArr, path.join(targetDir, newFileName), (err) => {
      if (err) {
        reject(err)
        return
      }
      resolve('合并成功')
    })
  })
}

module.exports = router
