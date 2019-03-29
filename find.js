"use strict";

/*
sudo apt-get update
sudo apt-get install software-properties-common
sudo apt-add-repository ppa:bitcoin/bitcoin
sudo apt-get update
sudo apt-get install bitcoind

bitcoind -datadir=/var/btc/bitcoind/datadir -rpcport=14545 -rpcuser=test -rpcpassword=test -conf=/var/btc/bitcoind/bitcoin.conf -deprecatedrpc=accounts -daemon

#Remove
bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf stop
sudo apt-get remove bitcoind
rm -rf ~/.bitcoin
rm -rf /var/btc/bitcoind
sudo apt autoremove
rm -rf /var/btc

sudo apt update
sudo apt install redis-server

npm install fs -S
npm install bitcore-lib -S
#npm install bitcoinjs-lib -S
npm install path -S
npm install colors -S
npm install request -S
npm install ws -S
npm install ioredis -S

#Import WIF
bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf getaddressesbyaccount ""
#return
[
  
]

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf importprivkey "KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU7HKMe7qaS" "checker" false

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf getaddressesbyaccount "checker"
#return

[
  "1xm4vFerV3pSgvBFkyzLgT1Ew3HQYrS1V"
]


bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf getbalance "checker" 
#return
0.15337710

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf listaddressgroupings
#return
[
  [
    [
      "1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm",
      0.00000000,
      ""
    ]
  ]
]

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf listreceivedbyaccount

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf getwalletinfo

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf dumpwallet "/var/btc/bitcoind/wallet.txt" 

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf importprivkey "KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn" "checker" false

*/
var fs = require('fs')
const path = require('path');
var colors = require('colors');
var request = require('request');
const Bitcore = require("bitcore-lib");
const WebSocket = require('ws');
var crypto = require('crypto');
var Redis = require('ioredis');
var redis = new Redis(6379,'127.0.0.1');

/*********************** REDIS *******************************/
/*
sudo apt update
sudo apt install redis-server
sudo nano /etc/redis/redis.conf 
	#change work patch
	sudo systemctl restart redis.service
	#if error need set patch
	redis-cli
		CONFIG SET dir /var/btc/wif/redis
		CONFIG SET dbfilename temp.rdb
	#if error for save db
	nano /etc/systemd/system/redis.service
		#add in file
		ReadWriteDirectories=-/var/btc/wif/redis
	sudo systemctl daemon-reload
sudo systemctl status redis.service
sudo systemctl restart redis-server.service
	#Crear 
		#FLUSHDB - Removes data from your connection's CURRENT database.
		#FLUSHALL - Removes data from ALL databases.
	redis-cli 
		flushall
	#Get count stored values
	redis-cli 
		SCAN 0 COUNT 100 MATCH p_*
		#return
		1) "54788096"
		2) (empty list or set)
		(1.12s)
		
#Remove
sudo systemctl stop redis
sudo systemctl disable redis

sudo rm /etc/redis/redis.conf 
sudo rm -rf /var/lib/redis
sudo deluser redis


SET mykey "test"
*/
try {
	redis.ping()
    .then(function(e) {
        console.log('Connected REDIS!');
		//import_map();
    })
    .catch(function(e) {
            console.log('Error REDIS:'.red, e);
    });
	/*
	redis.set('test1', 'Tesla Model S', function (err, result) {
        console.log('Set Record: ', result);
    });
    redis.get('test1', function (err, result) {
        console.log('Get Record:', result);
    });
    redis.del('test1', function (err, result) {
        console.log('Delete Record:', result);
    });
    redis.get('test1', function (err, result) {
        console.log('Get Deleted Record:', result);
    });
	console.log( 'redis.keys'.yellow );
	redis.keys( '*' , function (err, result) {
		console.log( 'redis.keys'.green , result );
		return;
		for(var i = 0, len = result.length; i < len; i++) {
			console.log(result[i]);
		}
	});
	redis.quit();
	*/
}
catch (e) {
    console.log('Error REDIS:', e);
}

