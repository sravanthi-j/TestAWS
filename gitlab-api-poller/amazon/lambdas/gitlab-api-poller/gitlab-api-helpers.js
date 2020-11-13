const { config } = require('./config')

const fetch = require('node-fetch');
const es = require('./es-helpers')

const gitlab_host = "https://gitlab.hilti.com/";

const ENV = process.env;

const headersApiV4 = {
    'PRIVATE-TOKEN': ENV.GITLAB_TOKEN
};

const headersGraphQL4 = {
    'Authorization': `Bearer ${ENV.GITLAB_TOKEN}`,
    'Content-Type': 'application/json'
};

const checkRespStatus = (res, resp_data) => {
    if (res.ok) { // res.status >= 200 && res.status < 300
        return res;
    } else {
        throw new Error(res.statusText);
    }
}

const GitLabAPIGet = async (path, json = true) => {
    // TODO: process pages -- 20 by default
    let url = `${gitlab_host}api/v4/${path}`
    let options = {
        'method': 'GET',
        'url': url,
        'headers': headersApiV4
    };
    try {
        const resp = await fetch(url, options)
        checkRespStatus(resp)
        if (json) {
            const resp_data = await resp.json()
            return resp_data
        } else {
            const resp_data = await resp.text()
            return resp_data.split(/\r\n|\n/)
        }
    } catch (e) {
        throw new Error(e)
    }
}

const GitLabGraphQLPOST = async (body) => {
    let url = `${gitlab_host}api/graphql`
    let options = {
        'method': 'POST',
        'url': url,
        'body': JSON.stringify(body),
        'headers': headersGraphQL4
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

const lastPipelineId = async (fullPath) => {
    const query = `
    {
        project(fullPath: "${fullPath}") {
          pipelines(first: 1) {
            nodes {
                id
            }
          }
        }
    }
    `
    const resp = await GitLabGraphQLPOST(
        {
            query
        }
    )
    return resp.data.project.pipelines.nodes[0].id.split('/').slice(-1)[0]
}

const PipelineJobs = async (projectId, pipelineId) => GitLabAPIGet(`projects/${projectId}/pipelines/${pipelineId}/jobs`)
const ProjectJobs = async (projectId) => GitLabAPIGet(`projects/${projectId}/jobs`)
const JobTrace = async (projectId, jobId) => GitLabAPIGet(`projects/${projectId}/jobs/${jobId}/trace`, false)
const ProjectsInGroup = async (groupId) => GitLabAPIGet(`/groups/${groupId}/projects?per_page=100`)

const FilterJobs = (project, jobs, lastJobId) => {
    const filtered_jobs = jobs.filter(job => {
        const inConfig = Object.keys(project.jobsToProcess).includes(job.name)
        if (inConfig & job.id > lastJobId) {
            return true
        } else {
            return false
        }

    })
    return filtered_jobs
}

const processGroup = async (groupConfig) => {
    let projects = await ProjectsInGroup(groupConfig.id)
    console.log(`projects in group ${projects.length}`)

    let allJobs = []

    for (const project of projects) {

        let jobs = await ProjectJobs(project.id)
        let filteredJobs = jobs.filter(job => {
            return new RegExp(groupConfig.jobsRegexp, 'g').test(job.name)
        })

        if (filteredJobs.length > 0) {
            for (let job of filteredJobs) {
                job.projectId = project.id
                job.projectName = project.name
            }
            allJobs = allJobs.concat(filteredJobs)
        }


 
    }
    allJobs.sort((a, b) => a.id - b.id)
    if (await es.indexExists(groupConfig)) {
        const lastJobId = await es.maxId(groupConfig)
        allJobs = allJobs.filter(job => {
            return job.id > lastJobId.value
        })
    }

    // console.log(allJobs)
    console.log(`new jobs to proceed ${allJobs.length}`)
    
    for (const job of allJobs) {
        const trace_log = await JobTrace(job.projectId, job.id)
        console.log(`trace collected for ${job.projectName} job ${job.id}`)
        const filtered_trace_log = trace_log.filter(line => {
            return new RegExp(groupConfig.traceRegexp, 'g').test(line)
        })
        if (filtered_trace_log.length>0){
            const index_body = {
                "project": job.projectName,
                "projectId": job.projectId,
                "pipilineId": job.pipeline.id,
                "job": {
                    "id": job.id,
                    "name": job.name,
                    "status": job.status,
                    "finished_at": job.finished_at,
                    "web_url": job.web_url,
                    "duration": job.duration,
                    "trace_log": filtered_trace_log,
                    "eventCount": filtered_trace_log.length
                }
            }
            // console.log(index_body)
            // console.log(groupConfig)
    
            const resp = await es.pushToES(groupConfig, index_body, job.id)
            // console.log(resp)
        } else {
            console.log("no events")
        }

    }


}

exports.processGroups = async () => {
    for (const groupConfig of config.groups) {
        await processGroup(groupConfig)
    }
}

exports.processGitlabData = async () => {
    for (const project of config.projects) {
        let jobs = await ProjectJobs(project.id)
        let lastJobId = 0
        if (await es.indexExists(project)){
            lastJobId = await es.maxId(project)
        } 
        
        jobs = FilterJobs(project, jobs, lastJobId)
        
        for (const job of jobs) {

            // TODO: use pipe and tranform
            const trace_log = await JobTrace(project.id, job.id)
            console.log("trace collected")
            const filtered_trace_log = trace_log.filter(line => {
                return new RegExp(project.jobsToProcess[job.name], 'g').test(line)
            })
            if (filtered_trace_log.length>0){
                const index_body = {
                    "project": project.fullPath,
                    "projectId": project.id,
                    // "pipilineId": pipilineId,
                    "job": {
                        "id": job.id,
                        "name": job.name,
                        "status": job.status,
                        "finished_at": job.finished_at,
                        "web_url": job.web_url,
                        "duration": job.duration,
                        "trace_log": filtered_trace_log,
                        "eventCount": filtered_trace_log.length
                    }
                }
                // console.log(index_body)
    
                const resp = await es.pushToES(project, index_body, job.id)
                // console.log(resp)
            } else {
                console.log("no events")
            }


        }
    }
}
