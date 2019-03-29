"use strict";

var request = require('request');

/*************** ETHERIUM ***********************/
var Wallet = require('ethereumjs-wallet');
var EthUtil = require('ethereumjs-util');

// Get a wallet instance from a private key
const privateKeyBuffer = EthUtil.toBuffer('0000000000000000000000000000000000000000000000000000000000000000 ');
const wallet = Wallet.fromPrivateKey(privateKeyBuffer);
// Get a public key
const publicKey = wallet.getPublicKeyString();
console.log('ETH address', publicKey);

/*************** BITCOIN ************************/

/* 1Gokm82v6DmtwKEB8AiVhm82hyFSsEvBDK 
L1uyy5qTuGrVXrmrsvHWHgVzW9kKdrp27wBC7Vs6nZDTF2BRUVwy 17XBj6iFEsf8kzDMGQk5ghZipxX49VXuaV
5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss 1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV 
L1Kzcyy88LyckShYdvoLFg1FYpB5ce1JmTYtieHrhkN65GhVoq73 17hFoVScNKVDfDTT6vVhjYwvCu6iDEiXC4
5Kb8kLf9zgWQnogidDA76MzPL6TsZZY36hWXMssSzNydYXYB9KF
*/
/*
var bitcoin = require('bitcoinjs-lib');

var keyPair = bitcoin.ECPair.fromWIF('L1uyy5qTuGrVXrmrsvHWHgVzW9kKdrp27wBC7Vs6nZDTF2BRUVwy');
const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });
//The above should output: 17XBj6iFEsf8kzDMGQk5ghZipxX49VXuaV
console.log('address', address );
var tx = new bitcoin.TransactionBuilder();
//previous TrxHash from this private key
tx.addInput('e52c05c4b79e435f723779dee204c4015c0c72f7f88765d28a2c7415b61a4ac0', 0);
tx.addOutput('12mcCxBPwFXRRUuH5rN77BQdHyohTEtbWB', 360000);
tx.sign(0, keyPair);
var finalTX = tx.build().toHex();
console.log('finalTX', finalTX);

txPush( finalTX );
*/
/*
https://live.blockcypher.com/btc/pushtx/
https://live.blockcypher.com/btc/decodetx/
*/

async function txPush( trxHash ){
	var push = await pushTX( trxHash );
	console.log( 'pushTX', push );
}

//push transaction
function pushTX( txHash ){
	return new Promise(resolve => {
		request({
		url: "https://api.blockcypher.com/v1/btc/main/txs/push",
		method: "POST",
		json: true,
		headers: {"content-type": "application/json"},
		body: { tx: txHash }
		},function(err, response, body){
			if(err){ 
				return resolve( false );
			}else{
				var result = JSON.stringify(body);
				if( result.tx ){
					console.log('tx hash', result.tx.hash);
					return resolve( result.tx.hash );
				}else if( result.error ){
					console.log('error', result.error);
					return resolve( false );
				}else{
					console.log('error', result);
					return resolve( false );
				}
			};                
		});
	});
};