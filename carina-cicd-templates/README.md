# Deployment Templates for the Carina Project
This project holds templates for projects migrated to gitlab.  

## How to use

Include the following in your CICD definition.  It should replace the existing includes. 
    
    ```yml
    include:
      - project: project-carina/pipeline/carina-cicd-templates
        ref: master
        file: service-all.yml
    ```



## Changes from the existing CICD pipelines
The list below describes the changes implemented when compared to the CICD pipelines previously used.
- Push will only run on branches where Deploy is enabled.
- Deploy and push does not show for any merge request.
- Report collection now works for tests.  Place JUnit-formatted output into /reports.
- All deployments used by HCP are included with a single reference.
- ```truth``` is considered the default branch.
- No auto deployment by branch is configured. 
- Carina project name is set by default

## TODOs
- Link push and deploy:  Should require push to x before deploy to x.
- Further restrictions on Q, Stage environments to match Prod restrictions
- Environment gates:  Must push to Q before S, etc.  
- Run nondestructive tests after deployment
- Parent deployment file runs all service deployments
