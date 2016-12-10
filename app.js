var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var mongoDB = require('mongodb');

var DATABASE_URL = 'mongodb://ds129028.mlab.com:29028/roombot';
var VERIFY_TOKEN = 'EAAJO13fRAZAgBADW2HG59i9BCdfrOxKr5nu4zFNKOsqOqjg4dLBq7r44wiRylJHMbGLwvexVVbe28TJcREZBZCXy6cNgXRc7T0EmYDdAgZAiqhuc0ZBTtYTSPSrZAj5GFnqMVh8HIAm8DXE7ySvPBmHrOUVxtKITMpNDNas9mDZBAZDZD';
var DATABASE_USERNAME = 'admin';
var DATABASE_PASSWORD = 'root'

/** CONNECT TO DATABASE **/
var mongoCL = mongoDB.MongoClient;
var dbActions;
var db;

mongoCL.connect(DATABASE_URL, function (err, db) {
  if (err) {
    console.log('Unable to connect to mongoDB. Err: ', err);
  } else {
    console.log('Connection established to ', DATABASE_URL);
    this.db = db;

    db.authenticate(DATABASE_USERNAME, DATABASE_PASSWORD, function (err, res) {
      if (err) {
        console.log('Unable to authenticate db. Err: ', err);
      }

      this.dbActions = require('./actions.js')(db);

      var cursor = this.db.collection('rooms').find({name: '3934sansom'});
      cursor.toArray(function (err, docs) {
        if (err) {
          console.log(err);
        }
        console.log(docs);
      });
    });
  }
});

/** MESSENGER BOT WEBHOOK **/
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

function parseAction(event) {
  var senderId = event.sender.id;
  var recipientId = event.recipient.id;
  var timestamp = event.timestamp;
  var text = event.message.text;

  // not an action event
  if (!text.startsWith('$')) {
    return;
  }

  var tokens = text.split(' ');
  var args = tokens.slice(1);
  var command = tokens[0];

  switch (command) {
    case '$new-room':
      this.dbActions.writeNewRoom(args[0]);
      break;
    case '$details':
      this.dbActions.viewRoom(args[0]);
      break;
    default:
      sendText(senderId, 'help?');
  }

}

function buttonAttachment(text, buttons) {
  var attachment = {
    type: 'template',
    payload: {
      template_type : 'button',
      text: text,
      buttons: buttons
    }
  }
  return attachment;
}

/** TEST IF THE APP IS UP **/
app.get('/', function(req, res) {
  res.send('I am roombot');
});

/** AUTHENTICATE WEBOOK **/
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

/** MAIN ENDPOINT FOR MESSENGER BOT **/
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageId = entry.id;
      var timestamp = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          parseAction(event);
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    res.sendStatus(200);
  }
});

function sendText(recipientId, messageText) {
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

function sendAttachment(recipientId, attachment) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: attachment
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(message) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: VERIFY_TOKEN },
    method: 'POST',
    json: message
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;
      console.log("Sent message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });
}
