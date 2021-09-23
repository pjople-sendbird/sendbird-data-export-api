const fs = require('fs')
const fetch = require('node-fetch');
const StreamZip = require('node-stream-zip');
const path = require('path')
const { JSON_FILE_PATH, JSON_FILENAME, EXPORTED_DATA_DIR } = require("./constants")

function appendToFile(data = {}) {
  return new Promise(resolve => {
    if (!Object.keys(data).length) {
      resolve('\n❌ No data written.')
      return
    }
    // get previous data from JSON file and merge with data
    fs.readFile(JSON_FILE_PATH, function (err, existingData) {
      if (err) {
        resolve(`\n❌ ${JSON_FILENAME} file read error`)
        return
      }
      var json = JSON.parse(existingData)
      if (data.tickets && data.tickets.length) {
        // merge tickets' data
        json.tickets = [...(json.tickets || []), ...data.tickets]
      } else if (json.requests && json.requests.find(_ => _.requestId === data.requestId)) {
        // merge request with updated data if it exists
        json.requests = json.requests.map(request => {
          return request.requestId === data.requestId ? { ...request, ...data } : request
        })
      } else {
        // otherwise just append the new request data
        json.requests.push(data)
      }
      fs.writeFile(JSON_FILE_PATH, JSON.stringify(json), (err) => {
        resolve(err
          ? `\n❌ ${JSON_FILENAME} file write error`
          : `\n✅ ${JSON_FILENAME} file write success`);
      });
    })
  })
}

async function downloadAndExportZip(zipUrl, exportRequestId) {
  // download zip folder containing exported data
  const zipFilename = path.join(__dirname, `${exportRequestId}.zip`)
  const response = await fetch(zipUrl);
  const dest = fs.createWriteStream(zipFilename);
  response.body.pipe(dest);
  dest.on('error', (error) => {
    console.error(`\n❌ ${exportRequestId}.zip file write error`, error)
  });
  dest.on('close', async () => {
    // extract all data from downloaded zip folder
    const zip = new StreamZip.async({ file: zipFilename });
    await zip.extract(null, EXPORTED_DATA_DIR)
    await zip.close()
  });
}

// formatted output: YYYY-MM-DD
function formatDateString(date) {
  const dateFormat = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const parts = dateFormat.formatToParts(date);
  const formattedDateArray = []
  for (var i = parts.length - 1; i >= 0; i--) {
    if (parts[i].type !== 'literal') {
      formattedDateArray.push(parts[i].value)
    }
  }
  return formattedDateArray.join('-')
}

module.exports = {
  appendToFile,
  downloadAndExportZip,
  formatDateString
}