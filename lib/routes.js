var express = require("express"); 
var router = new express.Router();
var dbAccess = require("../lib/dbAccess.js");


function getinfo(req, res) {
  dbAccess.getStatus(function(err, results){        
    if (err){
      console.log(err);
      res.send({result:-8}); 
    }else{     
      //send json results
      res.send({result:1, data:results}); 
    }        
  });   
  
  
}
function getunspent(req, res) {
//test case P8pGJii1Jos35Au7ymBhS46ahuoDVrDdb8 block 100204, time: 1411634680 25 september 9 - 11  
  
  dbAccess.getUnspents(req.params.peercoinaddress, function(err, results){        
    if (err){
      console.log(err);
      res.send({result:-9}); 
    }else{     
      //send json results
      res.send({result:1, data:results}); 
    }        
  });  
}


router.get("/peercoin/info", getinfo);
router.get("/peercoin/:peercoinaddress/unspent", getunspent);


module.exports = router;
