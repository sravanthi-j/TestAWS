
const { processSN } = require('./servicenow-api-helpers')

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    console.log('process projects')
    try {
        const result = await processSN()
    } catch (e) {
        console.error(e)
    }
    console.log(" done in index ")
};
