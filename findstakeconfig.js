exports.config = (function() {
  var express = {
    port: process.env.EXPRESS_PORT || 3000
  };
  var rpc = {
    host: "localhost",
    port: 8332,
    user: "loooooooooongusr",
    pass: "verylongpaaaaaaasword"
  };
  var db = {
    dbmetakey: "MetaDataPpcFindstakeDb",
    host: "1localhost", //mysql ip
    user: "mysqlusr",
    password: "mysqlpw",
    database: "findstake"
  };
  return {
    express: express,
    rpc: rpc,
    db: db
  };
})();
