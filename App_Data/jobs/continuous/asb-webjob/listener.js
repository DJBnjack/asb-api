console.log('listener job started');
var azure = require('azure');
var connStr = process.argv[2] || process.env.CONNECTION_STRING;
if (!connStr) throw new Error('Must provide connection string to queue');

var queueName = process.argv[3] || process.env.APPSETTING_queue;
if (!queueName) throw new Error('Must provide queue name');

var serviceBus = azure.createServiceBusService(connStr);
listenForMessages(serviceBus);

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

            // Update validation
            if (message !== null && typeof message === 'object' && 'customProperties' in message && 'sender' in message.customProperties) {

                console.log('received message from ' + message.customProperties.sender.toString());
                console.dir(message);
                // Add message to documentdb
                
                listenForMessages(serviceBus);

            } else {

                console.log('invalid message received');
                console.dir(message);
                listenForMessages(serviceBus);

            }

        }

    });
}