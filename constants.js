const path = require('path')
const JSON_FILE_PATH = path.join(__dirname, "./export-requests.json")
const APP_ID = "<APP_ID>" // replace with your App ID
const API_TOKEN = "<API_TOKEN>" // replace with your API token
const REQUEST_THROTTLING_TIMEOUT = 5000
const OUTPUT_FORMAT = 'json' // json | csv

module.exports = {
  JSON_FILE_PATH,
  APP_ID,
  API_TOKEN,
  REQUEST_THROTTLING_TIMEOUT,
  OUTPUT_FORMAT
}