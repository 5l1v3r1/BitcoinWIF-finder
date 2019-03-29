"use strict";

var colors = require('colors');
var schedule = require('node-schedule');
var request = require('request');
var fs = require('fs')
const path = require('path');
/*
sudo apt-get update
sudo apt-get install software-properties-common
sudo apt-add-repository ppa:bitcoin/bitcoin
sudo apt-get update
sudo apt-get install bitcoind

bitcoind -datadir=/var/wif/bitcoin/datadir -rpcport=7701 -rpcuser=test -rpcpassword=test -conf=/var/wif/bitcoin.conf -deprecatedrpc=accounts -paytxfee=0.00002 -daemon

bitcoin-cli -conf=/var/wif/bitcoin.conf settxfee "0.00002"

#Remove
bitcoin-cli -conf=/var/wif/bitcoin.conf stop
sudo apt-get remove bitcoind
rm -rf ~/.bitcoin
rm -rf /var/wif/bitcoin
sudo apt autoremove
rm -rf /var/wif

bitcoin-cli -conf=/var/wif/bitcoin.conf importprivkey "5HpHagT65TZzG1PH3CSu63k8DbpvD8s5ip4nEB3kEsreNXqEJTk" "fetch" false

bitcoin-cli -conf=/var/wif/bitcoin.conf getwalletinfo

bitcoin-cli -conf=/var/wif/bitcoin.conf stop

tail -F /var/wif/bitcoin/datadir/debug.log


Bitcoin Address
1JUgeZzkDUEqwYmsGhv2m7cKwgxAyZ8zfs
Bitcoin Address Compressed
1DcBYnKekf9116KAkcQwiVweN5FS3Hzwdu
Wif
Kz7APbpH9JhxJKhW6s1UKNUSkT6ncmhDuCqsZgcgcoUwfVsPUrYh 
5JUE18tVabpo4UM3yA4jSTcfutgNfTthz97zg8ASk17LBYkmKiW

bitcoin-cli -conf=/var/wif/bitcoin.conf importprivkey "Kz7APbpH9JhxJKhW6s1UKNUSkT6ncmhDuCqsZgcgcoUwfVsPUrYh" "withdraw" false

bitcoin-cli -conf=/var/wif/bitcoin.conf getaddressesbyaccount "fetch" 
1DcBYnKekf9116KAkcQwiVweN5FS3Hzwdu

bitcoin-cli -conf=/var/wif/bitcoin.conf dumpprivkey "1DcBYnKekf9116KAkcQwiVweN5FS3Hzwdu"
Kz7APbpH9JhxJKhW6s1UKNUSkT6ncmhDuCqsZgcgcoUwfVsPUrYh

bitcoin-cli -conf=/var/wif/bitcoin.conf getwalletinfo
bitcoin-cli -conf=/var/wif/bitcoin.conf getbalance "fetch"


bitcoin-cli -conf=/var/wif/bitcoin.conf sendfrom "fetch" "1DcBYnKekf9116KAkcQwiVweN5FS3Hzwdu" 0.0215 1 "test" "test"

0.00003016

bitcoin-cli -conf=/var/wif/bitcoin.conf sendtoaddress "1DcBYnKekf9116KAkcQwiVweN5FS3Hzwdu" 0.02162 "TEST"
0.00000355

bitcoin-cli -conf=/var/wif/bitcoin.conf dumpwallet "/var/wif/wallet_dump.txt"

bitcoin-cli -conf=/var/wif/bitcoin.conf listtransactions
bitcoin-cli -conf=/var/wif/bitcoin.conf listaddressgroupings

bitcoin-cli -conf=/var/wif/bitcoin.conf gettransaction 6d5753088125e9e22c3c35844704490e0b9470b1b2fa962600af823ef4a57f40

#check decline transaction
bitcoin-cli -conf=/var/wif/bitcoin.conf abandontransaction 6d5753088125e9e22c3c35844704490e0b9470b1b2fa962600af823ef4a57f40
	Transaction not eligible for abandonment

#Check missings transactions
bitcoin-cli -conf=/var/wif/bitcoin.conf getrawmempool
	
bitcoin-cli -conf=/var/wif/bitcoin.conf sendrawtransaction "0200000001d935c5b09cbeac4b831ee73f836cc458460e7f751165e09b49249c6978444848000000008a47304402205171360427f6325ea94f9d9e2209abfdadeb2665f977fa329fee0b91111effc50220158de1d355b5b14fc69454617103ba08f554ab1c7463b643074438e4f5f509c3014104241febb8e23cbd77d664a18f66ad6240aaec6ecdc813b088d5b901b2e285131f513378d9ff94f8d3d6c420bd13981df8cd50fd0fbd0cb5afabb3e66f2750026dfeffffff0128230000000000001976a9141367d10f4d99d759f1e953763fcb84cde0db2e6188ace99f0500"

*/
schedule.scheduleJob('*/1 * * * * *', function( dateExecute ){
	//each 1 secound	/1 * * * * *
	send_money_to_wallet( );
});

