const fetch = require('node-fetch')
const fs = require('fs')
const {
  JSON_FILE_PATH,
  APP_ID,
  API_TOKEN,
  REQUEST_THROTTLING_TIMEOUT,
  OUTPUT_FORMAT,
  ONE_MONTH,
  JSON_FILENAME
} = require('./constants')
const { appendToFile } = require('./utils')
const getTickets = require('./getTickets')

const MESSAGES_FOR_USER_IDS = [] // add user IDs for which to export messages
const DATA_FOR_USER_IDS = [] // add user IDs for which to export data
// this array gets populated with ticket channel URLs inside of getTickets.js
const DATA_FOR_CHANNEL_URLS = [] // add channel URLs for which to export data

// Max period of message data export is 31 days ( end_ts - start_ts <= 2,678,400,000)
// More about limitations: https://sendbird.com/docs/chat/v3/platform-api/guides/data-export#2-limitations
const now = new Date().getTime()
const dateRange = {
  from: now - (1 * ONE_MONTH),
  to: now
}

// ["messages", "channels",  "users",  "failed_webhooks"]
const dataTypes = ["messages"]

const formattedDate = {
  from: new Date(dateRange.from).toLocaleDateString(),
  to: new Date(dateRange.to).toLocaleDateString()
}

async function registerRequests(dataTypesIndex = 0) {
  // Docs: https://sendbird.com/docs/chat/v3/platform-api/guides/data-export#2-register-and-schedule-a-data-export
  const apiRoute = `https://api-${APP_ID}.sendbird.com/v3/export/${dataTypes[dataTypesIndex]}`
  const body = {
    start_ts: dateRange.from,
    end_ts: dateRange.to,
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
        // this array contains channel URLs from previously fetched tickets in getTickets.js
        body.channel_urls = DATA_FOR_CHANNEL_URLS
        console.log(`\nℹ️ Registering a new data export request for ${DATA_FOR_CHANNEL_URLS.length} channel URLs`);
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

  // register data export request to the Sendbird API
  const response = await fetch(apiRoute, {
    method: "POST",
    headers: { 'Api-Token': API_TOKEN },
    body: JSON.stringify(body)
  })

  if (response.status !== 200) {
    console.log(`\n❌ Failed request: ${response.status} - ${response.statusText}`)
    if (response.status === 400) {
      const { message } = await response.json()
      console.log(`❌ Error message: ${message}`)
    }
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
    requests: [],
    tickets: []
  }), (err) => {
    return console.log(err
      ? `\n❌ Init ${JSON_FILENAME} file error`
      : `\n✅ Init ${JSON_FILENAME} file success`)
  })

  // begin fetching ticket data
  const tickets = await getTickets(dateRange)
  DATA_FOR_CHANNEL_URLS.push(...tickets.map(_ => _.channelUrl))
  // register message export requests per ticket (channel)
  await registerRequests()
})()