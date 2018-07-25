# SimpleWebRTC - World's easiest WebRTC lib


## 本地测试demo

```bash
npm install && npm run test-page
```

然后打开: http://0.0.0.0:8443/test/?room_id


### 基本使用方法

```html
<!DOCTYPE html>
<html>
    <head>
        <script src="https://simplewebrtc.com/latest-v2.js"></script>
        <style>
            #remoteVideos video {
                height: 150px;
            }
            #localVideo {
                height: 150px;
            }
        </style>
    </head>
    <body>
        <video id="localVideo"></video>  <! 放置本地video的容器>
        <div id="remoteVideos"></div> <! 放置所有远程加入的视频列表>
    </body>
</html>

```
### 2. 创建 SimpleWebRTC 的实例
```js
var webrtc = new SimpleWebRTC({
    // 指向 signal server 的地址
    url: "ws://0.0.0.0:4000/socket",
    //url: "wss://wss.oiwanzi.com/socket",  // 我们部署的signal server
    // id 指向html中的本地视频元素
    localVideoEl: 'localVideo',  
    // id 指向html中远程视频元素, 选填, 之后可以通过事件监听自定义行为
    remoteVideosEl: 'remoteVideos',
    // 是否直接获取本地权限, 默认关闭
    autoRequestMedia: true
});
```

### 3. 本地权限获取成功后触发事件 `readyToCall`
```js
// we have to wait until it's ready
webrtc.on('readyToCall', function () {
    // you can name it anything
    webrtc.joinRoom('your awesome room name', ‘user name’);
});
```

### 4. 远程加入房间后触发事件 `videoAdded`, 此时可以监听时间手动加入video

```js
webrtc.on('videoAdded', function (video, peer) {
    console.log('video added', peer);
    var remotes = document.getElementById('remotes');
    if (remotes) {
        var d = document.createElement('div');
        d.className = 'videoContainer';
        d.id = 'container_' + webrtc.getDomId(peer);
        d.appendChild(video);
        var vol = document.createElement('div');
        d.appendChild(vol);
        remotes.appendChild(d);
    }
});
```

### 5. 远程用户离开房间时会触发事件 `videoRemoved`, 此时可以监听事件从页面中删除对应的元素
```js
webrtc.on('videoRemoved', function (video, peer) {
    console.log('video removed ', peer);
    var remotes = document.getElementById('remotes');
    var el = document.getElementById('container_' + webrtc.getDomId(peer));
    if (remotes && el) {
        remotes.removeChild(el);
    }
});
```

### 6. 可以对本地视频进行的操作 (方法调用)

1. 关闭声音: `webrtc.mute()`
2. 开启声音: `webrtc.unmute()`
1. 开启视频: `webrtc.resumeVideo()`
1. 关闭视频: `webrtc.pauseVideo()`


### Available options


`peerConnectionConfig` - Set this to specify your own STUN and TURN servers. By
default, SimpleWebRTC uses Google's public STUN server
(`stun.l.google.com:19302`), which is intended for public use according to:
https://twitter.com/HenrikJoreteg/status/354105684591251456

Note that you will most likely also need to run your own TURN servers. See
http://www.html5rocks.com/en/tutorials/webrtc/infrastructure/ for a basic
tutorial.

## Filetransfer
Sending files between individual participants is supported. See
http://simplewebrtc.com/filetransfer.html for a demo.

Note that this is not file sharing between a group which requires a completely
different approach.

## It's not always that simple...

Sometimes you need to do more advanced stuff. See
http://simplewebrtc.com/notsosimple.html for some examples.

## Got questions?

Join the Gitter channel:

https://gitter.im/HenrikJoreteg/SimpleWebRTC

## API

### Constructor

`new SimpleWebRTC(options)`