var start_t = Math.round(+new Date());
function send_money_to_wallet( ){
	var i = Math.round(+new Date());
	/* read total balance */
	var getwalletinfo = {
		url: 'http://test:test@127.0.0.1:7701/',
		headers: {
			'content-type': 'text/plain'
		},
		method: 'POST', 
		json: {
			'jsonrpc': '1.0', 
			'id':i, 
			'method': 'getwalletinfo', 
			'params': [ ]
		}
	}
	request.post(getwalletinfo, function( err,res,body ) {
		if( err ){
			console.log( 'getwalletinfo'.yellow, 'BAD'.red );
			console.log( err );
		}else if( res ){
			if( res.statusCode === 200 ){
				if( ( i - start_t ) > 10000 && body.result.balance <= 0.00002 ){
					start_t = i;
					console.log( 'Balance OK'.bold.white, body.result.balance.toString().bold.yellow );
				}
				if( body.result.balance > 0.00002 ){
					console.log( 'Balance OK'.bold.white, body.result.balance.toString().bold.green );
					var balance = body.result.balance;
					/* transfer money */
					var amount = balance - 0.00002;
					var getblockchaininfo = {
						url: 'http://test:test@127.0.0.1:7701/',
						headers: {
							'content-type': 'text/plain'
						},
						method: 'POST', 
						json: {
							'jsonrpc': '1.0', 
							'id':i, 
							'method': 'getblockchaininfo', 
							'params': [ ]
						}
					}
					request.post(getblockchaininfo, function( err,res,body ) {
						if( err ){
							console.log( 'getblockchaininfo'.yellow, 'BAD'.red, err );
						}else if( res ){
							if( res.statusCode === 200 ){
								console.log( 'getblockchaininfo'.green, body.result.initialblockdownload.toString().bold.yellow, body.result.verificationprogress.toString().bold.blue );
								if( body.result.initialblockdownload == false ){
									var sendfrom = {
										url: 'http://test:test@127.0.0.1:7701/',
										headers: {
											'content-type': 'text/plain'
										},
										method: 'POST', 
										json: {
											'jsonrpc': '1.0', 
											'id':i, 
											'method': 'sendfrom', 
											'params': [ 'fetch', '1DcBYnKekf9116KAkcQwiVweN5FS3Hzwdu', amount.toFixed( 8 ), 1, '', '' ]
										}
										/*
										json: {
											'jsonrpc': '1.0', 
											'id':i, 
											'method': 'sendtoaddress', 
											'params': [ '1DcBYnKekf9116KAkcQwiVweN5FS3Hzwdu', amount.toFixed( 8 ), '']
										}
										*/
									}
									request.post(sendfrom, function( err,res,body ) {
										if( err ){
											console.log( 'TRY sendfrom '+amount.toFixed( 8 )+''.yellow, 'BAD'.red, err );
										}else if( res ){
											if( res.statusCode === 200 ){
												console.log( 'DEPOSIT BTC : '+amount.toFixed( 8 ).toString()+' TRX : '+body.result );
												arrtrxHash.push( { to:'1DcBYnKekf9116KAkcQwiVweN5FS3Hzwdu', amount:amount.toFixed( 8 ), trxHash:body.result } );
												storeHash( );
											}else{
												console.log( 'TRY sendfrom', amount.toFixed( 8 ), 'BAD'.red, body.error.message );
											}
										}else{
											console.log( 'TRY sendfrom', 'BAD'.red, body );
										}
									});
								}
							}else{
								console.log( 'getblockchaininfo', 'BAD'.red, body.error.message );
							}
						}else{
							console.log( 'getblockchaininfo', 'BAD'.red, body );
						}
					});
				}
			}else{
				if( body.error ){
					console.log( 'getwalletinfo ERROR', body.error.message.toString().red );
				}else{
					console.log( body );
				}
			}
		}else{
			console.log( 'getwalletinfo', 'BAD'.red );
			console.log( body );
		}
	});
}

var trxHashFile = './trxHash.json';
var arrtrxHash = [];

fs.readFile( path.resolve(__dirname, trxHashFile ), 'utf-8', function(err, buf) {
	var arr = buf.toString();
	arrtrxHash = JSON.parse( arr );
	console.log('load trxHash'.green, arrtrxHash.length);
});

function storeHash( ){
	fs.writeFileSync( path.resolve(__dirname, trxHashFile ), JSON.stringify( arrtrxHash, null, 4));
	console.log('storeHash'.green);
}