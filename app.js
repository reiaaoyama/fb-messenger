'use strict';

const
  fs = require('fs'),
  http = require('http'),
  https = require('https'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// https port other than 443 needs cert chain
const caCert = fs.readFileSync('sslcert/chain.pem');

// https using port 443 only needs these files
const privateKey = fs.readFileSync('sslcert/key.pem', 'utf8');
const certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');

const credentials = { 
  ca: caCert,
  key: privateKey, 
  cert: certificate};


const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);

const myServer = httpsServer;

if ( myServer == httpsServer ) { console.log("HTTPS Server\n") };

if ( myServer == httpServer ) console.log("HTTP Server\n");


// Sets server port and logs
myServer.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for FB webhook
app.post('/webhook', (req, res) => {

  let body = req.body;

  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      // PSID gives us the context of who we are talking to
      // https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/#build
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Parse the query params
  
  let VERIFY_TOKEN = "EAAC7ZB79GZCU0BAGsIcsZA8xbRydxlZCyAVyFUW5DQAwEXJq6ifdICi14Y0PqvZB0IChKnXVZAwtcIIKRCqrp96JkegRtRKEcvAQ5j6biRP2JYRIQIV51TyZBQuSexeF5PjrUiAIQ0MHgFZAr74ZCVCKQwRnrj8jrOEUtWA32HJzaLAZDZD"

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Respons with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

//Handles messages events
function handleMessage(sender_psid, received_message) {

}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {

}