/***************************** WIF FINDER *******************************/

var ok = 0; var no = 0; var s = 0;
var time = Math.round(+new Date());
async function start_find_wif(){
	var r = await generate( );
	if( r == true ){ ok++; }else{ 
		//var btc = await check_btc( r.address, r.WIFkey, r.seed, r.hex );
		//var ltc = await check_ltc( r.address, r.WIFkey, r.seed, r.hex );
		//var omni = await check_omni( r.address, r.WIFkey, r.seed, r.hex );
		no++; 
	}
	s++;
	
	var i = Math.round(+new Date());
	if( ( i - time)  > 1000 ){
		console.log( 'STATUS'.green, 'OK:'.bgGreen.bold.white, ok, 'NO'.bgWhite.bold.red, no, 'P/S:'.bold.blue, s );
		time = i; s = 0;
		//startIndex++;
		start_find_wif();
	}else if( startIndex >= lastIndex ){
		storeConf( );
	}else{
		//startIndex++;
		start_find_wif();
	}
	//if( start <= arrMap.length ){
	//	start_find_wif();
	//}
}

var start = 1; var nextS = 0;
function generate( ){
	return new Promise(resolve => {
		var seed = ''; var hex = '';
		/********************  HEX **********************/
		//var hex = '0000000000000000000000000000000000000000000000000000000000000001';
		//var end = startIndex.toString(16).toUpperCase();
		//hex = ('0000000000000000000000000000000000000000000000000000000000000000' + end).slice(-64);
		/* When 'end' Hex = 123 and 'startIndex' = 14299 we should return FALSE */
		//if( end < startIndex ){ return resolve( false ); }
		/***************** RANDOM HEX *******************/
		//const randomString = crypto.randomBytes(32).toString('hex');
		//hex = randomString;
		/************************************************/
		
		//console.log( 'hex', hex );
		// Compressed Key (nu skool)
		
		// shortaddress 1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm
		/*
		// Uncompressed Key (old skool)
		var WIFkey = new Bitcore.PrivateKey( hex ).toWIF();
		// wif KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn
		var address = new Bitcore.PrivateKey( hex ).toAddress( Bitcore.Networks.livenet );
		// address 1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH
		//console.log( 'address: '+address,' WIFkey:'+WIFkey );
		*/
		/******************** SEED **********************/
		/*
		for( var i = 0; i < 12; i++) {
			var rand = 1 - 0.5 + Math.random() * (arrMap.length - 1 + 1)
			rand = Math.round( rand );
			if( i == 0 ){ seed += arrMap[rand]; }
			if( i > 0 ){ seed += ' '+ arrMap[rand]; }
		}
		*/
		
		for( var i = 0; i < start; i++) {
			if( i == 0 ){ seed += arrMap[nextS]; }
			if( i > 0 ){ seed += ' '+ arrMap[nextS]; }
		}
		if( start >= 6 ){ start = 1; nextS++; }
		else{ start++; }
		
		//let seed = 'satoshi';
		let input = new Buffer.from( seed );
		let hash = Bitcore.crypto.Hash.sha256( input );
		let bn = Bitcore.crypto.BN.fromBuffer( hash );
		let WIFkey = new Bitcore.PrivateKey( bn ).toWIF();
		let address = new Bitcore.PrivateKey( bn ).toAddress();
		//console.log( 'address: '+address,' WIFkey:'+WIFkey );
		//console.log( 'seed: '+seed );
		
		var arrWIF = { address:address.toString(), WIFkey:WIFkey, seed:seed, hex:hex, target:'BTC' };
		
		//try found WIF address on exist
		redis.get( address , function (err, result) {
			if( result != null ){
				console.log( 'address:', address.toString().yellow, WIFkey, 'BTC', startIndex );
				var find = arrGoodKeys.filter(x => x.address === address && x.target === 'BTC' );
				if( find.length == 0 ){
					console.log( 'address:', address.toString().yellow, 'BTC', find, startIndex );
					arrGoodKeys.push( arrWIF );
					storeGoodKeys( );
				}
				return resolve( true );
			}else{
				return resolve( arrWIF );
			}
		});
	});
}

