# jira-api-poller

## Jira REST API queries 

 We have [config.js](./config.js) file. In this file stored projects list and JQL queries list. 

 All JQL will be executed for all projects and result will be added to the jura-<project key>-main index. This is the first way to add a field.


The second way.

 For adding something more complicated we add logic directly to the [jira-api-helpers.js](./jira-api-helpers.js). There we need to add function like projectId or BugsTotal and map this function to the field in the "body" object in renderMainIndexBody function.