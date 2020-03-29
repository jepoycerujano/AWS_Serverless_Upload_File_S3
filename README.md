# aws-serverles-crud

### What is this repository for? ###

* this is to performed basic CRUD functions

### How do I get set up? ###

* Setting up the Serverless function (for DEV stages only)
```bash
# NOTE: Always run the serverless function first
# one-time setup
npm install -g serverless # optional in case you have it already
npm install
sls dynamodb install
# run the service in your local
npm run startwin
```
open Postman, import myPostman.json and Run