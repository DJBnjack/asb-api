'use strict';

module.exports = {
    post: function queue_post(req, res) {
        var content = Buffer( req.body.content, 'base64').toString("ascii");
        console.dir(content);
        res.status(201).json(content);
    }
};