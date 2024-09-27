const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const pathdb = path.join(__dirname, 'covid19IndiaPortal.db')
const app = express()
app.use(express.json())
let db = null

const initializedbserver = async () => {
  try {
    db = await open({
      filename: pathdb,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Server error ${e.message}`)
    process.exit(-1)
  }
}
initializedbserver()
const authentication = (request, response, next) => {
  let jwtToken
  const authheader = request.headers['authorization']
  if (authheader !== undefined) {
    jwtToken = authheader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MySecretKey', (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectuserquery = `SELECT * FROM user WHERE username='${username}'`
  const dbuser = await db.get(selectuserquery)
  if (dbuser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const passwordmatch = await bcrypt.compare(password, dbuser.password)
    if (passwordmatch) {
      const payload = {
        username: username,
      }
      const jwttoken = jwt.sign(payload, 'MySceretKey')
      response.send({jwttoken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.get('/states/', authentication, async (request, response) => {
  const getstatesquery = `
    SELECT state_id as stateId,
    state_name as stateName,
    population as population 
    FROM user `
  const statelist = await db.all(getstatesquery)
  response.send(statelist)
})
module.exports = app
