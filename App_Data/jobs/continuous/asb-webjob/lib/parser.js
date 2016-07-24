module.exports = {
    parseToJSON: function(xml, cb) {
        xml = xml.replace('\\r\\n','');
        
        parseString(xml, function (err, result) {
            if (err){
                console.log('Error parsing body: ' + err);
            } else {
                console.log(JSON.stringify(result, null, 2));
                // console.dir(message);
            }
        });
    }
};

