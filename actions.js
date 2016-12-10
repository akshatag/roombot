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

  actions.viewRoom = function(roomName) {
    room = this.db.collection('rooms').find({name: roomName}).toArray[0];
    return JSON.stringify(room);
  }

  return actions;
};

module.exports = make;
