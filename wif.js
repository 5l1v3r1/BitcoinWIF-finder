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
npm install bitcoinjs-lib -S
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

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf importprivkey "5JXZ9tsdcBwX357SmFBZseXgc5QR2mdU3J88QBSND7exMHmZ2Wf" "q1" false

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf getaddressesbyaccount "q1"
#return
[
  "1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm"
]

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf getbalance "" 
#return
0.00000000

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

bitcoin-cli -conf=/var/btc/bitcoind/bitcoin.conf dumpwallet "/var/btc/wif/wallet_dump.txt" 

*/
var fs = require('fs')
const path = require('path');
var colors = require('colors');
var request = require('request');
const Bitcore = require("bitcore-lib");
//const WebSocket = require('ws');
var crypto = require('crypto');
var Redis = require('ioredis');
var redis = new Redis(6379,'127.0.0.1');
//var Wallet = require('ethereumjs-wallet');
//var EthUtil = require('ethereumjs-util');

/*********************** REDIS *******************************/
/*
sudo apt update
sudo apt install redis-server
sudo nano /etc/redis/redis.conf 
	#change work patch
	sudo systemctl restart redis.service
	#if error 
		MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist on disk. Commands that may modify the data set are disabled. Please check Redis logs for details about the error.
	redis-cli
		CONFIG SET dir /var/wif/redis
		CONFIG SET dbfilename dump.rdb
	#if error for save db
	nano /etc/systemd/system/redis.service
		#add in file
		ReadWriteDirectories=-/var/btc/wif/redis
	sudo systemctl daemon-reload
sudo systemctl restart redis.service
sudo systemctl status redis.service
sudo systemctl restart redis-server.service
sudo systemctl status redis-server.service
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
sudo apt remove redis-server
sudo rm /etc/redis/redis.conf 
sudo rm -rf /var/lib/redis
sudo deluser redis

#Logs
tail -F /var/log/redis/redis-server.log

#Backup
sudo systemctl stop redis
sudo chown redis:redis /var/wif/redis
sudo chown redis:redis /var/wif/redis/dump.rdb
sudo chmod 777 /var/wif/redis -R
sudo chmod 777 /var/wif/redis/dump.rdb

cp -rf /var/wif/redis/dump1.rdb /var/lib/redis/dump.rdb
ls -la /var/lib/redis/
sudo chown redis:redis /var/lib/redis/dump.rdb
sudo chmod 777 /var/lib/redis/dump.rdb
ls -la /var/lib/redis/
sudo systemctl start redis

SET mykey "test"
*/

