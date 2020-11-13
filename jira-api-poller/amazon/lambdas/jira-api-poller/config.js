module.exports.config = {
    // TODO: maybe better to use the board as a starting point ... but not sure
    "projects": [
        {
            "key": "DM",
            "name": "DocuManager Mobile",
            "es_index_name": "jira-dm-main"
        },
        {
            "key": "PE",
            "name": "Project Everything",
            "es_index_name": "jira-pe-main"
        },
        {
            "key": "BO",
            "name": "Blue Oyster",
            "es_index_name": "jira-bo-main"
        },
        {
            "key": "BUDQBP",
            "name": "PROFIS Engineering",
            "es_index_name": "jira-budqbp-main"
        }
    ],
    "jql_for_projects": {
        "BugsInOpenSprint": (projectKey) => (`project = ${projectKey} and type = bug AND priority in (Major, Blocker, Critical) AND resolution in ( Deferred, Unresolved, Fixed, Done) AND sprint in openSprints()`),
        "BugsTotal": (projectKey) => (`project = ${projectKey} and type = bug AND priority in (Major, Blocker, Critical) AND resolution in ( Deferred, Unresolved, Fixed, Done)`),
        "UserStorysInOpenSprint": (projectKey) => (`project = ${projectKey} AND issuetype in (Story, "User story", Bug) AND issuetype in ("User story", story) AND resolution in (Deferred, resolved, Unresolved, Fixed, Done) AND "Epic Link" is EMPTY AND sprint in openSprints()`)
    }
}
