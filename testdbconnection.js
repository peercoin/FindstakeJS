const sqlite3 = require("sqlite3").verbose();
var config = require("./findstakeconfig");


const dbfile = config.config.db.database

const pool = {};

const getMeta = function(pool, key, callback) {
  let sql = `SELECT name, data
FROM Meta
WHERE name  = ?`;

  let db = new sqlite3.Database(dbfile);

  try {
    db.get(sql, [key], (error, row) => {
      
      if (error) throw error;
      console.log(row);
       let dat = !row ? null : JSON.parse(row.data);
      // console.log(row);

       callback(error, dat);
    });
  } catch (err) {
    console.log(err);
  } finally {
    db.close();
  }
};
 
 
getMeta(pool, '1',(err, xxx)=>{
  console.log(xxx);

})
 