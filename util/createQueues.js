var azure = require('azure');
var connStr = process.argv[2];
if (!connStr) throw new Error('Must provide connection string to queue');

var queueName = process.argv[3];
if (!queueName) throw new Error('Must provide queue name');

var serviceBus = azure.createServiceBusService(connStr);
serviceBus.createQueueIfNotExists(queueName, function(error){
    if(!error){
        console.log("Created queue " + queueName);
    } else {
        console.log(error);
    }
});