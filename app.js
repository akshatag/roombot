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

var contextuals = {};

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

function handlePostback(payload) {
  console.log('RECEIVED POSTBACK CALL: ', payload);
  var tokens = payload.split(' ');

  if (tokens[0] === 'room') {
    contextuals.roomId = tokens[1];
  } else if (tokens[0] === 'task') {
    this.dbActions.removeTask(tokens[1]);
  } else if (tokens[0] === 'expense') {
    this.dbActions.removeExpense(tokens[1]);
  } else if (tokens[0] === 'remind') {
    sendText(tokens[1], 'Reminder: ' + tokens[2]);
  }

  sendText(contextuals.senderId, 'done');

  return;
}

function parseAction(event) {
  var senderId = event.sender.id;
  var recipientId = event.recipient.id;
  var timestamp = event.timestamp;
  var text = event.message.text;

  var tokens = text.split(' ');
  var args = tokens.slice(1);
  var command = tokens[0];

  console.log('RECEIVED COMMAND: ', command);

  if (command == '+room') {
    contextuals.roomId = this.dbActions.writeNewRoom(args[0]);
    return;
  } else if (command == '$join') {
    this.dbActions.joinRoom(senderId, args[0], args[1], function(res) {
      if (res) {
        sendText(senderId, 'Joined room!');
      } else {
        sendText(senderId, 'Invalid room or wrong code');
      }
    });
    return;
  }
  else if (command == '$rooms') {
    this.dbActions.allRooms(senderId, function(results) {
      sendAttachment(senderId, roomsAttachment(results));
    });
    return;
  }

  if(contextuals.roomId == null || !contextuals.roomId) {
    sendText(senderId, 'Pick a room first!');
    this.dbActions.allRooms(function(docs) {
      sendAttachment(senderId, roomsAttachment(docs));
    });
    return;
  }

  /** CONTEXTUALS.ROOMID MUST BE SET BEFORE EXECUTING THESE **/
  switch (command) {
    case '+task':
      this.dbActions.writeTask(contextuals.roomId, args[0], args[1], function(err, res) {
        sendText(senderId, 'Added task!');
      });
      break;
    case '+expense':
      this.dbActions.writeExpense(contextuals.roomId, args[0], args[1], senderId, function(err, res) {
        sendText(senderId, 'Added expense!');
      });
      break;
    case '$details':
      this.dbActions.viewRoom(contextuals.roomId, function(err, doc) {
        sendText(senderId, JSON.stringify(doc));
      });
      break;
    case '$tasks':
      this.dbActions.getTasks(contextuals.roomId, function(tasks) {
        if(tasks == null || tasks.length == 0) {
          sendText(senderId, 'No Tasks');
        }
        sendTasksAttachment(senderId, tasks);
      });
      break;
    case '$expenses':
      this.dbActions.getExpenses(contextuals.roomId, function(expenses) {
        if(expenses == null || expenses.length == 0) {
          sendText(senderId, 'No Expenses');
        }
        sendExpensesAttachment(senderId, expenses);
      });
      break;
    default:
      sendText(senderId, 'help?');
  }

  contextuals.senderId = senderId;

}

function roomsAttachment(rooms) {
  var attachment = {
    type: 'template',
    payload: {
      template_type: 'list',
      top_element_style: 'compact',
      elements: []
    }
  }

  rooms.forEach(function(element) {
    var room = {
      title: element.name,
      buttons: [
        {
          title: 'Select',
          type: 'postback',
          payload: 'room ' + element._id
        }
      ]
    }
    attachment.payload.elements.push(room);
  });

  return attachment;
}

function sendTasksAttachment(senderId, tasks) {
  var attachment = {
    type: 'template',
    payload: {
      template_type: 'list',
      top_element_style: 'compact',
      elements: []
    }
  }

  tasks.forEach(function(element, idx, arr) {
    this.dbActions.getUserName(element.assignee, function(name) {
      var task = {
        title: element.title,
        subtitle: name,
        buttons: []
      };

      if (senderId == element.assignee) {
        task.buttons.push({
          title: 'Done',
          type: 'postback',
          payload: 'task ' + element._id
        });
      } else {
        task.buttons.push({
          title: 'Remind',
          type: 'postback',
          payload: 'remind ' + element.assignee + ' ' + element.title
        });
      }

      console.log('PUSHING TASK: ', JSON.stringify(task));
      attachment.payload.elements.push(task);
      if(attachment.payload.elements.length == arr.length){
        sendAttachment(senderId, attachment);
      }
    });
  });
}

function sendExpensesAttachment(senderId, expenses) {
  var attachment = {
    type: 'template',
    payload: {
      template_type: 'list',
      top_element_style: 'compact',
      elements: []
    }
  }

  expenses.forEach(function(element, idx, arr) {
    this.dbActions.getUserName(element.author, function(name) {
      var expense = {
        title: element.title,
        subtitle: "$" + element.amount + ' paid by ' + name,
        buttons: []
      };

      if(senderId == element.author){
        expense.buttons.push({
          title: 'Remove',
          type: 'postback',
          payload: 'expense ' + element._id
        });
      }

      attachment.payload.elements.push(expense);
      if(attachment.payload.elements.length == arr.length){
        sendAttachment(senderId, attachment);
      }
    });
  });
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
        } else if (event.postback && event.postback.payload) {
          handlePostback(event.postback.payload);
        }else {
          //console.log("Webhook received unknown event: ", event);
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
      //console.error(response);
      console.error(error);
    }
  });
}
