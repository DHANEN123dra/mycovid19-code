const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const dbPath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())

let db = null

const intilizeDbAndServer = async () => {
  try {
    db = await open({filename: dbPath, driver: sqlite3.Database})

    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB error ${error.message}`)
    process.exit(1)
  }
}
intilizeDbAndServer()

const convertStateObjectToResponseObject = newObject => {
  return {
    stateId: newObject.state_id,
    stateName: newObject.state_name,
    population: newObject.population,
  }
}
const convertDistrictObjectToResponseObject = newObject => {
  return {
    districtId: newObject.district_id,
    districtName: newObject.district_name,
    stateId: newObject.state_id,
    cases: newObject.cases,
    cured: newObject.cured,
    active: newObject.active,
    deaths: newObject.deaths,
  }
}

const convertStatsObjectToResponseObject = newObject => {
  return {
    totalCases: newObject.totalcases,
    totalCured: newObject.totalcured,
    totalActive: newObject.totalactive,
    toataDeaths: newObject.toatadeaths,
  }
}
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
   SELECT
     *
   FROM
    state
  ORDER BY
    state_id;`
  const stateArray = await db.all(getStatesQuery)
  response.send(
    stateArray.map(eachState => {
      return convertStateObjectToResponseObject(eachState)
    }),
  )
})

app.get('/state/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
  SELECT
    *
  FROM
   state
  WHERE
   state_id=${stateId};`
  const state = await db.get(getStateQuery)
  response.send(convertStateObjectToResponseObject(state))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO 
   district(district_name,state_id,cases,cured,active,deaths)
  VALUES
   ('${districtName}',${stateId},${cases},${cured},${active},${deaths});
  `
  await db.run(postDistrictQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
  SELECT
    *
  FROM
   district
  WHERE
   district_id=${districtId};`
  const district = await db.get(getDistrictQuery)
  response.send(convertDistrictObjectToResponseObject(district))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
  DELETE FROM 
   district
  WHERE
   district_id = ${districtId};`
  await db.run(deleteQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const updateQuery = `
  UPDATE
   district
  SET
   district_name = '${districtName}',
   state_id = ${stateId},
   cases = ${cases},
   cured = ${cured},
   active = ${active},
   deaths = ${deaths}
   Where
    district_id = ${districtId};`
  await db.run(updateQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const statsQuery = `
  SELECT
  SUM(cases) as totalCases,
  SUM(cured) as totalCured,
  SUM(active) as totalActive,
  SUM(deaths) as totalDeaths
  FROM
   district
  WHERE
   state_id = ${stateId};`

  const stats = await db.get(statsQuery)
  response.send(stats)
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStateIdQuery = `
  SELECT
   state_id
  FROM
   district
  WHERE
   district_id = ${districtId} ;`

  const districtIdResponse = await db.get(getStateIdQuery)

  const stateNameWithDistrictIdQuery = `
  SELECT
   state_name
  FROM
   state
  WHERE
   state_id = ${districtIdResponse.state_id};`

  const stateResponse = await db.get(stateNameWithDistrictIdQuery)
  response.send(stateResponse)
})

module.exports = app
