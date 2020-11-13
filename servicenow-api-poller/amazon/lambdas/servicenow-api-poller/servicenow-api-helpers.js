// const { config } = require('./config')

const fetch = require('node-fetch');
const es = require('./es-helpers')

const servicenow_host = "https://hiltinadev.service-now.com/";

const ENV = process.env;

const headers = {
    'Authorization': `Basic ${Buffer.from(ENV.SN_CREDS_USER_NAME + ":" + ENV.SN_CREDS_PASSWORD).toString('base64')}`,
}

const timeStrToIntMin = (timeStr) => {
    let tarray = timeStr.split(":");
    var seconds = (parseInt(tarray[0], 10) * 60 * 60) + (parseInt(tarray[1], 10) * 60) + parseInt(tarray[2], 10)
    return Math.trunc(seconds/60)
}

const checkRespStatus = (res, resp_data) => {
    if (res.ok) { // res.status >= 200 && res.status < 300
        return res;
    } else {
        throw new Error(res.statusText);
    }
}

const SNAPIGet = async (path, json = true) => {
    // TODO: process pages -- 20 by default
    let url = `${servicenow_host}api/now/${path}`
    let options = {
        'method': 'GET',
        'url': url,
        'headers': headers
    };
    try {
        const resp = await fetch(url, options)
        checkRespStatus(resp)
        if (json) {
            const resp_data = await resp.json()
            return parseInt(resp_data.result.stats.count)
        } else {
            const resp_data = await resp.text()
            return resp_data.split(/\r\n|\n/)
        }
    } catch (e) {
        throw new Error(e)
    }
}

const snAPIGetAgregate = async (path, json = true) => {
    // TODO: process pages -- 20 by default
    let url = `${servicenow_host}api/now/${path}`
    let options = {
        'method': 'GET',
        'url': url,
        'headers': headers
    };
    try {
        const resp = await fetch(url, options)
        checkRespStatus(resp)
        if (json) {
            const resp_data = await resp.json()
            return resp_data.result
        } else {
            const resp_data = await resp.text()
            return resp_data.split(/\r\n|\n/)
        }
    } catch (e) {
        throw new Error(e)
    }
}

// const getCustomerserviceCase = async () => SNAPIGet(`table/sn_customerservice_case?sysparm_limit=5&sysparm_offset=0&sysparm_query=active=true^ORDERBYDESC sys_created_on`)
const countCustomerserviceCases = async () => SNAPIGet(`stats/sn_customerservice_case?sysparm_query=impact=3^urgency=3^priority=6^state=6^contact_type=web^active=true&sysparm_count=true`)
// stats/sn_customerservice_case?sysparm_query=state=3^active=true&sysparm_count=true
const countReceivedCases = async (state=1) => SNAPIGet(`stats/sn_customerservice_case?sysparm_query=state=${state}^active=true&sysparm_count=true`)
const countInProgressCases = async (state=10) => SNAPIGet(`stats/sn_customerservice_case?sysparm_query=state=${state}^active=true&sysparm_count=true`)
const countAwaitingInfoCases = async (state=18) => SNAPIGet(`stats/sn_customerservice_case?sysparm_query=state=${state}^active=true&sysparm_count=true`)
const countInReviewCases = async (state=6) => SNAPIGet(`stats/sn_customerservice_case?sysparm_query=state=${state}^active=true&sysparm_count=true`)
const countCompletedCases = async (state=3) => SNAPIGet(`stats/sn_customerservice_case?sysparm_query=state=${state}^active=true&sysparm_count=true`)
const countChildCaseNoActionNeededCases = async (state=99) => SNAPIGet(`stats/sn_customerservice_case?sysparm_query=state=${state}^active=true&sysparm_count=true`)
// 
const getAgregateVal = async (state, fun, field, fromDateTime="1970-01-01 00:01:49") => snAPIGetAgregate(`stats/sn_customerservice_case?sysparm_query=sys_created_on>${fromDateTime}^state=${state}^active=true&sysparm_${fun}_fields=${field}`)

const avgTimeWorkedInReview = async () => {
    const resp = await getAgregateVal(6, 'avg', 'time_worked')
    return timeStrToIntMin(resp.stats.avg.time_worked)
}

const avgTimeWorkedInReviewLastXd = async (days) => {
    let d = new Date();
    d.setDate(d.getDate()-days);
    const resp = await getAgregateVal(6, 'avg', 'time_worked', `${d.toISOString().slice(0,10)} ${d.toISOString().slice(11,20)}`)
    return timeStrToIntMin(resp.stats.avg.time_worked)
}

const maxTimeWorkedInReview = async () => {
    const resp = await getAgregateVal(6, 'max', 'time_worked')
    return timeStrToIntMin(resp.stats.max.time_worked)
}

const maxTimeWorkedInReviewLastXd = async (days) => {
    let d = new Date();
    d.setDate(d.getDate()-days);
    const resp = await getAgregateVal(6, 'max', 'time_worked', `${d.toISOString().slice(0,10)} ${d.toISOString().slice(11,20)}`)
    return timeStrToIntMin(resp.stats.max.time_worked)
}

exports.processSN = async () => {
    let indexBody = {
        "timestamp": new Date(),
        "state": {
            "Received": await countReceivedCases(),
            "InProgress": await countInProgressCases(),
            "AwaitingInfo": await countAwaitingInfoCases(),
            "InReview": await countInReviewCases(),
            "Completed": await countCompletedCases(),
            "Child": await countChildCaseNoActionNeededCases()
        },
        "avgTimeWorkedStateInReview": await avgTimeWorkedInReview(),
        "maxTimeWorkedStateInReview": await maxTimeWorkedInReview(),
        "avgTimeWorkedStateInReviewLast30d": await avgTimeWorkedInReviewLastXd(30),
        "maxTimeWorkedStateInReviewLast30d": await maxTimeWorkedInReviewLastXd(30),
    }
    // const countCases = await countCustomerserviceCases()
    console.log(indexBody)
    await es.pushToES("servicenow-timebased-4", indexBody)
    // const snCases = await getCustomerserviceCase()
    // for (const snCase of snCases){
    //     console.log(Object.keys(snCase))
    // }
    
}


