const { google } = require('googleapis');

const findMessages = async (auth) => {
    var gmail = google.gmail('v1');
    var messages = []
    return await gmail.users.messages.list({
        auth: auth,
        userId: 'me',
        maxResults: 10,
        q: ""
    }).then( async (response) => {
        for (const message of response.data.messages) {
            await gmail.users.messages.get({
                auth: auth,
                userId: 'me',
                id: message.id
            }).then(async (mailData) => {
                let mail_data = {
                    id: mailData.data.id,
                    labelIds: mailData.data.labelIds,
                    snippet: mailData.data.snippet
                }
                return await messages.push(mail_data)
            })
        }
        return messages;
    })
}

module.exports = {
    findMessages
}
