'use strict';

 module.exports = {
     post: function queue_post(req, res) {
         console.log(req.body);
         res.status(201).json(req.body);
     }
 };