var http = require("http");
var express = require('express');
var app = express();
var {Pool, Client} = require('pg');
var bodyParser = require('body-parser');

//start mysql connection
//==========================================================================================================
//var database = 'test';
//var isOnHeroku = false;
//var connectionString = 'postgres://postgres:sa@localhost';                            // localhost

var database = 'test';
var isOnHeroku = false;
var connectionString = 'postgres://postgres:123@postgresql-server';                   // docker

//var database = 'deiiotdmhve2me';                                                        // heroku
//var isOnHeroku = true;
//var connectionString = 'postgres://tfyqwbuvsjbbiz:e4153375e38171b24bca62883209ae1b77b10c8c661425c13360cf21f1f7d523@ec2-34-234-228-127.compute-1.amazonaws.com:5432';
//==========================================================================================================

var connection = new Pool({
    connectionString: `${connectionString}`
});

var promiseCreateDatabase = new Promise((resolve, reject) => {
    if (isOnHeroku) {
        resolve('done');
        return;
    }

    connection.query(`
        select count(*) from pg_catalog.pg_database where datname = '${database}';
    `, (err, res) => {
        if (err) { console.log(err, res); throw err; }        

        if (res.rows && res.rows[0] && Number(res.rows[0].count) > 0) {
            connection.end();

            connectionString = `${connectionString}/${database}`;
            connection = new Pool({
                connectionString: connectionString  
            });            
            return;
        }            

        connection.query(`
            CREATE DATABASE ${database}
        `, (err, res) => {
            if (err) console.log(err, res);                
            console.log(`Initialize Data: Database '${database}' is created`);            
            resolve('done');
        });
    });
});

promiseCreateDatabase.then(() => {
    connectionString = `${connectionString}/${database}`;
    connection = new Pool({
        connectionString: connectionString  
    });
    
    connection.query(`
        CREATE TABLE IF NOT EXISTS customer (
            Id serial PRIMARY KEY,
            Name varchar(255) NOT NULL,
            Address varchar(255) NOT NULL,
            Country varchar(100) NOT NULL,
            Phone varchar(20) NOT NULL,
            Created_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            Updated_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `, (err, res) => {
        if (err) console.log(err, res);
        console.log('Initialize Data: Table Customer is created');

        connection.query(`
            INSERT INTO customer(Name, Address, Country, Phone) 
                SELECT * FROM (SELECT 'Sang 1', '123 doan van bo', 'VietNam', '0918 258 741') AS tmp 
                WHERE NOT EXISTS (SELECT name FROM customer WHERE name = 'Sang 1') 
                LIMIT 1;     
        `, (err, res) => {
            if (err) console.log(err, res);
            console.log('Initialize Data: Record 1 is created');

            connection.query(`
                INSERT INTO customer(Name, Address, Country, Phone) 
                    SELECT * FROM (SELECT 'Sang 2', '456 doan van bo', 'VietNam', '0918 258 444') AS tmp 
                    WHERE NOT EXISTS (SELECT name FROM customer WHERE name = 'Sang 2') 
                    LIMIT 1;    
            `, (err, res) => {
                if (err) console.log(err, res);
                console.log('Initialize Data: Record 2 is created');

                //connection.end();
            });
        });
    });
});



//end mysql connection


//start body-parser configuration
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
//end body-parser configuration

//create app server "127.0.0.1"
var server = app.listen(process.env.PORT || 2100, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log("Example app listening at http://%s:%s", host, port);  
  
});

//rest api to get all customers
app.get('/customer', function (req, res) {
   connection.query('select * from customer', function (error, results, fields) {
	  if (error) throw error;
	  res.end(JSON.stringify(results.rows));
	});
});
//rest api to get a single customer data
app.get('/customer/:id', function (req, res) {
   connection.query(`select * from customer where id=${req.params.id}`, function (error, results, fields) {
      if (error) throw error;      
	  res.end(JSON.stringify(results.rows));
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