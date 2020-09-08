const { env } = require('./env')

const UPLOAD_PATH = env === 'dev' ? 'D:/static/upload/admin-book' : '/root/upload/admin-upload/ebook'

const OLD_UPLOAD_URL = env === 'dev' ? 'https://book.youbaobao.xyz/book/res/img' : 'https://www.youbaobao.xyz/book/res/img'

const UPLOAD_URL = env === 'dev' ? 'http://localhost:8089/admin-book' : 'https://www.youbaobao.xyz/admin-upload-ebook'

module.exports = {
  CODE_ERROR: -1,
  CODE_SUCCESS: 0,
  debug: true,
  PWD_SALT: 'admin_imooc_node',
  PRIVATE_KEY: 'admin_imooc_node_test_youbaobao_xyz',
  JWT_EXPIRED: 60 * 60, // token失效时间
  CODE_TOKEN_EXPIRED: -2,
  UPLOAD_PATH,
  MIME_TYPE_EPUB: 'application/epub+zip',
  OLD_UPLOAD_URL,
  UPLOAD_URL
}
