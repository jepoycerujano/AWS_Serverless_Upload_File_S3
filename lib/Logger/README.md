# Logger
- library for SEAOIL Meteor Projects

### Installation
1. Run the following to add required packages
```
  npm install winston moment
```

2. Add the following in main.js of server/client. This will create a global variable "Logger"
```
  const Logger = require('./lib/Logger');
```

3. Add logs to your code. Here are a few examples.
```
  Logger.info('Hello World!');
  Logger.debug(myVariable);
```

### Log Level Guide
* Have a mindset that when the application is running in production, there is a way for the sysadmin to generate the logs for you.
* Every project has its own needs, use these guide as needed

  - **error** - Encountered an error and cannot continue to process
  - **warn** - If the application encountered an error but can recover from it, or any security issues found
  - **info** - About the general process the application is performing or output of a process, i.e. Providing an access to user
  - **verbose** - About sub-processes, i.e. Validating User, Saving to database, etc.
  - **debug** - Display the variable information, i.e. userInfo, isConnected, etc.
  - **silly** - If debug is not enough.


### Reference
* https://www.npmjs.com/package/winston
