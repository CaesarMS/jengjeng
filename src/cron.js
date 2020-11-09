import jQuery from 'jquery';

const cron = require("node-cron");
const express = require("express");

var Tx = require('ethereumjs-tx').Transaction;
var privateKey = new Buffer('b61a5c11cb8cf053b669b7be4693d8750ac46dffb4e798a096f7b53a4812f65e','hex');
const app = express();

import moment from 'moment';
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract';

import escrow_artifacts from '../build/contracts/Escrow.json';

var Escrow = contract(escrow_artifacts);
var abiEscrow = escrow_artifacts.abi;
var addressEscrow = '0x7c3cee2368fb67d9BbF1B85e704D743ACaDc82B4';

var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));

Escrow.setProvider(web3.currentProvider);

cron.schedule("* * * * *", function(){
	var instance;
	var totInv;
	var invoice;
	var deadline;
	var quota;
	var state;
	var fix;

	var totByr;
	var buyer;
	var note;
	var payment;
	var est;
	var lastEst;

	var split;
	var split2;

	var flVar;
	var abtVar;
	var cnfVar;

	var nonc;

	console.log('running a task every minute');

  Escrow.deployed().then(function(_contractInstance){
  	instance = _contractInstance;

  	instance.getInvoiceCount.call().then(function(_n){
  		totInv = _n.toNumber();

  		for(let i=0, p = Promise.resolve(); i<totInv; i++){
  			p = p.then(_ => new Promise(res => {
	  			instance.getInvoiceByInvoiceIndex.call(i).then(function(_inv){
	  				invoice = web3.toUtf8(_inv);

	  				return instance.getQtyByInvoiceIndex.call(i);
	  			}).then(function(_qty){
	  				quota = _qty.toNumber();

	  				return instance.getFixBuyerByInvoiceIndex.call(i);
	  			}).then(function(_fx){
	  				fix = _fx.toNumber();

	  				return instance.getStateByInvoiceIndex.call(i);
	  			}).then(function(_st){
	  				state = _st.toNumber();

	  				return instance.getDeadlineByInvoiceIndex.call(i);
	  			}).then(function(_dl){
	  				deadline = web3.toUtf8(_dl);

	  				return instance.getInvoiceToBuyerCount.call(web3.fromAscii(invoice));
	  			}).then(function(_tb){
	  				totByr = _tb.toNumber();

	  				nonc = web3.eth.getTransactionCount('0xF3871FCDDAf029E3497655E94F122475B92a5EAe', 'pending');

	  				// FAILED CONTROLLER BEGIN
	  				if((fix < quota && state == 1 && moment().isAfter(moment(deadline, "DD-MM-YYYY HH:mm:ss"))) || (fix == 0 && state == 1)){
	  					console.log(invoice, fix+"<"+quota, deadline, state);

	  					flVar = web3.eth.contract(abiEscrow).at(addressEscrow).failed.getData(web3.fromAscii(invoice));  					

	  					var rawFlTx = new Tx({
	  						nonce: nonc,
	  						to: addressEscrow,
								gasPrice: 1000000000,
								gas: 200000, 
								from: '0xF3871FCDDAf029E3497655E94F122475B92a5EAe',
								data: flVar
	  					});
	  					rawFlTx.sign(privateKey);
	  					var serializedFlTx = rawFlTx.serialize();

	  					web3.eth.sendRawTransaction('0x' + serializedFlTx.toString('hex'), function(err, hash) {
						 		if (!err){
					   			console.log("Tx Failed = ", hash, i);
						 		} else{
						 			console.log(err);
						 		}
					   	});
	  					
	  				}
						// FAILED CONTROLLER END  				

						if(totByr>0){
							for(let j=0, q = Promise.resolve(); j<totByr; j++){
								q = q.then(_ => new Promise(resolve => {
									instance.getStateByInvoiceIndex.call(i).then(function(_stt){
										state = _stt.toNumber();

										return instance.getBuyerByInvoiceIndex.call(i, j);
									}).then(function(_by){
			  						buyer = _by;

			  						return instance.getNoteByInvoiceIndex.call(i, j);
			  					}).then(function(_nt){
			  						note = _nt.toNumber();;

			  						return instance.getPaymentDateTimeByInvoiceIndex.call(i, j);
			  					}).then(function(_py){
			  						payment = web3.toUtf8(_py);

			  						return instance.getEstimateByInvoiceIndex.call(i, j);
			  					}).then(function(_etd){
			  						split = web3.toUtf8(_etd).split(' ');
										est = parseInt(split[1]);

										split2 = parseInt(split[1].split('-'));
										lastEst = moment(payment, "DD-MM-YYYY HH:mm:ss").add(split2[1],'d').format("DD-MM-YYYY HH:mm:ss");

				  					nonc = web3.eth.getTransactionCount('0xF3871FCDDAf029E3497655E94F122475B92a5EAe', 'pending');

										// RECEIVED CONTROLLER BEGIN
										if(state == 1 && note == 1 && moment().isAfter(moment(lastEst, "DD-MM-YYYY HH:mm:ss"))){
											console.log(buyer, payment, lastEst);

											cnfVar = web3.eth.contract(abiEscrow).at(addressEscrow).confirmReceived.getData(web3.fromAscii(invoice), j);

					  					var rawCnfTx = new Tx({
					  						nonce: nonc,
					  						to: addressEscrow,
												gasPrice: 1000000000,
												gas: 200000, 
												from: '0xF3871FCDDAf029E3497655E94F122475B92a5EAe',
												data: cnfVar
					  					});
					  					rawCnfTx.sign(privateKey);
					  					var serializedCnfTx = rawCnfTx.serialize();

					  					return web3.eth.sendRawTransaction('0x' + serializedCnfTx.toString('hex'), function(err, hash) {
										 		if(err) throw err;
										 		console.log("Tx Confirm = ", hash, i, j);
										 		if(j == totByr-1){
								   				res();
								   			} else{
								   				resolve();
								   			}
											});
											// RECEIVED CONTROLLER END
											
											// ABORT CONTROLLER BEGIN
										} else if(fix < quota && state == 0 && note == 0 && moment().isAfter(moment(deadline, "DD-MM-YYYY HH:mm:ss"))){
					  					abtVar = web3.eth.contract(abiEscrow).at(addressEscrow).aborted.getData(web3.fromAscii(invoice), j);

					  					var rawAbtTx = new Tx({
					  						nonce: nonc,
					  						to: addressEscrow,
												gasPrice: 1000000000,
												gas: 200000, 
												from: '0xF3871FCDDAf029E3497655E94F122475B92a5EAe',
												data: abtVar
					  					});
					  					rawAbtTx.sign(privateKey);
					  					var serializedAbtTx = rawAbtTx.serialize();

					  					return web3.eth.sendRawTransaction('0x' + serializedAbtTx.toString('hex'), function(err, hash) {
										 		if(err) throw err;
										 		console.log("Tx Abort = ", hash, i, j);
										 		if(j == totByr-1){
								   				res();
								   			} else{
								   				resolve();
								   			}
											});
											// ABORT CONTROLLER END
					  				} else{
					  					if(j == totByr-1){
							   				res();
							   			} else{
							   				resolve();
							   			}
					  				}
			  					}).catch(function(e) {
							      // There was an error! Handle it.
							      console.log('error = ', e, i, j);
							    });
								}));
							}
						} else{
							res();
						}
						
	  			});
		    }));
  		}
  	}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e, i);
    });
  }).catch(function(e) {
    // There was an error! Handle it.
    console.log('error = ', e);
  });

});

app.listen(3128);