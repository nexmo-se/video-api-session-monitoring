# Video API Session Monitoring

This application shows how to use the Session Monitoring webhooks for two main use cases:

1. Limit the duration of a video session to a certain threshold
2. Limit the size of a video session to 2 users

## Prerequisites

- [Node.js v14.11.0+](https://nodejs.org/en/)
- [Vonage Video API Account](https://tokbox.com/account)

## Installation

1. Run `npm install` to install all dependencies from NPM.
2. Copy the `env.example` file to `.env` and fill the variables needed

For local development, you can run `npm run dev` to run the server.

## Limited Time Room

If you navigate to `locahost:5000/room/limited-time-room`, the server will start a timer when there are at least 2 connections (2 users). You can configure the duration in the `.env` file under the `LIMITED_TIME_ROOM_MINUTES` variable. The timer will check every 5 seconds the time remaining for the session. When the time has expired, the server will force disconnect the users from the session using the [forceDisconnect](https://tokbox.com/developer/rest/#forceDisconnect) function.

The code is the following: 

```js
if (session.connections && session.connections.length > 1) {
    // There are at least 2 users
    session.interval = setInterval(() => {
        if (session.interval && (session.connections && session.connections.length < 2)) {
            // Connections are less than 2
            clearInterval(session.interval)
        }
        const now = new Date().getTime();
        console.log("Session Interval Started: ", session.connections);
        console.log("Time Elapsed (Seconds):", Math.round((now - session.connections[0].timestamp)) / 1000);
        session.connections.sort((x, y) => { return y.timestamp - x.timestamp }) // Make sure they are ordered by latest connections;
        if ((now - session.connections[0].timestamp) > limitedTimeRoomMinutes * 60 * 1000) { 
            // time has expired, let's disconnect them
            for (let i = 0; i < session.connections.length; i += 1) {
                opentok.forceDisconnect(sessionId, session.connections[i].connection.id);
            }
            clearInterval(session.interval)
        }
    }, roomInterval.intervalValue)
}

```

## One to One Room

If you navigate to `locahost:5000/room/one-to-one`, the server will allow only two users (connections) connected to the room. If there is a third connection, the server will immediately disconnect it. See the code below: 

```js
if (roomName === 'one-to-one') {
    if (session.connections && session.connections.length > 2) {
        opentok.forceDisconnect(sessionId, connection.id);
    }
}

```

