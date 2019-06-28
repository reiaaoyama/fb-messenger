// Example chat server servicing FB messenger chatbot
// Adapted and modified from the original source on FB Example page
// Retrieved on 2019-01-07
// Copyright Pasvorn Boonmark 2019
// Release under FreeBSD license


'use strict';

const
  fs = require('fs'),
  http = require('http'),
  https = require('https'),
  express = require('express'),
  bodyParser = require('body-parser'),
  request = require('request'),
  app = express().use(bodyParser.json()); // creates express http server

const
  pbid =  2072148472831476;

// FB Messenger lesten on port 1337
const myPort = 1337;

// https port other than 443 needs cert chain
const caCert = fs.readFileSync('sslcert/chain.pem');

// https using port 443 only needs these files
const privateKey = fs.readFileSync('sslcert/key.pem', 'utf8');
const certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');

const credentials = { 
  ca: caCert,
  key: privateKey, 
  cert: certificate};

const PAGE_ACCESS_TOKEN = fs.readFileSync('../token.txt');

// prepare https server
const httpsServer = https.createServer(credentials, app);
const httpServer = http.createServer(app);

const myServer = httpsServer;

// nlpDebug is off by default
var nlpDebug = 0;
var pnlpDebug = nlpDebug;
var debug = 0;

if ( myServer == httpsServer ) { console.log("HTTPS Server\n") }
else 
if ( myServer == httpServer ) console.log("HTTP Server\n");


// Sets server port and logs
myServer.listen(process.env.PORT || myPort, () => console.log('webhook is listening'));

// Creates the endpoint for FB webhook
app.post('/webhook', (req, res) => {

  let body = req.body;

  if (body.object === 'page') {

    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      if (debug) {
        console.log(webhook_event);
      }

      // Get the sender PSID
      // PSID gives us the context of who we are talking to
      // https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/#build
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }

    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }

});
// End of app.post('/webhook')

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Parse the query params
  
  let VERIFY_TOKEN = fs.readFileSync('../token.txt');

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

//
// WEBHOOK handling
//

//Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  let nlp = received_message.nlp;
  let listNLP = [];

  // Using NLP - if enabled
  const greeting = firstEntity(nlp, 'greetings');
  if (greeting && greeting.confidence > 0.8) {
    let entities = nlp.entities;
    let numNLP = Object.keys(entities).length;
    console.log(`Greeting received: has ${numNLP} NLP entities\n`);
    response = {
      "text": "Hi there!"
    }
  } else 

  if (received_message.text) {
    // Create the payload for a basic text message
    var myText = `You sent the message: "${received_message.text}"`;

    // handling debug messages - this will be global and not per user
    // only allow pbid to set debug level. Otherwise, no debug for you
    if (sender_psid == pbid) {
      nlpDebug = pnlpDebug;
      if (received_message.text == "debug:off") nlpDebug=0;
      if (received_message.text == "debug:on") nlpDebug=1;
      pnlpDebug = nlpDebug;
    } else {
      pnlpDebug = nlpDebug;
      nlpDebug = 0;
    }

    // we get NLP entities
    if (nlp && nlpDebug) {
      myText += JSON.stringify(nlp, null, 2);
    }
    response = {
      "text": myText
    }
  }

  // Send the response message
  console.log(`Sending message back to ${sender_psid}\n`);
  callSendAPI(sender_psid, response);

}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  // "received_postback is calle when a user tap menu or button
  // on the chat

  console.log("handlePostback() called:\n");

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}


// FB NLP related
function firstEntity(nlp, name) {
  return nlp && nlp.entities && nlp.entities[name] && nlp.entities[name][0];
}