try {
	redis.ping()
    .then(function(e) {
        console.log('Connected REDIS!');
		//import_map();
		/*
		redis.keys( '*' , function (err, _keys) {
			keys = _keys;
			console.log( 'redis.keys'.green , keys.length, _keys[0] );
			rescan();
		});
		*/
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

var keys = '';
async function rescan(){
	for(var i = 457863; i < keys.length; i++) {
		await check( keys[i], i );
	}
}

function check( key, c ){
	return new Promise(resolve => {
		redis.mget( key , function (err, mget) {
			if( mget[0] < 5000000 ){
				redis.del( key , function (err, result) {
					console.log('Delete key['+c+']:', key, mget[0] );
					return resolve( true ); 
				});
			}else{ return resolve( true ); }
		});
	});
}

/***************************** WIF FINDER *******************************/

var ok = 0; var no = 0; var s = 0;
var time = Math.round(+new Date());
async function start_find_wif(){
	var r = await generate( );
	if( r == true ){ ok++; }
	else if( r == false ){ no++; }else{ 
		var omni = 0;//await 
		check_omni( r.address, r.WIFkey, r.seed, r.hex );
		var ltc = 0;//await 
		check_ltc( r.address, r.WIFkey, r.seed, r.hex );
		var btc = await check_btc( r.address, r.WIFkey, r.seed, r.hex );
		if( omni > 0 || ltc > 0 || btc > 0 ){
			console.log( 'BALANCES', omni, ltc, btc );
		}
		/*
		var eth = await check_eth( r.address, r.WIFkey, r.seed, r.hex );
		if( eth > 0 ){
			console.log( 'BALANCES', 'eth', eth );
		}
		*/
		no++; 
	}
	s++;
	
	var i = Math.round(+new Date());
	if( ( i - time)  > 1000 ){
		console.log( 'STATUS'.green, 'OK:'.bgGreen.bold.white, ok, 'NO'.bgWhite.bold.red, no, 'P/S:'.bold.blue, s );
		time = i; s = 0;
		startIndex++;
		start_find_wif();
	}else if( startIndex >= lastIndex ){
		storeConf( );
	}else{
		startIndex++;
		start_find_wif();
	}
}

var start = 1; var nextS = 0;
function generate( ){
	return new Promise(resolve => {
		var seed = '';
		var hex = '0000000000000000000000000000000000000000000000000000000000000001';
		/*************** ETHERIUM ***********************/
		/*
		try{
			var end = startIndex.toString(16);
			// When 'end' Hex = 123 and 'startIndex' = 14299 we should return FALSE
			if( end < startIndex ){ return resolve( false ); }
			hex = ('0xafdfd9c3d2095ef696594f6cedcae59e72dcd697e2a7521b1578140400' + end).slice(-64);
			const privateKeyString = '0x'+hex;
			//'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364100';
			const privateKeyBuffer = EthUtil.toBuffer( privateKeyString );
			const wallet = Wallet.fromPrivateKey( privateKeyBuffer );
			const publicKey = wallet.getPublicKeyString();
			//console.log('publicKey'.yellow, publicKey);
			const address = wallet.getAddressString();
			var WIFkey = '';
			//console.log('address'.yellow, address, startIndex, privateKeyString);
			var arrWIF = { address:address.toString(), WIFkey:WIFkey, seed:seed, hex:privateKeyString, target:'ETH' };
			if( address == '0x9c2fc4fc75fa2d7eb5ba9147fa7430756654faa9' ){
				arrGoodKeys.push( arrWIF );
				storeGoodKeys( );
				return resolve( false );
			}
			return resolve( arrWIF );
		}catch(e){ console.log('error'.red, hex, e); return resolve( false ); }
		*/
		/********************  HEX **********************/
		
		var end = startIndex.toString(16).toUpperCase();
		hex = ('0000000000000000000000000000000000000000000000000000000000000000' + end).slice(-64);
		//When 'end' Hex = 123 and 'startIndex' = 14299 we should return FALSE
		//if( end < startIndex ){ return resolve( false ); }
		/***************** RANDOM HEX *******************/
		const randomString = crypto.randomBytes(32).toString('hex');
		hex = randomString;
		/************************************************/
		
		//console.log( 'hex', hex );
		// Compressed Key (nu skool)
		
		// shortaddress 1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm
	
		// Uncompressed Key (old skool)
		var WIFkey = new Bitcore.PrivateKey( hex ).toWIF();
		// wif KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn
		var address = new Bitcore.PrivateKey( hex ).toAddress( Bitcore.Networks.livenet );
		// address 1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH
		//console.log( 'address: '+address,' WIFkey:'+WIFkey );
		var arrWIF = { address:address.toString(), WIFkey:WIFkey, seed:seed, hex:hex, target:'BTC' };
		return resolve( arrWIF );
		/******************** SEED **********************/
		/*
		for( var i = 0; i < start; i++) {
			var rand = 1 - 0.5 + Math.random() * (arrMap.length - 1 + 1)
			rand = Math.round( rand );
			if( i == 0 ){ seed += arrMap[rand]; }
			if( i > 0 ){ seed += ' '+ arrMap[rand]; }
		}
		*/
		/*
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
		*/
		
		/*
		//try found WIF address on exist
		redis.get( address , function (err, result) {
			if( result != null ){
				var find = arrGoodKeys.filter(x => x.address == address );
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
		*/
	});
}

function check_eth( address, WIFkey, seed, hex ){
	return new Promise(resolve => {
		//https://api.etherscan.io/api?module=account&action=balance&address=0xddbd2b932c763ba5b1b7ae3b362eac3e8d40121a
		request.get( 'https://api.etherscan.io/api?module=account&action=balance&address='+address, { },
		function (error, res, body) {
			if (!error && res.statusCode == 200){
				//{"status":"1","message":"OK","result":"40807178566070000000000"}
				var result = JSON.parse( res.body );
				if( result.result > 0 ){
					var arrWIF = { address:address, WIFkey:WIFkey, seed:seed, hex:hex, target:'ETH' };
					var find = arrGoodKeys.filter(x => x.address == address );
					if( find.length == 0 ){
						console.log( 'address:', address.toString().yellow, 'ETH', result.result );
						arrWIF.target = 'ETH';
						arrGoodKeys.push( arrWIF );
						storeGoodKeys( );
					}
					return resolve( true );
				}else{
					return resolve( result.result );
				}
			}else{
				return resolve( false );
			}
		});
	});
}
function check_btc( address, WIFkey, seed, hex ){
	return new Promise(resolve => { //addressbalance
		request.get( 'https://blockchain.info/q/getreceivedbyaddress/'+address, { },
		function (error, res, body) {
			if (!error && res.statusCode == 200){
				if( res.body > 0 ){
					var arrWIF = { address:address, WIFkey:WIFkey, seed:seed, hex:hex, target:'BTC' };
					var find = arrGoodKeys.filter(x => x.address == address );
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
					var find = arrGoodKeys.filter(x => x.address == address );
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
							var find = arrGoodKeys.filter(x => x.address == address );
							if( find.length == 0 ){
								console.log( 'address:', address.toString().yellow, 'OMNI_'+balance[i].symbol.toUpperCase(), balance[i].value );
								arrWIF.target = balance[i].symbol.toUpperCase();
								arrGoodKeys.push( arrWIF );
								storeGoodKeys( );
							}
							redis.set( address , balance[i].value, function (err, result) {
								
							});
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

var mapFile = './word/word.txt';
var arrMap = [];

var keysGoodFile = './goodKeys.json';
var arrGoodKeys = [];

fs.readFile( path.resolve(__dirname, keysGoodFile ), 'utf-8', function(err, buf) {
	var arr = buf.toString();
	arrGoodKeys = JSON.parse( arr );
	console.log('loadGoodKeys'.green, arrGoodKeys.length);
	/*fs.readFile( path.resolve(__dirname, mapFile ), 'utf-8', function(err, buf) {
		var arr = buf.toString();
		arrMap = JSON.parse( arr );
		console.log('loadMap'.green, arrMap.length );*/
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
	/*});*/
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