const fetch = require("node-fetch")
const { APP_ID, REQUEST_THROTTLING_TIMEOUT, DESK_API_TOKEN } = require("./constants")
const { appendToFile, formatDateString } = require("./utils")

function getTickets(dateRange) {
  const dateFrom = new Date(dateRange.from)
  const startDate = formatDateString(dateFrom)
  const dateTo = new Date(dateRange.to)
  const endDate = formatDateString(dateTo)
  // This array will be filled with responses from the API
  const tickets = []

  /**
   * @returns {Promise<Array>} tickets
   */
  return new Promise(async resolve => {
    async function _getTickets(_next) {
      const apiRoute = _next || `https://desk-api-${APP_ID}.sendbird.com/platform/v1/tickets?limit=10&start_date=${startDate}&end_date=${endDate}`
      const response = await fetch(apiRoute, {
        method: 'GET',
        headers: { 'SENDBIRDDESKAPITOKEN': DESK_API_TOKEN }
      })

      if (response.status !== 200) {
        console.log(`\n❌ Failed request: ${response.status} - ${response.statusText}`)
        if (response.status === 400) {
          const { message } = await response.json()
          console.log(`❌ Error message: ${message}`)
        }
        return
      }

      const { results, next } = await response.json()
      console.log(`\nℹ️ ${results.length} tickets were found`);

      // More data fields in ticket resonse object in linke below:
      // Docs: https://sendbird.com/docs/desk/v1/platform-api/guides/ticket#2-list-tickets-3-response
      const data = results.map(ticket => ({
        id: ticket.id,
        project: ticket.project,
        channelUrl: ticket.channelUrl,
        channelName: ticket.channelName,
        channelType: ticket.customer.channelType,
        customerId: ticket.customer.id,
        customerSendbirdId: ticket.customer.sendbirdId,
        customerName: ticket.customer.displayName,
      }))

      tickets.push(...data)
      const result = await appendToFile({ tickets: data })
      console.log(result)

      setTimeout(async function (_next) {
        if (_next) {
          await _getTickets(_next)
        } else {
          resolve(tickets)
        }
      }.bind(this, next), REQUEST_THROTTLING_TIMEOUT)
    }
    _getTickets()
  })
}

module.exports = getTickets