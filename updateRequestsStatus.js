const fs = require('fs');
const fetch = require('node-fetch');
const {
  JSON_FILE_PATH,
  APP_ID,
  API_TOKEN,
  REQUEST_THROTTLING_TIMEOUT,
} = require('./constants');
const { appendToFile } = require('./utils');

async function updateRequestsStatus(requests, index = 0) {
  // get dataType and requestId from saved json file
  const { dataType, requestId } = requests[index]
  console.log(`\nℹ️ Checking request with ID: ${requestId}`);

  const apiRoute = `https://api-${APP_ID}.sendbird.com/v3/export/${dataType}/${requestId}`

  const response = await fetch(apiRoute, {
    method: "GET",
    headers: { 'Api-Token': API_TOKEN }
  })

  if (response.status !== 200) {
    console.log(`\n❌ Failed request: ${response.status} - ${response.statusText}`)
    return
  }

  const { request_id, status, file } = await response.json()

  const data = {
    requestId: request_id,
    status,
    file
  }

  const result = await appendToFile(data)
  console.log(result);

  setTimeout(async function (index) {
    if (index < requests.length - 1) {
      index++
      await updateRequestsStatus(requests, index)
    }
  }.bind(this, index), REQUEST_THROTTLING_TIMEOUT)
}

// begin script here by reading the previously saved data in .json file
fs.readFile(JSON_FILE_PATH, function (err, data) {
  if (err) {
    resolve(`\n❌ ${JSON_FILE_PATH} file read error`)
    return
  }
  const json = JSON.parse(data)
  if (json.requests && json.requests.length) {
    console.log(`\nℹ️ Checking ${json.requests.length} requests.`);
    updateRequestsStatus(json.requests)
  }
})