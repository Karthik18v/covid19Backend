const express = require("express");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
let db = null;
app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log(`Server Running At: http://localhost:3000/`)
    );
  } catch (error) {
    console.log(error);
  }
};

// get states

app.get("/states/", async (req, res) => {
  const stateQuery = `
    SELECT
    *
    FROM
    state
    ORDER BY
    state_id;`;

  const stateArray = await db.all(stateQuery);
  res.send(stateArray);
});

//get state

app.get("/states/:stateId", async (req, res) => {
  const { stateId } = req.params;
  const getStateQuery = `
  SELECT
  *
  FROM
  state
  WHERE
  state_id = ${stateId};`;
  const stateArray = await db.get(getStateQuery);
  res.send(stateArray);
});

// add district

app.post("/districts", (request, response) => {
  const districtDetails = request.body;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const districtQuery = `
  INSERT INTO 
  districts(district_name,state_id,cases, cured, active, deaths)
  VALUES
  (
      '${districtName}',
      ${stateId},
      '${cases}',
      '${cured}',
      '${active}',
      '${deaths}'
    );`;
  const dbResponse = db.run(districtQuery);
  const districtId = dbResponse.lastID;
  response.send("District Details Updated");
});

//get district

app.get("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictsQuery = `
  SELECT
  *
  FROM
  district
  WHERE
  district_id = ${districtId};`;
  const districtsArray = await db.get(getDistrictsQuery);
  res.send(districtsArray);
});

//delete district

app.delete("/districts/:districtId", async (req, res) => {
  const { districtId } = req.params;
  const getDistrictsQuery = `
  DELETE
  FROM
  district
  WHERE
  district_id = ${districtId};`;
  await db.get(getDistrictsQuery);
  res.send("District Removed");
});

//update district

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
  UPDATE 
    district
  SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
  WHERE
    district_id = ${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//get state stats

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT
    *
    FROM
    district
    WHERE
    state_id = ${stateId}`;
  let totalCases = 0;
  let totalCured = 0;
  let totalActive = 0;
  let totalDeaths = 0;
  const stateArray = await db.all(stateQuery);
  stateArray.map((each) => {
    totalCases += each.cases;
    totalCured += each.cured;
    totalActive += each.active;
    totalDeaths += each.deaths;
  });

  const dbResponse = {
    totalCases: totalCases,
    totalCured: totalCured,
    totalActive: totalActive,
    totalDeaths: totalDeaths,
  };

  response.send(dbResponse);
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
  SELECT
  *
  FROM
  district
  WHERE
  district_id = ${districtId};`;
  const districtsArray = await db.get(getDistrictsQuery);
  const stateId = districtsArray.state_id;
  const stateQuery = `
    SELECT
    *
    FROM
    state
    WHERE
    state_id=${stateId};`;
  const stateArray = await db.get(stateQuery);
  response.send({ state_name: stateArray.state_name });
});

initializeDBAndServer();
