console.log('listener job started');
var azure = require('azure');
var azureStorage = require('azure-storage');
var parseString = require('xml2js').parseString;

var connStr = process.env.CONNECTION_STRING;
if (!connStr) throw new Error('Must provide connection string to queue');

var queueName = process.env.APPSETTING_queue;
if (!queueName) throw new Error('Must provide queue name');

var serviceBus = azure.createServiceBusService(connStr);
listenForMessages(serviceBus);

// Uses env variables AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_ACCESS_KEY, or AZURE_STORAGE_CONNECTION_STRING for information
var tableSvc = azureStorage.createTableService();

function listenForMessages(serviceBus)
{
    var start = process.hrtime();
    var timeOut = 60*60*24; //long poll for 1 day
    serviceBus.receiveQueueMessage(queueName, {timeoutIntervalInS: timeOut, isReceiveAndDelete: true}, function(err, message) {

        var end = process.hrtime(start);
        console.log('received a response in %ds seconds', end[0]);

        if (err) {

            console.log('error requesting message: ' + err);
            listenForMessages(serviceBus);

        } else {

            if (message !== null && typeof message === 'object' && 'customProperties' in message && 'sender' in message.customProperties) {

                console.log('received message from ' + message.customProperties.sender.toString());
                xml = message.body.replace('\\r\\n','');
                parseString(xml, function (err, result) {
                    if (err){
                        console.log('Error parsing body: ' + err);
                    } else {
                        console.log(JSON.stringify(result, null, 2));
                        // console.dir(message);
                    }
                });

                // Add message to azure tables
                
                listenForMessages(serviceBus);

            } else {

                console.log('invalid message received');
                console.dir(message);
                listenForMessages(serviceBus);

            }

        }

    });
}