
const { processGitlabData, processGroups } = require('./gitlab-api-helpers')

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('process projects')
    try {
        const result = await processGitlabData()
    } catch (e) {
        console.error(e)
    }
    console.log('process groups')
    try {
        const result = await processGroups()
    } catch (e) {
        console.error(e)
    }
    console.log(" done in index ")
};
