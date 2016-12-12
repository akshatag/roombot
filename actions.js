var make = function(db) {

  var actions = {db: db};

  actions.allRooms = function(callback) {
    this.db.collection('rooms').find(function(err, docs) {
      docs.toArray(function(err, docs) {
        console.log('DOC LENGTH: ', docs.length);
        callback(docs);
      });
    });
  }

  actions.writeNewRoom = function(name) {
    var room  = {name: name};
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

  actions.updateRoom = function(roomId, roomAttrs) {
    this.db.collection('rooms').update({id: roomId}, {$set: roomAttrs});
  }

  actions.viewRoom = function(roomId, callback) {
    console.log('LOOKING FOR ROOM w id: ', roomId);
    this.db.collection('rooms').findOne({_id: ObjectId(roomId)}, callback);
  }

  return actions;
};

module.exports = make;
