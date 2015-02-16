var express = require('express'); 
var Settings = require('./config');
var staticrouter = new express.Router();
staticrouter.use(express.static((__dirname + "/public")));

var app = express();
app.use(staticrouter);
app.use(require("./lib/routes.js"));


////////////////////////////////////////////////////////////////////////////////////
//The 404 Route (ALWAYS Keep this as the last route)
////////////////////////////////////////////////////////////////////////////////////
app.get('*', function (req, res) {
	res.status(404).send({
		result : 0
	})
});
//////////////////////////////////////END routes///////////////////////////////////


var port = process.env.PORT || Settings.config.express.port;
app.listen(port, function () {
	console.log("Listening on " + port);
});
