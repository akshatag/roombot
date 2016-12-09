var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var VERIFY_TOKEN = EAAJO13fRAZAgBADW2HG59i9BCdfrOxKr5nu4zFNKOsqOqjg4dLBq7r44wiRylJHMbGLwvexVVbe28TJcREZBZCXy6cNgXRc7T0EmYDdAgZAiqhuc0ZBTtYTSPSrZAj5GFnqMVh8HIAm8DXE7ySvPBmHrOUVxtKITMpNDNas9mDZBAZDZD;


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

var sendMessage = function(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timestamp = event.timestamp;
  var messageID = message.mid;
  var message = event.message;

  sendTextMessage(senderID, "Hi, I am Roombot");
}

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
  res.sendStatus(200);

  var data = req.body;
  data.entry.forEach(function(entry) {
    entry.messaging.forEach(function(event) {
      if(event.message) {
        console.log('received message');
        sendMessage(event);
      }
    });
  });
});
