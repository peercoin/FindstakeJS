FindStakeJS
=====
### Getting to know in advance when your Peercoins stake, without installing nodejs.
 
##How to use:
------------
 * goto http://ppc.blockr.io/api/v1/address/unspent/yout-Peercoin-address to lookup tx and n
 * fill in a transaction id and index
 
    
API for cross boundery access:
------------
``` js
  var keytx='to'+ TXId + '_' + txindex;

  var fileurl="https://googledrive.com/host/0B_v7IYUBEIMyR1ZfWWl6VjNnLTg/json/" + keytx + ".json";

  $.ajax({
    url: fileurl,
    dataType: "jsonp",
    jsonpCallback: keytx, 
    success: function(data){
      /* Do something with data */
    }
  });

```
  
------------

FindStakeJS is an **OPEN Open Source Project**. This means that:

> Individuals making significant and valuable contributions are given commit-access to the project to contribute as they see fit. This project is more like an open wiki than a standard guarded open source project.


### Contributors
 

 
-------------------
 