const roomInterval = {
    intervalValue: 5000
}

const limitedTimeRoomMinutes = process.env.LIMITED_TIME_ROOM_MINUTES || 1;

const handleConnectionCreated = (roomName, session, opentok, { sessionId, event, timestamp, connection }) => {
    console.log("[handleConnectionCreated] - 1", roomName, session, timestamp, connection);
    session.connections = [...session.connections, { connection, timestamp }];
    if (roomName === 'limited-time-room') {
        // TODO { sessionId: data.sessionId, connections: {} }
        // When 2 users are connected, set a 5 minutes timer
        console.log("[handleConnectionCreated] - 2", session.connections);
        if (session.connections && session.connections.length > 1) {
            // There are at least 2 users

            session.interval = setInterval(() => {
                // TODO remember to executed immediately
                // TODO for simplicity we are not gonna pause and resume interval if one user disconnects - mention this on the blog post
                if (session.interval && (session.connections && session.connections.length < 2)) {
                    // Connections are less than 2
                    clearInterval(session.interval)
                }
                const now = new Date().getTime();
                console.log("Session Interval Started: ", session.connections);
                console.log("Time Elapsed (Seconds):", Math.round((now - session.connections[0].timestamp)) / 1000);
                session.connections.sort((x, y) => { return y.timestamp - x.timestamp }) // Make sure they are ordered by latest connections;
                if ((now - session.connections[0].timestamp) > limitedTimeRoomMinutes * 60 * 1000) { // todo 5 minutes edit
                    // time has expired, let's disconnect them
                    for (let i = 0; i < session.connections.length; i += 1) {
                        opentok.forceDisconnect(sessionId, session.connections[i].connection.id);
                    }
                    clearInterval(session.interval)
                }
            }, roomInterval.intervalValue)
        }

    } else if (roomName === 'one-to-one') {
        // todo kick out people if there is a third connection
        // mention on the post to count connections and not streams
        // OR even check the token data and if the users are not authorised to see the video, kick them out
        // something like: user-teacher let him in, user-hacker no
        // session.connections = [...sessionStorage.connections, { connection, timestamp }];
        if (session.connections && session.connections.length > 2) {
            opentok.forceDisconnect(sessionId, connection.id);
        }
    }
}

const handleConnectionDestroyed = (roomName, session, opentok, { sessionId, event, timestamp, connection }) => {
    console.log("[handleConnectionDestroyed]", roomName, session, timestamp, connection)
    if (session && session.connections) {
        for (let i = 0; i < session.connections.length; i += 1) {
            if (session.connections[i].connection.id === connection.id) {
                session.connections.splice(i, 1);
                break;
            }
        }
    }
}

module.exports = {
    handleConnectionCreated,
    handleConnectionDestroyed
};