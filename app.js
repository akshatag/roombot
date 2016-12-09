var express = require('express');
var bodyParser = requore('body-parser');
var request = require('request');
var app = express();


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

var sendMessage = function() {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timestamp = event.timestamp;
  var messageID = message.mid;
  var message = event.message;

  sendTextMessage(senderID, "Hi, I am Roombot");
}


app.get('/webhook', function (req, res) {
  var data = req.body;

  data.entry.forEach(funtion(entry) {
    entry.messaging.forEach(function(event) {
      if(event.message) {
        console.log('received message');
        sendMessage(event);
      }
    });
  });
  res.sendStatus(200);

});
