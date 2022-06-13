const path = require('path');
let env = process.env.NODE_ENV || 'development';
const envPath = path.join(__dirname, '..');
console.log('envPath', envPath);
require('dotenv').config({ path: `${envPath}/.env` });
const cors = require('cors');
console.log('Node Running Environement:', env);
const express = require('express');
const bodyParser = require('body-parser');
const app = express(); // create express app
const opentok = require('./opentok/opentok');
const sessionMonitoring = require('./opentok/session-monitoring');
app.use(cors());
app.use(bodyParser.json());

const sessions = {};
/**
   * renderRoom is used to render the ejs template
   * @param {Object} res
   * @param {String} sessionId
   * @param {String} token
   * @param {String} roomName
*/

const renderRoom = (res, apiKey, sessionId, token, roomName) => {
    res.render('index.ejs', {
        apiKey,
        sessionId,
        token,
        roomName,
    });
};

const setSessionDataAndRenderRoom = async (res, roomName) => {

    const data = await opentok.getCredentials();
    sessions[roomName] = { sessionId: data.sessionId, connections: [] };
    sessions[data.sessionId] = roomName;
    renderRoom(res, data.apiKey, data.sessionId, data.token, roomName);
};

app.get('/room/:room', (req, res) => {
    const roomName = req.params.room;
    if (sessions[roomName]) {
        const sessionId = sessions[roomName].sessionId;
        const dataToken = opentok.generateToken(sessionId);
        renderRoom(res, dataToken.apiKey, sessionId, dataToken.token, roomName);
    } else {
        setSessionDataAndRenderRoom(res, roomName);
    }
});

// Show how to use TOKEN DATA // todo the data field sometimes is '', sometimes null
// Show how to save the active connections
// show how to add a timer to a session
// should I add a client folder?

app.post('/session-monitoring', async (req, res) => {
    try {

        
        const { sessionId, projectId, event, timestamp, connection } = req.body;
        const roomName = sessions[sessionId];
        switch (event) {
            case "connectionCreated":
                sessionMonitoring.handleConnectionCreated(roomName, sessions[roomName], opentok, { sessionId, event, timestamp, connection })
                break;
            case "connectionDestroyed":
                sessionMonitoring.handleConnectionDestroyed(roomName, sessions[roomName], opentok, { sessionId, event, timestamp, connection })
                break;
            case "streamCreated":
                break;
            case "streamDestroyed":
                break;
            default:
                console.warn("Not handled case, this should not happen");
        }

        console.log("session-monitoring", sessions);
        res.status(200).send();
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: error.message });
    }
});





const serverPort = process.env.SERVER_PORT || process.env.PORT || 5000;
// start express server on port 5000
app.listen(serverPort, () => {
    console.log('server started on port', serverPort);
});