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

const MESSAGES_FOR_USER_IDS = ['<USER_ID>']
const DATA_FOR_USER_IDS = ['<USER_ID>']
const DATA_FOR_CHANNEL_URLS = ['<CHANNEL_URL>']

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

async function registerRequests(dataTypesIndex = 0) {
  const formattedDate = {
    from: new Date(range.from).toLocaleDateString(),
    to: new Date(range.to).toLocaleDateString()
  }

  // Docs: https://sendbird.com/docs/chat/v3/platform-api/guides/data-export#2-register-and-schedule-a-data-export
  const apiRoute = `https://api-${APP_ID}.sendbird.com/v3/export/${dataTypes[dataTypesIndex]}`

  const response = await fetch(apiRoute, {
    method: "POST",
    headers: { 'Api-Token': API_TOKEN },
    body: JSON.stringify({
      start_ts: range.from,
      end_ts: range.to,
      format: OUTPUT_FORMAT,
      sender_ids: dataTypes[dataTypesIndex] === 'messages' ? MESSAGES_FOR_USER_IDS : null,
      user_ids: dataTypes[dataTypesIndex] === 'users' ? DATA_FOR_USER_IDS : null,
      channel_urls: dataTypes[dataTypesIndex] === 'messages' || dataTypes[dataTypesIndex] === 'channels' ? DATA_FOR_CHANNEL_URLS : null,
    })
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