const fs = require('fs')
const { JSON_FILE_PATH } = require("./constants")

function appendToFile(data = {}) {
  return new Promise(resolve => {
    if (!Object.keys(data).length) {
      resolve('\n❌ No data written.')
      return
    }
    // get previous data from JSON file and merge with data
    fs.readFile(JSON_FILE_PATH, function (err, existingData) {
      if (err) {
        resolve(`\n❌ ${JSON_FILE_PATH} file read error`)
        return
      }
      var json = JSON.parse(existingData)
      if (json.requests.find(request => request.requestId === data.requestId)) {
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
          ? `\n❌ ${JSON_FILE_PATH} file write error`
          : `\n✅ ${JSON_FILE_PATH} file write success`);
      });
    })
  })
}

module.exports = {
  appendToFile
}