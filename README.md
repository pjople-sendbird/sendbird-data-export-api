# [Sendbird Data Export Platform API docs](https://sendbird.com/docs/chat/v3/platform-api/guides/data-export)

## Important information

1. This script is retrieving the responses from Sendbird API and outputs it in JSON format to a `export-requests.json` file which keeps record of all data export requests and their statuses.

    * By default, **this script will register data export requests only for Desk tickets**. Each Desk ticket is a wrapper for a normal Sendbird Group Channel so it has a channel URL associated with it. These channel URLs are then added inside `DATA_FOR_CHANNEL_URLS` (see step 6 below) and are used to register a new data export request.

    * The requested exported data from the Sendbird API, will be in the form of an output zip folder whose link will be updated in the exported file (`export-requests.json`) - [example output format](https://drive.google.com/file/d/1xF7LnCBypWkvWPV4HDk3rqlZmppVlg4E/view?usp=sharing).

    * The output zip folder will be unzipped and saved in the project directory (under `exports/`), if the status of a data export request is "_done_". To check/update each request's status see [step 3 in the Run section](#run).

2. Control the **time range** of the data export to request by changing the `dateRange` object variable in the `registerRequests.js` file.

3. Control which data types you would like to request data export for in the `dataTypes` array variable in the `registerRequests.js` file. Possible values are **messages**, **channels**, **users** and **failed_webhooks**.

4. Add user IDs to the `MESSAGES_FOR_USER_IDS` array variable in the `registerRequests.js` file for the users you would like to export data (effective only when using **messages** in `dataTypes` array)

5. Add user IDs to the `DATA_FOR_USER_IDS` array variable in the `registerRequests.js` file for the users you would like to export data (effective only when using **users** in `dataTypes` array)

6. Add channel URLs to the `DATA_FOR_CHANNEL_URLS` array variable in the `registerRequests.js` file for the channels you would like to export data (effective only when using **messages** or **channels** in `dataTypes` array)

7. All requests used in this script to the Sendbird API are rate-limited. [Learn more here](https://sendbird.com/docs/chat/v3/platform-api/guides/rate-limits#2-plan-based-limits).

## Install

From the root directory of this project run inside the terminal:

```bash
npm i
```

## Run

1. Update the `constants.js` file with your `APP_ID`, `DESK_API_TOKEN` and `API_TOKEN`

2. From the root directory of this project run inside the terminal:

    ```bash
    node registerRequests.js
    ```

3. Once the previous command is finished, run the following to fetch and update the output JSON file (`export-requests.json`) with requests' statuses

    ```bash
    node updateRequestsStatus.js
    ```