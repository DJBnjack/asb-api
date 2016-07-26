console.log('listener job started');
var azure = require('azure');
var azureStorage = require('azure-storage');
var parseString = require('xml2js').parseString;

var connStr = process.env.CONNECTION_STRING;
if (!connStr) throw new Error('Must provide connection string to queue');

var queueName = process.env.queue;
if (!queueName) throw new Error('Must provide queue name');

var serviceBus = azure.createServiceBusService(connStr);
listenForMessages(serviceBus);

// Uses env variables AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_ACCESS_KEY, or AZURE_STORAGE_CONNECTION_STRING for information
var tableSvc = azureStorage.createTableService();
var tableName = process.env.AZURE_TABLE_NAME;

var sql = require('mssql');
var sqlTable = process.env.AZURE_SQL_TABLE;
var config = {
    user: process.env.AZURE_SQL_USER,
    password: process.env.AZURE_SQL_PASS,
    server: process.env.AZURE_SQL_SERVER, 
    database: process.env.AZURE_SQL_DB,
 
    options: {
        encrypt: true // Use this if you're on Azure 
    }
};

function addToStorage(msg, id, cb)
{
    var entGen = azure.TableUtilities.entityGenerator;
    var message = {
        PartitionKey: entGen.String(String(id)),
        RowKey: entGen.String(''),
        Message: entGen.String(JSON.stringify(msg))
    };

    tableSvc.insertEntity(tableName, message, cb);
}

function addToDatabase(msg, cb)
{
    var request = msg['ns0:request'].$['xmlns:ns0'];
    var sender = msg['ns0:request']['ns0:header'][0]['ns1:afzender'][0]._;
    var customerId = msg['ns0:request']['ns0:klanten'][0]['ns0:klant'][0]['ns0:klantId'][0]._;
    var dateTime = new Date(msg['ns0:request']['ns0:header'][0]['ns1:aanroepDatumTijd'][0]._);

    // Add index to SQL & get ID
    var query = 'INSERT INTO [' + sqlTable + '] ';
    query = query + 'OUTPUT Inserted.ID ';
    query = query + 'VALUES (N\''+ request +'\', N\'' + sender + '\',\'' + customerId + '\',\'' + dateTime.toISOString() + '\')';

    var connection1 = new sql.Connection(config, function(err) {

        if (err) {
            console.dir(err);
        } else {
    
            var request = new sql.Request(connection1); 
            // request.verbose = true; // - To see more info on the SQL request
            request.query(query, function(err, recordset) {
                if (err) {
                    console.dir(err);
                } else {

                    // Give ID
                    cb(recordset[0].ID);

                }
            });
        
        }
    });
    
    connection1.on('error', function(err) {
        console.dir(err);
    });
}

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
                parseString(xml, function (err, msg) {
                    if (err){
                        console.log('Error parsing body: ' + err);
                    } else {
                        
                        // Add meta-info to SQL database
                        addToDatabase(msg, function(id){

                            // Add message to azure tables
                            addToStorage(msg, id, function(err, result, response) {

                                if (err)
                                {
                                    console.dir(err);
                                } else {
                                    console.log('Added msg to database and storage.');
                                    console.dir(result);
                                    console.dir(response);
                                }

                            });
                        });
                    }
                });
                
                listenForMessages(serviceBus);

            } else {

                console.log('invalid message received');
                console.dir(message);
                listenForMessages(serviceBus);

            }

        }

    });
}