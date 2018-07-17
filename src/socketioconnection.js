// // var io = require("socket.io-client");
// // var WebSocket = require("ws")
var Emitter = require("wildemitter");
var phoenix = require("phoenix");
var uuidv4 = require("uuid/v4");

// var Presence = require("phoenix");
var Socket = phoenix.Socket;
var Presence = phoenix.Presence;

var WS = function(config) {
  var self = this;
  this.id = uuidv4();
  this.socket = new Socket(config.url, { params: { user_id: this.id } });
  this.socket.connect();
  this.presences = [];
  this.socket.onOpen(function() {
    self.emit("connect");
  });
  this.channel = null;
};
Emitter.mixin(WS);

WS.prototype.push = function(args) {
  switch (args.length) {
    case 1:
      this.channel.push(args[0]);
      break;
    case 2:
      if (typeof args[1] === "function") {
        this.channel.push(args[0]).receive("ok", args[1]);
      } else {
        this.channel.push(args[0], args[1]);
      }
      break;
    case 3:
      this.channel.push(args[0], args[1]).receive("ok", args[2]);
      break;
    default:
      null;
  }
};
WS.prototype.join = function(room_id, cb) {
  var self = this;
  this.channel = this.socket.channel("room:" + room_id, {});
  this.channel.on("message", function(payload) {
    self.emit("message", payload);
  });
  // this.channel.on("remove", function(room) {
  //   self.emit("remove", room);
  // });

  // two events below are for presences update
  this.channel.on("presence_state", function(state) {
    console.log("got init state", state);
    self.presences = Presence.syncState(self.presences, state);
  });
  this.channel.on("presence_diff", function(diff) {
    console.log("got diff", diff);
    self.presences = Presence.syncDiff(self.presences, diff);
    var id;
    for (id in diff.leaves) {
      self.emit("remove", { id: id, type: null });
    }
  });
  //
  this.channel.on("turnservers", function(servers) {
    self.emit("turnservers", servers);
  });
  this.channel.on("stunservers", function(servers) {
    self.emit("stunservers", [servers]);
  });
  this.channel.join().receive("ok", function(resp) {
    cb(false, resp);
  });
};

function SocketIoConnection(config) {
  this.connection = new WS(config);
}

SocketIoConnection.prototype.on = function(ev, fn) {
  this.connection.on(ev, fn);
};

SocketIoConnection.prototype.serialize = function() {
  var payload = arguments[1];
  if (typeof payload === "object") {
    payload.event = arguments[0];
    return payload;
  } else {
    return { event: arguments[0], payload: payload };
  }
};

SocketIoConnection.prototype.emit = function() {
  if (arguments[0] === "join") {
    this.connection.join(arguments[1], arguments[2]);
  } else {
    this.connection.push(arguments);
  }
};

SocketIoConnection.prototype.leave = function() {
  this.connection.channel.leave();
};

SocketIoConnection.prototype.getSessionid = function() {
  this.connection.id;
};

SocketIoConnection.prototype.disconnect = function() {
  return this.connection.disconnect();
};

module.exports = SocketIoConnection;
