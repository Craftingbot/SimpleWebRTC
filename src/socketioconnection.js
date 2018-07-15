// var io = require("socket.io-client");
// var WebSocket = require("ws")
var Emitter = require("wildemitter");

function WS(config) {
  this.session = new WebSocket(config.url);
  var self = this
  this.id = null
  this.heartbeat = null

  this.session.onopen = function(event) {
    self.emit('connect', arguments)
    if (!self.heartbeat) {
      self.heartbeat = setInterval(self.ping.bind(self), 30000)
    }
  }
  this.session.onmessage = function(event) {
    event = self.deserialize(event)
    var name = event["event"]
    var error = event["error"]
    delete event["event"]
    if (name === "connected") {
      self.id = event.id
    }
    if (name === "join") {
      if (!!error) {
        delete event["error"]
        self.emit(name, error, event)
      } else {
        self.emit(name, false, event)
      }
    } else {
      self.emit(name, event)
    }
      
  }
}
Emitter.mixin(WS);
WS.prototype.send = function(msg){
  this.session.send(msg)
}

WS.prototype.ping = function() {
  this.session.send(JSON.stringify({event: "ping"}))
}

WS.prototype.deserialize = function(msg) {
  return JSON.parse(msg.data)
}

WS.prototype.disconnect = function(msg) {
  this.session.close()
  if (this.heartbeat) {
    clearInterval(this.heartbeat)
  }
  this.heartbeat = null
  this.id = null
}

function SocketIoConnection(config) {
  this.connection = new WS(config);
}

SocketIoConnection.prototype.on = function(ev, fn) {
  this.connection.on(ev, fn);
};

SocketIoConnection.prototype.serialize = function() {
  var payload = arguments[1]
  if (typeof payload === "object") {
    payload["event"] = arguments[0]
    return payload
  } else {
    return { event: arguments[0], payload: payload }
  }
}


SocketIoConnection.prototype.emit = function() {
  var msg = {};
  switch (arguments.length) {
    case 1:
      msg = {event: arguments[0]}
      break;
    case 2:
      if (typeof arguments[1] === "function") {
        msg = this.serialize(arguments[0], "")
        this.connection.on(arguments[0], arguments[1])
      } else {
        msg = this.serialize(arguments[0], arguments[1])
      }
      break;
    case 3:
      msg = this.serialize(arguments[0], arguments[1])
      this.connection.on(arguments[0], arguments[2])
    default:
      break;
  }
  console.log(JSON.stringify(msg))
  this.connection.send(JSON.stringify(msg))
};

SocketIoConnection.prototype.getSessionid = function() {
  return this.connection.id;
};

SocketIoConnection.prototype.disconnect = function() {
  return this.connection.disconnect();
};

module.exports = SocketIoConnection;
