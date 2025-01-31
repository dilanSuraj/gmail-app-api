const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const { google } = require('googleapis');
const fs = require("fs");
const formidable = require('formidable');
const credentials = require('./credentials.json');
const utils = require('./utils');

const client_id = credentials.web.client_id;
const client_secret = credentials.web.client_secret;
const redirect_uris = credentials.web.redirect_uris;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const SCOPE = ['https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.readonly']

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => res.send(' API Running'));

app.get('/url', (req, res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPE,
    });
    return res.send(authUrl);
});

app.post('/token', (req, res) => {
    const code = req.body.code
    console.log(code)
    if (code == null) return res.status(400).send('Invalid Request');
    oAuth2Client.getToken(code, (err, token) => {
        if (err) {
            console.error('Error retrieving access token', err);
            return res.status(400).send('Error retrieving access token');
        }
        res.send(token);
    });
});

app.get('/user', (req, res) => {
    const token = JSON.parse(req.headers.token);
    if (token == null) return res.status(400).send('Token not found');
    oAuth2Client.setCredentials(token);
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });

    oauth2.userinfo.get((err, response) => {
        if (err) res.status(400).send(err);
        res.send(response.data);
    })
});

app.get('/mails', async (req, res) => {
    const token = JSON.parse(req.headers.token);
    if (token == null) return res.status(400).send('Token not found');
    oAuth2Client.setCredentials(token);
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const mails = await utils.findMessages(oAuth2Client);
    res.send(mails);
});

app.get('/files', (req, res) => {
    const token = JSON.parse(req.headers.token);
    if (token == null) return res.status(400).send('Token not found');
    oAuth2Client.setCredentials(token);
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    drive.files.list({
        pageSize: 10,
    }, (err, response) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return res.status(400).send(err);
        }
        const files = response.data.files;
        res.send(files);
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server Started ${PORT}`));