/**
 * Created by Joe on 12/28/15.
*/
var express =  require('express');
var app = express();
var port = 4001;

app.use('/', express.static(__dirname + '/app'));

app.set('port', (process.env.PORT || port));
app.listen(app.get('port'),function(){
    console.log('K2VIEW TDM - Front End running on port: ' + port);
});