const {
  MIME_TYPE_EPUB,
  OLD_UPLOAD_URL,
  UPLOAD_URL,
  UPLOAD_PATH
} = require('../utils/constant')

const fs = require('fs')
const path = require('path')
const Epub = require('../utils/epub')
const xml2js = require('xml2js').parseString

class Book {
  constructor(file, data) {
    if (file) {
      this.createBookFromFile(file)
    } else {
      this.createBookFromData(data)
    }
  }

  // 增加新的电子书
  createBookFromFile(file) {
    console.log(file)
    const {
      destination, // 存放目录
      filename, // 文件名称
      mimetype = MIME_TYPE_EPUB,
      path, // 文件目录
      originalname // 文件原始名称
    } = file

    // 电子书的文件后缀名
    const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
    // 电子书的原有路径
    const oldBookPath = path
    // 电子书的新路径
    const bookPath = `${destination}/${filename}${suffix}`
    // 电子书的下载URL
    const url = `${UPLOAD_URL}/book/${filename}${suffix}`
    // 电子书解压后的文件夹路径
    const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
    // 电子书解压后的文件夹URL
    const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`

    if (!fs.existsSync(unzipPath)) {
      fs.mkdirSync(unzipPath, { recursive: true })
    }
    if (fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
      fs.renameSync(oldBookPath, bookPath)
    }
    this.fileName = filename // 文件名
    this.path = `/book/${filename}${suffix}` // epub文件相对路径
    this.filePath = this.path
    this.unzipPath = `/unzip/${filename}` // epub解压后相对路径
    this.url = url // epub文件下载链接
    this.title = '' // 书名
    this.author = '' // 作者
    this.publisher = '' // 出版社
    this.contents = [] // 目录
    this.contentsTree = [] // 树状目录结构
    this.cover = '' // 封面图片URL
    this.coverPath = '' // 封面图片路径
    this.category = -1 // 分类ID
    this.categoryText = '' // 分类名称
    this.language = '' // 语种
    this.unzipUrl = unzipUrl // 解压后文件夹链接
    this.originalName = originalname // 电子书文件的原名
  }

  // 更新电子书
  createBookFromData(data) {}

  parse() {
    return new Promise((resolve, reject) => {
      const bookPath = `${UPLOAD_PATH}${this.filePath}`
      if (!fs.existsSync(bookPath)) {
        reject(new Error('电子书不存在'))
      }
      const epub = new Epub(bookPath)
      epub.on('error', err => {
        reject(err)
      })

      epub.on('end', err => {
        if (err) {
          reject(err)
        } else {
          console.log('epub.metadata', epub.metadata)
          const {
            language,
            creator,
            creatorFileAs,
            title,
            cover,
            publisher
          } = epub.metadata

          if (!title) {
            reject(new Error('图书标题为空'))
          } else {
            this.title = title
            this.language = language || 'en'
            this.author = creator || creatorFileAs || 'unknown'
            this.publisher = publisher || 'unknown'
            this.rootFile = epub.rootFile

            const handleGetImage = (err, file, mimeType) => {
              if (err) {
                reject(err)
              } else {
                const suffix = mimeType.split('/')[1]
                const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`
                const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`
                fs.writeFileSync(coverPath, file, 'binary')
                this.coverPath = `/img/${this.fileName}.${suffix}`
                this.cover = coverUrl
                resolve(this)
              }
            }

            try {
              this.unzip()
              this.parseContents(epub).then(({ chapters, chapterTree }) => {
                this.contents = chapters
                this.contentsTree = chapterTree
                epub.getImage(cover, handleGetImage)
              })
            } catch (error) {
              reject(error)
            }

          }
        }
      })

      epub.parse()
    })
  }

  // 解压电子书方法
  unzip() {
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(Book.genPath(this.path))
    zip.extractAllTo(Book.genPath(this.unzipPath), true)
  }

  // 解析电子书目录
  parseContents(epub) {
    function getNcxFilePath() {
      const spine = epub && epub.spine
      const manifest = epub && epub.manifest
      const ncx = spine.toc && spine.toc.href
      const id = spine.toc && spine.toc.id
      if (ncx) {
        return ncx
      } else {
        return manifest[id].href
      }
    }

    // 嵌套目录解析
    function findParent(array, level = 0, pid = '') {
      return array.map(item => {
        item.level = level
        item.pid = pid
        if (item.navPoint && item.navPoint.length > 0) {
          item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
        } else if (item.navPoint) {
          item.navPoint.level = level + 1
          item.navPoint.pid = item['$'].id
        }
        return item
      })
    }

    // 将嵌套目录变成一维数组
    function flatten(array) {
      return [].concat(...array.map(item => {
        if (item.navPoint && item.navPoint.length > 0) {
          return [].concat(item, ...flatten(item.navPoint))
        } else if (item.navPoint) {
          return [].concat(item, item.navPoint)
        }
        return item
      }))
    }

    const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)
    if (fs.existsSync(ncxFilePath)) {
      return new Promise((resolve, reject) => {
        const xml = fs.readFileSync(ncxFilePath, 'utf-8')
        const dir = path.dirname(ncxFilePath).replace(UPLOAD_PATH, '')
        const fileName = this.fileName
        const unzipPath = this.unzipPath
        xml2js(xml, {
          explicitArray: false,
          ignoreAttrs: false
        }, function(err, json) {
          if (err) {
            reject(err)
          } else {
            const navMap = json.ncx.navMap
            if (navMap.navPoint && navMap.navPoint.length > 0) {
              navMap.navPoint = findParent(navMap.navPoint)
              const newNavMap = flatten(navMap.navPoint)
              const chapters = []
              newNavMap.forEach((chapter, index) => {
                const src = chapter.content['$'].src
                chapter.id = `${src}`
                chapter.href = `${dir}/${src}`.replace(unzipPath, '')
                chapter.text = `${UPLOAD_URL}${dir}/${src}`
                chapter.label = chapter.navLabel.text || ''
                chapter.navId = chapter['$'].id
                chapter.fileName = fileName
                chapter.order = index + 1
                chapters.push(chapter)
              })

              const chapterTree = Book.genContentsTree(chapters)

              resolve({ chapters, chapterTree })
            } else {
              reject(new Error('目录解析失败，目录数为0'))
            }
          }
        })
      })
    } else {
      throw new Error('目录文件不存在')
    }
  }

  static genPath(path) {
    if (!path.startsWith('/')) {
      path = `/${path}`
    }
    return `${UPLOAD_PATH}${path}`
  }

  static genContentsTree(contents) {
    if (contents) {
      const contentsTree = []
      contents.forEach(c => {
        c.children = []
        if (c.pid === '') {
          contentsTree.push(c)
        } else {
          const parent = contents.find(_ => _.navId === c.pid)
          parent.children.push(c)
        }
      })
      return contentsTree
    }
  }
}

module.exports = Book
