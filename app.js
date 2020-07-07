const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const router = require('./routerr')

const app = express()

const fs = require('fs')
const https = require('https')

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(cors())

app.use('/', router)

const privateKey = fs.readFileSync('https/2_api.xizhouhezai.com.key', 'utf8')
const certificate = fs.readFileSync('https/1_api.xizhouhezai.com_bundle.crt', 'utf8')
const credentials = { key: privateKey, cert: certificate }
const httpsServer = https.createServer(credentials, app)
const SSLPORT = 18082

const server = app.listen(5000, () => {
  const { address, port } = server.address()
  console.log('server is running on http://%s:%s', address, port)
})

httpsServer.listen(SSLPORT, function() {
  console.log('HTTPS Server is running on: https://localhost:%s', SSLPORT)
})

