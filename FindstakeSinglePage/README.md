FindStakeJS
=====
### Getting to know in advance when your Peercoins stake, without installing nodejs.
 
  
------------
Attention: All Divshot products and services will shut down on Monday, December 14, 2015.
This single page solution using jsonp will most likely be discontinued. Use the nodejs version (by typing localhost:3000) instead.

##How to use:
------------
 * open index.html with a modern browser
 * fill in a Peercoin Address and a start and end date
 * click Go  
 
    
API for cross boundery access:
------------
``` js
  var keytx='to'+ TxId + '_' + TxIndex;

  var fileurl="http://peercoinfindstakedata.divshot.io/json/" + keytx + ".json";

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
 