const fetch = require('node-fetch')
const fs = require('fs')
const {
  JSON_FILE_PATH,
  APP_ID,
  API_TOKEN,
  REQUEST_THROTTLING_TIMEOUT,
  OUTPUT_FORMAT
} = require('./constants')
const { appendToFile } = require('./utils')

const MESSAGES_FOR_USER_IDS = ['user1'] // add user IDs for which to export messages
const DATA_FOR_USER_IDS = [] // add user IDs for which to export data
const DATA_FOR_CHANNEL_URLS = [] // add channel URLs for which to export data

// period of all data types under 7 days
// since the amount of the data may affect the data export process.
const SEVEN_DAYS = 1000 * 60 * 60 * 24 * 7 // 604800000
const now = new Date().getTime()
const range = {
  from: now - SEVEN_DAYS,
  to: now
}

const dataTypes = [
  "messages",
  // "channels",
  // "users",
  // "failed_webhooks"
]

const formattedDate = {
  from: new Date(range.from).toLocaleDateString(),
  to: new Date(range.to).toLocaleDateString()
}

async function registerRequests(dataTypesIndex = 0) {
  // Docs: https://sendbird.com/docs/chat/v3/platform-api/guides/data-export#2-register-and-schedule-a-data-export
  const apiRoute = `https://api-${APP_ID}.sendbird.com/v3/export/${dataTypes[dataTypesIndex]}`
  const body = {
    start_ts: range.from,
    end_ts: range.to,
    format: OUTPUT_FORMAT,
  }

  switch (dataTypes[dataTypesIndex]) {
    case 'channels':
      if (DATA_FOR_CHANNEL_URLS.length) {
        body.channel_urls = DATA_FOR_CHANNEL_URLS
      }
      break;
    case 'messages':
      if (DATA_FOR_CHANNEL_URLS.length) {
        body.channel_urls = DATA_FOR_CHANNEL_URLS
      }
      if (MESSAGES_FOR_USER_IDS.length) {
        body.sender_ids = MESSAGES_FOR_USER_IDS
      }
      break;
    case 'users':
      if (DATA_FOR_USER_IDS.length) {
        body.user_ids = DATA_FOR_USER_IDS
      }
    default:
      break;
  }

  const response = await fetch(apiRoute, {
    method: "POST",
    headers: { 'Api-Token': API_TOKEN },
    body: JSON.stringify(body)
  })

  if (response.status !== 200) {
    console.log(`\n❌ Failed request: ${response.status} - ${response.statusText}`)
    return
  }

  const { request_id, status } = await response.json()
  const data = {
    requestId: request_id,
    dataType: dataTypes[dataTypesIndex],
    status,
    from: formattedDate.from,
    to: formattedDate.to,
  }

  console.log(`\nℹ️ Requested a new data export with request ID: ${request_id}`);

  const result = await appendToFile(data)
  console.log(result)

  setTimeout(async function (dataTypesIndex) {
    if (dataTypesIndex < (dataTypes.length - 1)) {
      dataTypesIndex++
      await registerRequests(dataTypesIndex)
    }
  }.bind(this, dataTypesIndex), REQUEST_THROTTLING_TIMEOUT)
}

(async function init() {
  // initialise json file - will delete all previous data and creates a new file if not found
  fs.writeFile(JSON_FILE_PATH, JSON.stringify({
    requests: []
  }), (err) => {
    return console.log(err
      ? `\n❌ Init ${JSON_FILE_PATH} file error`
      : `\n✅ Init ${JSON_FILE_PATH} file success`)
  })

  // begin fetching
  await registerRequests()
})()