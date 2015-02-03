
exports.config = (function () {

	var express = {
		port : process.env.EXPRESS_PORT || 3000
	};
	var rpc = {
		host : 'localhost',
		port : 8332,
		user : 'change_this_to_a_long_random_user',
		pass : 'change_this_to_a_long_random_password'
	}; 
  var db = {
  	dbmetakey : 'MetaDataPpcFindstakeDb'
  };
	return {
		express : express,
		rpc : rpc,
    db: db
	};

})();