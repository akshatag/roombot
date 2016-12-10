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
    console.log('LOOKING FOR ROOM w ROOMNAME: ', roomName);
    var res = this.db.collection('rooms').find({name: roomName}).toArray();

    console.log("NUMBER OF RESULTS: ", res.length);

    var room = res[0];

    console.log('HERE THE ROOM: ', room);
    return JSON.stringify(room);
  }

  return actions;
};

module.exports = make;
