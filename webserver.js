var express = require("express");
var Settings = require("./findstakeconfig");
var dbAccess = require("./lib/dbAccess.js");

var staticrouter = new express.Router();
staticrouter.use(express.static(__dirname + "/dist"));

var app = express();
app.use(staticrouter);
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

function getinfo(req, res) {
  dbAccess.getStatus(function(err, results) {
    if (err) {
      console.log(err);
      res.send({ result: -8 });
    } else {
      //send json results
      res.send({ result: 1, data: results });
    }
  });
}

function getunspent(req, res) {
  //test case P8pGJii1Jos35Au7ymBhS46ahuoDVrDdb8 block 100204, time: 1411634680 25 september 9 - 11

  dbAccess.getUnspents(req.params.peercoinaddress, function(err, results) {
    if (err) {
      console.log(err);
      res.send({ result: -9 });
    } else {
      console.log(results);
      res.send({ result: 1, data: results });
    }
  });
}
 
app.get("/peercoin/info", getinfo);
app.get("/peercoin/:peercoinaddress/unspent", getunspent);

////////////////////////////////////////////////////////////////////////////////////
//The 404 Route (ALWAYS Keep this as the last route)
////////////////////////////////////////////////////////////////////////////////////
app.get("*", function(req, res) {
  res.status(404).send({
    result: 0
  });
});
//////////////////////////////////////END routes///////////////////////////////////

var port = process.env.PORT || Settings.config.express.port;
app.listen(port, function() {
  console.log("Listening on " + port);
});