/***************************** IMPORT MAP ************************************/
function import_map(){
	var lineReader = require('readline').createInterface({
		input: require('fs').createReadStream( path.resolve(__dirname, './address.map' ) )
	});
	var count = 0; var timeImport = Math.round(+new Date());
	lineReader.on('line', function (address) {
		redis.set( address , 100000000, function (err, result) {
			var i = Math.round(+new Date());
			if( ( i - timeImport)  > 1000 ){
				console.log( 'Import'.green, 'OK:'.bgGreen.bold.white, count, 'P/S:'.bold.blue, s );
				timeImport = i; s = 0;
			}
			s++;
			count++;
		});
	});
}
/***********************************************************************/

var confFile = './conf.txt';
var arrConf = {};
var startIndex = 0;
var lastIndex = 0;
var periodIndex = 0;

//var mapFile = './word/9mil.txt';
//var mapFile = './word/word.txt';
//var arrMap = [];

var keysGoodFile = './goodKeys.json';
var arrGoodKeys = [];

fs.readFile( path.resolve(__dirname, keysGoodFile ), 'utf-8', function(err, buf) {
	var arr = buf.toString();
	arrGoodKeys = JSON.parse( arr );
	console.log('loadGoodKeys'.green, arrGoodKeys.length);
	
	/*
	var lineReader = require('readline').createInterface({
		input: require('fs').createReadStream( path.resolve(__dirname, mapFile ) )
	});
	var count = 0; var timeImport = Math.round(+new Date());
	lineReader.on('line', function ( word ) {
		var i = Math.round(+new Date());
		if( ( i - timeImport) > 1000 ){
			console.log( 'Import'.green, 'OK:'.bgGreen.bold.white, count, 'P/S:'.bold.blue, s );
			timeImport = i; s = 0;
			fs.writeFileSync( path.resolve(__dirname, './word/word.txt' ), JSON.stringify( arrMap, null, 4));
		}
		arrMap.push( word );
		s++;
		count++;
		console.log( 'Import', count );
	});
	*/
	
	fs.readFile( path.resolve(__dirname, mapFile ), 'utf-8', function(err, buf) {
		var arr = buf.toString();
		arrMap = JSON.parse( arr );
		console.log('loadMap'.green, arrMap.length );
		fs.readFile( path.resolve(__dirname, confFile ), 'utf-8', function(err, buf) {
			var arr = buf.toString();
			arrConf = JSON.parse( arr );
			console.log('loadConf'.green, arrConf );
			startIndex = arrConf.start_index;
			periodIndex = arrConf.period_index;
			lastIndex = startIndex + periodIndex;
			arrConf.start_index = lastIndex;
			fs.writeFileSync( path.resolve(__dirname, confFile ), JSON.stringify( arrConf, null, 4));
			start_find_wif();
		});
	});
});

function storeGoodKeys( ){
	fs.writeFileSync( path.resolve(__dirname, keysGoodFile ), JSON.stringify( arrGoodKeys, null, 4));
	console.log('storeGoodKeys'.green);
}

function storeConf( ){
	fs.readFile( path.resolve(__dirname, confFile ), 'utf-8', function(err, buf) {
		var arr = buf.toString();
		var _arrConf = JSON.parse( arr );
		var _startIndex = _arrConf.start_index;
		periodIndex = _arrConf.period_index;
		arrConf.start_index = _startIndex + periodIndex;
		startIndex = _startIndex;
		lastIndex = _startIndex + periodIndex;
		console.log('storeConf'.bold.green, 'LOAD:', _arrConf.start_index, startIndex+'...'+lastIndex );
		fs.writeFileSync( path.resolve(__dirname, confFile ), JSON.stringify( arrConf, null, 4));
		start_find_wif();
	});
}

