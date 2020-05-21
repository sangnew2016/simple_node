var http = require("http");
var express = require('express');
var app = express();
var mysql      = require('mysql');
var bodyParser = require('body-parser');

//start mysql connection
var connection = null;

var status1 = new Promise((resolve, reject) => {
    var conn = mysql.createConnection({
        host     : 'mysql-server',    //mysql database host name
        user     : 'root',            //mysql database user name
        password : '123'              //mysql database password      
    });

    conn.connect(function(err) {
        if (err) throw err;
        
        conn.query("CREATE DATABASE IF NOT EXISTS test;", function (err, result) {
            if (err) throw err;
            console.log("Database created");
            resolve(conn);
        });        
    });
});

var status2 = new Promise((resolve, reject) => {
    status1.then(function(cnn) {
        cnn.end(function() {
            console.log('Close connection is ok.');
            resolve('done');
        });        
    });
});

var status3 = new Promise((resolve, reject) => {
    status2.then(function() {
        connection = mysql.createConnection({
            host     : 'mysql-server',    //mysql database host name
            user     : 'root',            //mysql database user name
            password : '123',              //mysql database password      
            database : 'test'
        });
    
        connection.query(`
            CREATE TABLE IF NOT EXISTS \`customer\` (
                \`Id\` int(11) NOT NULL AUTO_INCREMENT,
                \`Name\` varchar(255) NOT NULL,
                \`Address\` varchar(255) NOT NULL,
                \`Country\` varchar(100) NOT NULL,
                \`Phone\` varchar(20) NOT NULL,
                \`Created_on\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`Updated_on\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`Id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1;    
        `, function (error, results, fields) {
                if (error) throw error;    
                console.log('Initialize data: create Customer Table');
                resolve('done');
        });
    });
});

status3.then(function() {
    connection.query(`    
        INSERT INTO customer(Name, Address, Country, Phone) 
            SELECT * FROM (SELECT 'Sang 1', '123 doan van bo', 'VietNam', '0918 258 741') AS tmp 
            WHERE NOT EXISTS (SELECT name FROM customer WHERE name = 'Sang 1') 
            LIMIT 1;
    `, function (error, results, fields) {
            if (error) throw error;    
            console.log('Initialize data: Insert record 1');
    });

    connection.query(`    
        INSERT INTO customer(Name, Address, Country, Phone) 
            SELECT * FROM (SELECT 'Sang 2', '456 doan van bo', 'VietNam', '0918 258 444') AS tmp 
            WHERE NOT EXISTS (SELECT name FROM customer WHERE name = 'Sang 2') 
            LIMIT 1;
    `, function (error, results, fields) {
            if (error) throw error;    
            console.log('Initialize data: Insert record 2');
    });
});
//end mysql connection


//start body-parser configuration
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
//end body-parser configuration

//create app server
var server = app.listen(1234,  "127.0.0.1", function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);  
  
});

//rest api to get all customers
app.get('/customer', function (req, res) {
   connection.query('select * from customer', function (error, results, fields) {
	  if (error) throw error;
	  res.end(JSON.stringify(results));
	});
});
//rest api to get a single customer data
app.get('/customer/:id', function (req, res) {
   connection.query('select * from customer where Id=?', [req.params.id], function (error, results, fields) {
	  if (error) throw error;
	  res.end(JSON.stringify(results));
	});
});

//rest api to create a new customer record into mysql database
app.post('/customer', function (req, res) {
   var params  = req.body;
   console.log(params);
   connection.query('INSERT INTO customer SET ?', params, function (error, results, fields) {
	  if (error) throw error;
	  res.end(JSON.stringify(results));
	});
});

//rest api to update record into mysql database
app.put('/customer', function (req, res) {
   connection.query('UPDATE `customer` SET `Name`=?,`Address`=?,`Country`=?,`Phone`=? where `Id`=?', [req.body.Name,req.body.Address, req.body.Country, req.body.Phone, req.body.Id], function (error, results, fields) {
	  if (error) throw error;
	  res.end(JSON.stringify(results));
	});
});

//rest api to delete record from mysql database
app.delete('/customer', function (req, res) {
   console.log(req.body);
   connection.query('DELETE FROM `customer` WHERE `Id`=?', [req.body.Id], function (error, results, fields) {
	  if (error) throw error;
	  res.end('Record has been deleted!');
	});
});