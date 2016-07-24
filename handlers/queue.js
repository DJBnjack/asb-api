'use strict';
var azure = require('azure');
var connStr = process.env.CONNECTION_STRING;
if (!connStr) throw new Error('Must provide connection string to queue');

var queueName = process.env.APPSETTING_queue;
if (!queueName) throw new Error('Must provide queue name');
        
module.exports = {
    post: function queue_post(req, res) {
        var content = Buffer(req.body.content, 'base64').toString("ascii");
        var sender = req.body.sender;

        var serviceBusService = azure.createServiceBusService(connStr);
        var message = {
            body: content,
            customProperties: {
                sender: sender
            }
        };

        serviceBusService.sendQueueMessage(queueName, message, function(error){
            if(!error) {
                console.log("Added message to queue.");
            } else {
                console.dir(error);
            }
        });
        
        // console.dir(content);
        res.status(201).json(content);
    }
};