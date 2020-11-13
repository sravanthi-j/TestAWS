
const { processJiraData } = require('./jira-api-helpers')

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    try {
        const result = await processJiraData()
    } catch (e) {
        console.error(e)
    }

    console.log(" done in index ")
};
