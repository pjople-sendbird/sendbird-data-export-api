const fs = require('fs');
const fetch = require('node-fetch');
const {
  JSON_FILE_PATH,
  APP_ID,
  API_TOKEN,
  REQUEST_THROTTLING_TIMEOUT,
  JSON_FILENAME,
} = require('./constants');
const { appendToFile, downloadAndExportZip } = require('./utils');

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
    if (response.status === 400) {
      const { message } = await response.json()
      console.log(`❌ Error message: ${message}`)
    }
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

  if (status === 'done') {
    console.log(`\nℹ️ Downloading and exporting zip folder for request ID = ${request_id}`);
    downloadAndExportZip(file.url, request_id)
  }

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
    resolve(`\n❌ ${JSON_FILENAME} file read error`)
    return
  }
  const json = JSON.parse(data)
  if (json.requests && json.requests.length) {
    console.log(`\nℹ️ Checking ${json.requests.length} request(s).`);
    updateRequestsStatus(json.requests)
  }
})