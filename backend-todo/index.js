const { Client } = require('pg')
const express = require('express')
var cors = require('cors')

const app = express()
app.use(cors())

const connectionString =
  'postgres://hgflcmly:FOL42oje2U46EgmkhKJerW0v6FTtdqDN@manny.db.elephantsql.com/hgflcmly'
const colNames = 'title, description, hours, minutes, am'

const client = new Client({
  connectionString,
})

const connect = async () => {
  await client.connect()
  try {
    const createTable = await client.query(
      `CREATE TABLE IF NOT EXISTS todo (
          id SERIAL PRIMARY KEY,
          title VARCHAR(40) NOT NULL,
          description VARCHAR(500),
          hours INTEGER NOT NULL DEFAULT '12',
          minutes INTEGER NOT NULL DEFAULT '0',
          am BOOLEAN DEFAULT 'true'
  )`,
      []
    )
  } catch (err) {
    console.error(err)
  }
}

connect()

app.get('/', async (req, res) => {
  res.send('Welcome to the REST API for the Todo App made by Rohit Pal!')
})

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})

app.post('/add', async (req, res) => {
  try {
    await client.query(
      `INSERT INTO todo (${colNames}) VALUES ($1, $2, $3, $4, $5)`,
      [
        req.query.title,
        req.query.description,
        parseInt(req.query.hours),
        parseInt(req.query.minutes),
        true ? req.query.am == 'true' : false,
      ]
    )
    res.json({ sucess: true })
  } catch (err) {
    console.log('err while adding: ' + err)
    res.json({ sucess: false, message: String(err) })
  }
})

app.get('/tasks', async (req, res) => {
  try {
    const result = await client.query(`SELECT * FROM todo`, [])
    res.json(result.rows)
  } catch (err) {
    res.json({ success: false })
  }
})

app.post('/remove', async (req, res) => {
  try {
    const result = await client.query(`DELETE FROM todo WHERE id=$1`, [
      parseInt(req.query.id),
    ])
    res.json({ success: true, result: result.rows })
  } catch (err) {
    res.json({ success: false })
  }
})

module.exports = app
