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
  this.presences = {};
  this.socket.onOpen(function() {
    self.emit("connect");
  });
  this.channel = null;
};
Emitter.mixin(WS);

WS.prototype.onJoin = function(key, currentPresence, newPresence) {
  if (!currentPresence) {
    console.log("user enter for the first time", newPresence);
    this.emit("joined", key, newPresence);
  } else {
    console.log("user updating additional info", newPresence);
  }
};

WS.prototype.onLeave = function(key, currentPresence, leftPresence) {
  if (currentPresence.metas.length === 0) {
    console.log("user has left from all devices", leftPresence);
    this.emit("left", key, leftPresence);
    this.emit("remove", { id: key, type: null });
  } else {
    console.log("user left from a device", leftPresence);
  }
};

WS.prototype.listBy = function(id, state) {
  if (!state.metas) return;
  var first = state.metas[0];
  first.id = id;
  return first;
};

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
WS.prototype.join = function(room_id, user_name, cb) {
  var self = this;
  this.channel = this.socket.channel("room:" + room_id, {
    user_name: user_name
  });
  this.channel.on("message", function(payload) {
    self.emit("message", payload);
  });

  this.channel.on("quick_message", function(payload) {
    self.emit("quick_message", payload);
  });

  // two events below are for presences update
  this.channel.on("presence_state", function(state) {
    console.log("got init state", state);
    self.presences = Presence.syncState(self.presences, state);
  });
  this.channel.on("presence_diff", function(diff) {
    self.presences = Presence.syncDiff(
      self.presences,
      diff,
      self.onJoin.bind(self),
      self.onLeave.bind(self)
    );
    self.emit("updateRoomInfo", Presence.list(self.presences, self.listBy));
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
    this.connection.join(arguments[1], arguments[2], arguments[3]);
  } else {
    this.connection.push(arguments);
  }
};

SocketIoConnection.prototype.leave = function() {
  this.connection.channel.leave();
};

SocketIoConnection.prototype.getSessionid = function() {
  return this.connection.id;
};

SocketIoConnection.prototype.disconnect = function() {
  return this.connection.socket.disconnect();
};

module.exports = SocketIoConnection;