/*****************************************************************/

function check_btc( address, WIFkey, seed, hex ){
	return new Promise(resolve => {
		request.get( 'https://blockchain.info/q/getreceivedbyaddress/'+address, { },
		function (error, res, body) {
			if (!error && res.statusCode == 200){
				if( res.body > 0 ){
					var arrWIF = { address:address, WIFkey:WIFkey, seed:seed, hex:hex, target:'BTC' };
					var find = arrGoodKeys.filter(x => x.address === address && x.target === 'BTC' );
					if( find.length == 0 ){
						console.log( 'address:', address.toString().yellow, 'BTC', res.body );
						arrWIF.target = 'BTC';
						arrGoodKeys.push( arrWIF );
						storeGoodKeys( );
					}
					redis.set( address , res.body /*JSON.stringify( arrWIF )*/, function (err, result) {
						return resolve( true );
					});
				}else{
					//console.log( 'address:', address.toString().bold.white, 'BTC', res.body );
					return resolve( res.body );
				}
			}else{
				return resolve( false );
			}
		});
	});
}
function check_ltc( address, WIFkey, seed, hex ){
	return new Promise(resolve => {
		request.get( 'http://explorer.litecoin.net/chain/Litecoin/q/getreceivedbyaddress/'+address, { },
		function (error, res, body) {
			if (!error && res.statusCode == 200){
				if( res.body > 0 ){
					var arrWIF = { address:address, WIFkey:WIFkey, seed:seed, hex:hex, target:'LTC' };
					var find = arrGoodKeys.filter(x => x.address === address && x.target === 'LTC' );
					if( find.length == 0 ){
						console.log( 'address:', address.toString().yellow, 'LTC', res.body );
						arrWIF.target = 'LTC';
						arrGoodKeys.push( arrWIF );
						storeGoodKeys( );
					}
					redis.set( address , res.body /*JSON.stringify( arrWIF )*/, function (err, result) {
						return resolve( true );
					});
				}else{
					//console.log( 'address:', address.toString().bold.white, 'LTC', res.body );
					return resolve( res.body );
				}
			}else{
				return resolve( false );
			}
		});
	});
}

//check_omni( '19b5F9vrjBGsLqRULQqkvkmLJqiEtdX7Ar' );
function check_omni( address, WIFkey, seed, hex ){
	return new Promise(resolve => {
		var headers = { 
		   'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/27.0.1453.110 Safari/537.36',
		   'Content-Type' : 'application/x-www-form-urlencoded' 
		};
		request.post( {headers: headers, url: 'https://api.omniwallet.org/v1/address/addr/', form: { addr:address }, method: 'POST'},
		function (error, res, body) {
			if (!error && res.statusCode == 200){
				try{
					var balance = JSON.parse( res.body );
					balance = balance.balance;
					var bal = 0;
					for( var i = 0; i < balance.length; i++) {
						if( balance[i].value > 0 ){
							bal = balance[i].value;
							var arrWIF = { address:address, WIFkey:WIFkey, seed:seed, hex:hex, target:balance[i].symbol.toUpperCase() };
							var find = arrGoodKeys.filter(x => x.address === address && x.target === balance[i].symbol.toUpperCase() );
							if( find.length == 0 ){
								console.log( 'address:', address.toString().yellow, 'OMNI_'+balance[i].symbol.toUpperCase(), balance[i].value );
								arrWIF.target = balance[i].symbol.toUpperCase();
								arrGoodKeys.push( arrWIF );
								storeGoodKeys( );
							}
							redis.set( address , balance[i].value, function (err, result) {
								
							});
						}else{
							//console.log( 'address:', address.toString().bold.white, 'OMNI_'+balance[i].symbol.toUpperCase(), balance[i].value );
						}
					}
					return resolve( bal );
				}catch(e){
					return resolve( false );
				}
			}else{
				return resolve( false );
			}
		});
	});
}