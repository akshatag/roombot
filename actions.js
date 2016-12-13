var ObjectId = require('mongodb').ObjectID;

var make = function(db) {

  var actions = {db: db};

  actions.allRooms = function(senderId, callback) {
    this.db.collection('roommates').findOne({senderId: senderId}, function(res, doc) {
      var rooms = doc.rooms;
      var results = [];
      console.log('HERE ARE THE ROOMS ', rooms);
      rooms.forEach(function(element, idx, arr) {
        consoe.log('FINDING ELEMENT ', element);
        this.db.collection('rooms').findOne({_id: ObjectId(element)}, function(res, doc) {
          results.push(doc);
        });
        if (results.length == arr.length) {
          console.log('WE MADE IT');
          callback(results);
        }
      });
    });
  }

  actions.joinRoom = function(senderId, roomname, code, callback) {
    this.db.collection('rooms').findOne({name: roomname}, function(err, doc) {
      if(doc.code === code) {
        var roomId = doc._id;
        this.db.collection('roommates').findOne({senderId: senderId}, function(err, doc) {
          var rooms = doc.rooms;
          rooms.push(roomId);
          this.db.collection('roommates').update({senderId: senderId}, {$set : {rooms: rooms}});
        });
        callback(1);
      } else {
        callback(0);
      }
    });
  }

  actions.writeNewRoom = function(name) {
    var room  = {name: name, tasks: [], expenses: [], roommates: []};
    this.db.collection('rooms').insert([room], function(err, res) {
      if (err){
        console.log('Could not write to db. Err: ', err);
      }
      this.db.collection('rooms').findOne({name: name}, function (err, doc) {
        console.log('HERE IS THE NEW ROOM: ', doc);
        return doc._id;
      });
    });
  }

  actions.writeTask = function(roomId, name, assignee, callback) {
    var sid = this.getSenderId(assignee, function(sid) {
      var task = {room: roomId, title: name, assignee: sid};
      this.db.collection('tasks').insert([task], callback);
    });
  }

  actions.writeExpense = function(roomId, name, amount, author, callback) {
    var expense = {room: roomId, title: name, amount: amount, author: author};
    this.db.collection('expenses').insert([expense], callback);
  }

  actions.getSenderId = function(name, callback) {
    this.db.collection('roommates').findOne({name: name}, function(err, doc){
      var senderId = doc.senderId;
      callback(senderId);
    });
  }

  actions.getUserName = function(senderId, callback) {
    console.log('SEARCHING FOR NAME OF SENDER: ', senderId);
    this.db.collection('roommates').findOne({senderId: senderId}, function(err, doc){
      var name = doc.name;
      callback(name);
    });
  }

  actions.getTasks = function(roomId, callback) {
    this.db.collection('tasks').find({room: roomId}, function(err, docs){
      docs.toArray(function(err, docs) {
        callback(docs);
      });
    });
  }

  actions.getExpenses = function(roomId, callback) {
    this.db.collection('expenses').find({room: roomId}, function(err, docs) {
      docs.toArray(function(err, docs) {
        callback(docs);
      });
    });
  }

  actions.updateRoom = function(roomId, roomAttrs) {
    console.log('LOOKING FOR ROOM w ID: ', roomId);
    this.db.collection('rooms').update({_id: ObjectId(roomId)}, {$set: roomAttrs});
  }

  actions.viewRoom = function(roomId, callback) {
    this.db.collection('rooms').findOne({_id: ObjectId(roomId)}, callback);
  }

  actions.removeTask = function(taskId) {
    this.db.collection('tasks').remove({_id: ObjectId(taskId)}, function(err, res) {
      if (err) {
        console.log('Error: ', err);
      }
    });
  }

  actions.removeExpense = function(expenseId) {
    this.db.collection('expenses').remove({_id: ObjectId(expenseId)}, function(err, res) {
      if (err) {
        console.log('Error: ', err);
      }
    });
  }




  return actions;
};

module.exports = make;
