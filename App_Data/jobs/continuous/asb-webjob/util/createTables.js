// Uses env variables AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_ACCESS_KEY, or AZURE_STORAGE_CONNECTION_STRING for information
var azureStorage = require('azure-storage');
var tableSvc = azureStorage.createTableService();

['asbArchiveLocal', 'asbArchiveDev', 'asbArchiveTest', 'asbArchiveAcc', 'asbArchive'].forEach(function (item) {

  tableSvc.createTableIfNotExists(item, function(error, result, response){
    if(error){
      console.log("Error: " + error);
    } else {
      // Table exists or created
      console.log("Success");
    }
  });

});
