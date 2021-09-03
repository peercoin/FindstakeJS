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
    database: "findstakejs.dat"
  };
  return {
    express: express,
    rpc: rpc,
    db: db
  };
})();
