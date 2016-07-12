console.log('listener job started');
var azure = require('azure');
var connStr = process.argv[2] || process.env.CONNECTION_STRING;
var queueName = process.argv[3] || process.env.QUEUNAME;
if (!connStr) throw new Error('Must provide connection string to queue');

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

            if (message !== null && typeof message === 'object' && 'customProperties' in message && 'message_number' in message.customProperties) {

                console.log('received test message number ' + message.customProperties.message_number.toString());
                listenForMessages(serviceBus);

            } else {

                console.log('invalid message received');
                listenForMessages(serviceBus);

            }

        }

    });
}