var mysql = require("mysql");
var config = require("./findstakeconfig");

const pool = mysql.createPool({
  connectionLimit: 1,
  host: config.config.db.host,
  user: config.config.db.user,
  password: config.config.db.password,
  database: config.config.db.database
});

 
const getMeta = function(pool, key, callback) {
  pool.query('SELECT * from Meta WHERE name="' + key + '"', function(
    error,
    results,
    fields
  ) {
    if (error) throw error;

    let data = results.length == 0 ? null : results[0].data;
    callback(error, JSON.parse(data));
  });
};
getMeta(pool, config.config.db.dbmetakey,(err, xxx)=>{
  console.log(xxx);
  pool.end(function(err) {
    // all connections in the pool have ended
  });
})
 