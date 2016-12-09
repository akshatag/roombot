var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var VERIFY_TOKEN = "EAAJO13fRAZAgBADW2HG59i9BCdfrOxKr5nu4zFNKOsqOqjg4dLBq7r44wiRylJHMbGLwvexVVbe28TJcREZBZCXy6cNgXRc7T0EmYDdAgZAiqhuc0ZBTtYTSPSrZAj5GFnqMVh8HIAm8DXE7ySvPBmHrOUVxtKITMpNDNas9mDZBAZDZD";


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

var receivedMessage = function(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timestamp = event.timestamp;
  var messageID = message.mid;
  var message = event.message;

  sendTextMessage(senderID, "Hi, I am Roombot");
}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}


function callSendAPI(message) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: VERIFY_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });

app.get('/', function(req, res) {
  res.send('I am roombot');
})

app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
});


}
