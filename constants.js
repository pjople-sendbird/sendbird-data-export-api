const path = require('path')
const JSON_FILENAME = "export-requests.json"
const JSON_FILE_PATH = path.join(__dirname, JSON_FILENAME)
const EXPORTED_DATA_DIR = path.join(__dirname, 'exports')
const APP_ID = "<APP_ID>" // replace with your App ID
const API_TOKEN = "<API_TOKEN>" // replace with your API token
const DESK_API_TOKEN = "<DESK_API_TOKEN>" // replace with your Desk API token
const REQUEST_THROTTLING_TIMEOUT = 5000
const OUTPUT_FORMAT = 'json' // json | csv
const ONE_MONTH = 1000 * 60 * 60 * 24 * 31 // 2,678,400,000

module.exports = {
  JSON_FILENAME,
  JSON_FILE_PATH,
  EXPORTED_DATA_DIR,
  APP_ID,
  API_TOKEN,
  DESK_API_TOKEN,
  REQUEST_THROTTLING_TIMEOUT,
  OUTPUT_FORMAT,
  ONE_MONTH
}