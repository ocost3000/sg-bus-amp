/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/




const express = require('express')
const http = require('http')
const https = require('https')
const axios = require('axios').default
const bodyParser = require('body-parser')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const { Http2ServerRequest } = require('http2')

// declare a new express app
const app = express()
app.use(bodyParser.json())
app.use(awsServerlessExpressMiddleware.eventContext())

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "*")
  next()
});

/****************************************
 * TODO: Setup access to secret API Key *
 ****************************************/
const secretHeader = {"X-Aws-Parameters-Secrets-Token": process.env.AWS_SESSION_TOKEN};
const apiSecretEndpoint = "http://localhost:" +
    process.env.PARAMETERS_SECRETS_EXTENSION_HTTP_PORT +
    "/secretsmanager/get?secretId=" +
    "SGBUS_API_Key";
// let LTA_API_KEY = "";
// http.get(apiSecretEndpoint, secretHeader, (res) => {
//   console.log('Requested Secret');
// 
//   res.on('data', (d) => {
//     console.log('Secret successfully accessed');
//     LTA_API_KEY = d.toString();
//   });
// 
// }).on('error', (e) => {
//   console.error(`Error requesting secret: ${e}`);
// })

// TODO: Test AXIOS
async function getApiKeyHeader() {
  const response = await axios.get(apiSecretEndpoint, { headers: secretHeader });
  return { AccountKey: response.toString() };
}

/**********************
 * Connect to LTA API *
 **********************/
const ltaApiEndpoint = 'http://datamall2.mytransport.sg/ltaodataservice';
// http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=83139

/**********************
 * Example get method *
 **********************/

app.get('/bus/:arrivals', async function(req, res) {
  // Do API Call on bus station
  const ltaBusArrivalsEndpoint = `${ltaApiEndpoint}/BusArrivalv2/?BusStopCode=${req.params.arrivals}`;
  const ltaHeaders = null;

  try {
    ltaHeaders = await getApiKeyHeader();
    console.log("Axios retrieved secret");
  } catch (error) {
    console.error("Axios failed secret");
    res.json(error);
    return;
  }


  try {
    const response = await axios.get(ltaBusArrivalsEndpoint, { headers: ltaHeaders });
    console.log("Axios retrieve LTA Request");
    res.json(response);
  } catch (error) {
    console.error("Axios failed LTA Request");
    res.json(error);
    return;
  }

});

app.listen(3000, function() {
    console.log("App started")
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app
