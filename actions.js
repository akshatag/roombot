var make = function(db) {

  var actions = {db: db};

  actions.writeNewRoom = function(name) {
    var room  = {name: name};
    this.db.collection('rooms').insert([room], function(err, res) {
      if (err){
        console.log('Could not write to db. Err: ', err);
      }
    });
  }

  actions.updateRoom = function(roomId, roomAttrs) {
    this.db.collection('rooms').update({id: roomId}, {$set: roomAttrs});
  }

  actions.viewRoom = function(roomName, callback) {
    console.log('LOOKING FOR ROOM w ROOMNAME: ', roomName);
    this.db.collection('rooms').findOne({name: roomName}, callback);
  }

  return actions;
};

module.exports = make;
