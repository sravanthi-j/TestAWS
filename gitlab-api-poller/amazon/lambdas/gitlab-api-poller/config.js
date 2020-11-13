exports.config = {
    "projects": [
        {
            "id": 405,
            "fullPath": "project-carina/platform-logging-and-monitoring/jira-api-poller",
            "es_index_name": "gitlab-jobs-jira-api-poller",
            "jobsToProcess": {
                "test:lambda:jira-api-poller": "\\[Warning\\]|Error:",
                "build:lambda:gitlab-api-poller": "\\[Warning\\]"
            }
        },
        {
            "id": 420,
            "fullPath": "project-carina/platform-logging-and-monitoring/gitlab-api-poller",
            "es_index_name": "gitlab-jobs-gitlab-api-poller",
            "jobsToProcess": {
                "test:lambda:gitlab-api-poller": "\\[Warning\\]|Error:",
                "build:lambda:gitlab-api-poller": "\\[Warning\\]"
            }
        },
        {
            "id": 386,
            "fullPath": "infra/terraform-project-logging",
            "es_index_name": "gitlab-jobs-terraform-project-logging",
            "jobsToProcess": {
                "terraform:apply:dev-temp": "\\[WARN\\]"
            }
        }
    ],
    "groups": [
        {
            "id": 13,
            "name": "project-carina",
            "es_index_name": `gitlab-jobs-carina-group-13`,
            "jobsRegexp": "build",
            "traceRegexp": "\\[Warning\\]"
        },
        {
            "id": 220,
            "name": "platform-logging-and-monitoring",
            "es_index_name": `gitlab-jobs-platform-logging-and-monitoring`,
            "jobsRegexp": "build",
            "traceRegexp": "\\[Warning\\]"
        }
    ]
}