const fetch = require('node-fetch');
const { pushToES, indexExists } = require('./es-helpers')
const { config } = require('./config')

const ENV = process.env;
const JIRA_Auth = [ENV.JIRA_Auth || 'Basic'].join('');
const JIRA_Cookie = [ENV.JIRA_Cookie || 'JSESSIONID='].join('');
const jira_host = "https://jira.hilti.com";
const jira_api_search = "/rest/api/2/search";
const headers = {
    'Authorization': JIRA_Auth,
    'Cookie': JIRA_Cookie
  };

const checkRespStatus = (res, resp_data) => {
    if (res.ok) { // res.status >= 200 && res.status < 300
        return res;
    } else {
        throw new Error(res.statusText);
    }
}

const JiraAPIGet = async (path) => {
    let url = `${jira_host}${path}`
    let options = {
        'method': 'GET',
        'url': url,
        'headers': headers
    };
    try {
        const resp = await fetch(url, options)
        checkRespStatus(resp)
        const resp_data = await resp.json()
        return resp_data
    } catch (e) {
        throw new Error(e)
    }
}

const JiraAPIGetJQL = async (jql, maxResults = 0) => JiraAPIGet(`${jira_api_search}?maxResults=${maxResults}&jql=${jql}`)

const projectId = async (projectKey) => {
    const resp = await JiraAPIGet(`/rest/api/2/project/${projectKey}`)
    return parseInt(resp.id)
}


// example function that can be used for creating comlex reqests to the JIRA API
// const BugsTotal = async (project) => {
//     let jql = ['project = "', project, '" and type = bug AND priority in (Major, Blocker, Critical) AND resolution in ( Deferred, Unresolved, Fixed, Done)'].join('')
//     try {
//         const resp_data = await JiraAPIGetJQL(jql, 0)
//         return resp_data.total
//     } catch (e) {
//         console.error(e)
//     }
// }


// this is for rendering body of the es index
const renderMainIndexBody = async (project, jqls) => {
    // create core of index body and get complex data
    // Elasticsearch will automatically create the index, infer a mapping from the first document it sees and string properties will be mapped as analyzed string fields using the standard analyzer
    // You will need to delete the index and recreate, in order to change the mapping (new str field etc)
    
    let body = {
        "projectName": project.name,
        "timestamp": new Date(),
        "projectId": await projectId(project.key)
        // "BugsTotal": await BugsTotal(project.key)  complex logic example
        // TODO: 
        // Story in sprint
        // CurentSprint 
        // Story point actual
        // Story point planned
        // Team from the config?
    }
    // add all results for simple jql reqests from config.js
    for (const jqlKey of Object.keys(jqls)) {
        let jql = jqls[jqlKey](project.key)
        let resp = await JiraAPIGetJQL(jql, 0)
        body[jqlKey] = resp.total
    }
    console.log(body)
    return body
}

exports.processJiraData = async () => {
    for (const project of config.projects) {
        const resp = await indexExists(project)
        console.log(`index exists ${resp}`)    
      try {
        const index_body = await renderMainIndexBody(project, config.jql_for_projects)
        const result = await pushToES(project, index_body)
      } catch (e) {
        console.log(e)
      }
    }
  }