- `object options` - options object provided to constructor consisting of:
  - `string url` - *required* url for signaling server. Defaults to signaling
  server URL which can be used for development. You must use your own signaling
  server for production.
  - `object socketio` - *optional* object to be passed as options to the signaling
  server connection.
  - `Connection connection` - *optional* connection object for signaling. See
  `Connection` below. Defaults to a new SocketIoConnection
  - `bool debug` - *optional* flag to set the instance to debug mode
  - `[string|DomElement] localVideoEl` - ID or Element to contain the local video
  element
  - `[string|DomElement] remoteVideosEl` - ID or Element to contain the
  remote video elements
  - `bool autoRequestMedia` - *optional(=false)* option to automatically request
  user media. Use `true` to request automatically, or `false` to request media
  later with `startLocalVideo`
  - `bool enableDataChannels` *optional(=true)* option to enable/disable data
  channels (used for volume levels or direct messaging)
  - `bool autoRemoveVideos` - *optional(=true)* option to automatically remove
  video elements when streams are stopped.
  - `bool adjustPeerVolume` - *optional(=false)* option to reduce peer volume
  when the local participant is speaking
  - `number peerVolumeWhenSpeaking` - *optional(=.0.25)* value used in
  conjunction with `adjustPeerVolume`. Uses values between 0 and 1.
  - `object media` - media options to be passed to `getUserMedia`. Defaults to
  `{ video: true, audio: true }`. Valid configurations described
  [on MDN](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
  with official spec
  [at w3c](http://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia).
  - `object receiveMedia` - *optional* RTCPeerConnection options. Defaults to
  `{ offerToReceiveAudio: 1, offerToReceiveVideo: 1 }`.
  - `object localVideo` - *optional* options for attaching the local video
  stream to the page. Defaults to
  ```javascript
  {
      autoplay: true, // automatically play the video stream on the page
      mirror: true, // flip the local video to mirror mode (for UX)
      muted: true // mute local video stream to prevent echo
  }
  ```
  - `object logger` - *optional* alternate logger for the instance; any object
  that implements `log`, `warn`, and `error` methods.

### Fields

`capabilities` - the
[`webrtcSupport`](https://github.com/HenrikJoreteg/webrtcsupport) object that
describes browser capabilities, for convenience

`config` - the configuration options extended from options passed to the
constructor

`connection` - the socket (or alternate) signaling connection

`webrtc` - the underlying WebRTC session manager

### Events

To set up event listeners, use the SimpleWebRTC instance created with the
constructor. Example:

```javascript
var webrtc = new SimpleWebRTC(options);
webrtc.on('connectionReady', function (sessionId) {
    // ...
})
```

`'connectionReady', sessionId` - emitted when the signaling connection emits the
`connect` event, with the unique id for the session.

`'createdPeer', peer` - emitted three times:

- when joining a room with existing peers, once for each peer
- when a new peer joins a joined room
- when sharing screen, once for each peer

- `peer` - the object representing the peer and underlying peer connection

`'stunservers', [...args]` - emitted when the signaling connection emits the
same event

`'turnservers', [...args]` - emitted when the signaling connection emits the
same event

`'localScreenAdded', el` - emitted after triggering the start of screen sharing

- `el` the element that contains the local screen stream

`'leftRoom', roomName` - emitted after successfully leaving the current room,
ending all peers, and stopping the local screen stream

`'videoAdded', videoEl, peer` - emitted when a peer stream is added

- `videoEl` - the video element associated with the stream that was added
- `peer` - the peer associated with the stream that was added

`'videoRemoved', videoEl, peer` - emitted when a peer stream is removed

- `videoEl` - the video element associated with the stream that was removed
- `peer` - the peer associated with the stream that was removed

### Methods

`createRoom(name, callback)` - emits the `create` event on the connection with
`name` and (if provided) invokes `callback` on response

`joinRoom(name, callback)` - joins the conference in room `name`. Callback is
invoked with `callback(err, roomDescription)` where `roomDescription` is yielded
by the connection on the `join` event. See [signalmaster](https://github.com/andyet/signalmaster) for more details.

`startLocalVideo()` - starts the local media with the `media` options provided
in the config passed to the constructor

`testReadiness()` - tests that the connection is ready and that (if media is
enabled) streams have started

`mute()` - mutes the local audio stream for all peers (pauses sending audio)

`unmute()` - unmutes local audio stream for all peers (resumes sending audio)

`pauseVideo()` - pauses sending video to peers

`resumeVideo()` - resumes sending video to all peers

`pause()` - pauses sending audio and video to all peers

`resume()` - resumes sending audio and video to all peers

`sendToAll(messageType, payload)` - broadcasts a message to all peers in the
room via the signaling channel (websocket)

- `string messageType` - the key for the type of message being sent
- `object payload` - an arbitrary value or object to send to peers

`sendDirectlyToAll(channelLabel, messageType, payload)` - broadcasts a message
to all peers in the room via a dataChannel

- `string channelLabel` - the label for the dataChannel to send on
- `string messageType` - the key for the type of message being sent
- `object payload` - an arbitrary value or object to send to peers

`getPeers(sessionId, type)` - returns all peers by `sessionId` and/or `type`

`shareScreen(callback)` - initiates screen capture request to browser, then
adds the stream to the conference

`getLocalScreen()` - returns the local screen stream

`stopScreenShare()` - stops the screen share stream and removes it from the room

`stopLocalVideo()` - stops all local media streams

`setVolumeForAll(volume)` - used to set the volume level for all peers

- `volume` - the volume level, between 0 and 1

`leaveRoom()` - leaves the currently joined room and stops local screen share

`disconnect()` - calls `disconnect` on the signaling connection and deletes it

`handlePeerStreamAdded(peer)` - used internally to attach media stream to the
DOM and perform other setup

`handlePeerStreamRemoved(peer)` - used internally to remove the video container
from the DOM and emit `videoRemoved`

`getDomId(peer)` - used internally to get the DOM id associated with a peer

`getEl(idOrEl)` - helper used internally to get an element where `idOrEl` is
either an element, or an id of an element

`getLocalVideoContainer()` - used internally to get the container that will hold
the local video element

`getRemoteVideoContainer()` - used internally to get the container that holds
the remote video elements

### Connection

By default, SimpleWebRTC uses a [socket.io](http://socket.io/) connection to
communicate with the signaling server. However, you can provide an alternate
connection object to use. All that your alternate connection need provide are
four methods:

- `on(ev, fn)` - A method to invoke `fn` when event `ev` is triggered
- `emit()` - A method to send/emit arbitrary arguments on the connection
- `getSessionId()` - A method to get a unique session Id for the connection
- `disconnect()` - A method to disconnect the connection
