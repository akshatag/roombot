var ObjectId = require('mongodb').ObjectID;

var make = function(db) {

  var actions = {db: db};

  actions.allRooms = function(callback) {
    this.db.collection('rooms').find(function(err, docs) {
      docs.toArray(function(err, docs) {
        callback(docs);
      });
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
    console.log('ABOUT TO REMOVE TASK WITH ID: ', taskId);
    this.db.collection('tasks').remove({_id: ObjectId(taskId)}, function(err, res) {
      if (err) {
        console.log('Error: ', err);
      } else {
        console.log('Removed task with ID: ', taskId);
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
