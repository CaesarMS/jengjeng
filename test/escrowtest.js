var Escrow = artifacts.require("./Escrow.sol");
var Product = artifacts.require("./Product.sol");
var User = artifacts.require("./User.sol");

var escrow_artifacts = require('../build/contracts/Escrow.json');
var abiEscrow = escrow_artifacts.abi;
var addressEscrow;

var Tx = require('ethereumjs-tx').Transaction;
var privateKey = new Buffer('b61a5c11cb8cf053b669b7be4693d8750ac46dffb4e798a096f7b53a4812f65e','hex');

const assert = require('assert');
const chai = require('chai');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));

contract("All Contract", function(accounts){
	var person = accounts[0];
	var person2 = accounts[1];
	var person3 = accounts[2];
	var person4 = accounts[3];
	var userInstance;
	var productInstance;
	var escrowInstance;

	let catchRevert = require("./exception.js").catchRevert;

	before(async () => {
	  module.exports = await function(deployer, network) {
			if (network === 'development') {
				deployer.deploy(User).then(() => {
			    return deployer.deploy(Product).then(() => {
			      return deployer.deploy(Escrow, User.address, Product.address).then(()=>{
			        deployer.link(User, Escrow);
			        deployer.link(Product, Escrow);

			        addressEscrow = Escrow.address;
			      });
			    });
			  });
			}
		};

		await User.deployed().then(function(instance){
			userInstance = instance;
			
			return Product.deployed();
		}).then(function(instance2){
			productInstance = instance2;
			
			return Escrow.deployed();
		}).then(function(instance3){
			return escrowInstance = instance3;
		});
	});

	it("Should create a new user", () => {
		let name = web3.fromAscii("Arta");
		let location = web3.fromAscii("Ploso");
		let city = 209;
		let prov = 10;
		let wa = web3.fromAscii("08123456789");

		return userInstance.createUser(person, name, location, city, prov, wa, {gas: 200000, gasPrice: 1000000000, from: person}).then(function(res){
			return chai.assert.isOk(res);
		});
	});

	it("Name should same", () => {
		let expectedName = "Arta";

		return userInstance.getIndexByAddress.call(person).then(function(idx){
			return userInstance.getNameByIndex.call(idx);
		}).then(function(nm){
			return assert.equal(expectedName, web3.toUtf8(nm), "Name wasn't properly added");
		});
	});

	it("Should insert a new Product and activated it", () => {
		let sku = web3.fromAscii("AAA111");
		let name = web3.fromAscii("Produk A");
		let desc = web3.fromAscii("Produk A adalah huruf A");
		let pict = web3.fromAscii("abcdefg");
		let stock = 100;

		let min = [1, 4, 7];
		let max = [3, 6, 10];
		let price = [100000, 80000, 60000];

		let note = 1;

		return productInstance.insertProduct(person, sku, name, desc, pict, stock, {gas: 300000, gasPrice: 1000000000, from: person}).then(function(res){
			chai.assert.isOk(res);
			if(res){
				for(let i=0, p = Promise.resolve(); i<min.length; i++){
					p = p.then(_ => new Promise(resolve => {
						productInstance.createPrice(person, sku, min[i], max[i], price[i], {gas: 200000, gasPrice: 1000000000, from: person}).then(function(ress){
							if(ress){
								chai.assert.isOk(ress);
								resolve();
							}
						});
					}));
				}
			}
		}).then(function(){
				return productInstance.updateNote(person, sku, note, {gas: 200000, gasPrice: 1000000000, from: person});
		}).then(function(res3){
			return chai.assert.isOk(res3);
		});
	});

	it("Product SKU should same", () => {
		let expectedSku = "AAA111";

		return productInstance.getSkuByIndex.call(0).then(function(_sku){
			return assert.equal(expectedSku, web3.toUtf8(_sku), "Sku wasn't properly added");
		});
	});

	it("Should create a new group buying", () => {
		let invoice = web3.fromAscii("190920201");
		let quota = 2;
		let idr = 100000;
		let deadline = web3.fromAscii("23-09-2020 10:00:00");
		let sku = web3.fromAscii("AAA111");

		return escrowInstance.createInvoice(invoice, quota, idr, deadline, sku, person, {
			gas: 340000,
			gasPrice: 1000000000,
			from: person2
		}).then(function(success){
			return chai.assert.isOk(success);

		});

	});

	it("Should failed create a new group buying due to lack of stock", () => {
		let invoice = web3.fromAscii("190920202");
		let quota = 100;
		let idr = 100000;
		let deadline = web3.fromAscii("23-09-2020 10:00:00");
		let sku = web3.fromAscii("AAA111");

		return escrowInstance.createInvoice(invoice, quota, idr, deadline, sku, person, {
			gas: 340000,
			gasPrice: 1000000000,
			from: person2
		}).then(function(res){
			return chai.assert.fail(res);
		}).catch(function(err){
			return chai.assert.isOk(err);
		});

	});

	it("Should add first buyer into group buying", () => {
		let invoice = web3.fromAscii("190920201");

		let now = web3.fromAscii("19-09-2020 10:00:00");
		let idrEth = web3.toWei(0.01747, 'ether');
		let feeEth = web3.toWei(0.00524169, 'ether');
		let totalEth = 0.01747+0.00524169;
		let fee = 30000;
		let est = "2-3";

		return escrowInstance.addInvoice(invoice, person2, now, idrEth, web3.fromAscii(fee+' '+est), feeEth, {
			value: web3.toWei(totalEth, 'ether'),
			gasPrice: 1000000000,
			gas: 340000, 
			from: person2
		}).then(function(result){
				return chai.assert.isOk(result);
		});

	});

	it("Should failed when add second buyer into group buying due to lack of balance", () => {
		let invoice = web3.fromAscii("190920201");

		let now = web3.fromAscii("20-09-2020 10:00:00");
		let idrEth = web3.toWei(50, 'ether');
		let feeEth = web3.toWei(50, 'ether');
		let totalEth = 100;
		let fee = 10000;
		let est = "1-2";

		return escrowInstance.addInvoice(invoice, person3, now, idrEth, web3.fromAscii(fee+' '+est), feeEth, {
			value: web3.toWei(totalEth, 'ether'),
			gasPrice: 1000000000,
			gas: 340000, 
			from: person3
		}).then(function(result){
			return chai.assert.fail(result);
		}).catch(function(error){
			return chai.assert.isOk(error);
		});
	});

	it("Should failed send and set waybill product due to lack of buyer", () => {
		let invoice = web3.fromAscii("190920201");
		let waybill = web3.fromAscii('abc123');

		escrowInstance.confirmSent(invoice, 0, waybill, {gas: 200000, gasPrice: 1000000000, from: person}).then(function(res){
			return chai.assert.fail(res);
		}).catch(function(error){
			return chai.assert.isOk(error);
		});

	});

	it("Should add second buyer into group buying", () => {
		let invoice = web3.fromAscii("190920201");

		let now = web3.fromAscii("20-09-2020 10:00:00");
		let idrEth = web3.toWei(0.01747, 'ether');
		let feeEth = web3.toWei(0.0018, 'ether');
		let totalEth = 0.01747+0.0018;
		let fee = 10000;
		let est = "1-2";

		return escrowInstance.addInvoice(invoice, person3, now, idrEth, web3.fromAscii(fee+' '+est), feeEth, {
			value: web3.toWei(totalEth, 'ether'),
			gasPrice: 1000000000,
			gas: 340000, 
			from: person3
		}).then(function(result){
			if(result){
				return chai.assert.isOk(result);
			}
		});
	});

	it("Should failed when add third buyer into group buying due to lack of buyer slot", () => {
		let invoice = web3.fromAscii("190920201");

		let now = web3.fromAscii("20-09-2020 10:00:00");
		let idrEth = web3.toWei(0.01747, 'ether');
		let feeEth = web3.toWei(0.0018, 'ether');
		let totalEth = 0.01747+0.0018;
		let fee = 10000;
		let est = "1-2";

		return escrowInstance.addInvoice(invoice, person4, now, idrEth, web3.fromAscii(fee+' '+est), feeEth, {
			value: web3.toWei(totalEth, 'ether'),
			gasPrice: 1000000000,
			gas: 340000, 
			from: person4
		}).then(function(result){
			return chai.assert.fail(result);
		}).catch(function(error){
			return chai.assert.isOk(error);
		});
	});

	it("Payment Datetime should same", () => {
		let expectedPayment = "20-09-2020 10:00:00";

		return escrowInstance.getPaymentDateTimeByInvoiceIndex.call(0, 1).then(function(result){
			return assert.equal(expectedPayment, web3.toUtf8(result), "Payment Datetime wasn't properly added");
		});

	});

	it("Buyer 1 should cancel the transaction", () => {
		let invoice = web3.fromAscii("190920201");
		let index = 0;

		return escrowInstance.aborted(invoice, index, {gas: 200000, gasPrice: 1000000000, from: person2}).then(function(result){
			return chai.assert.isOk(result);
		});

	});

	it("Fix Buyer Should just 1", () => {
		return escrowInstance.getFixBuyerByInvoiceIndex.call(0).then(function(result){
			return assert.equal(1, result.toNumber(), "Fix Buyer wasn't properly reduced");
		});

	});

	it("Should add one buyer again into group buying", () => {
		let invoice = web3.fromAscii("190920201");

		let now = web3.fromAscii("21-09-2020 10:00:00");
		let idrEth = web3.toWei(0.01747, 'ether');
		let feeEth = web3.toWei(0.00524169, 'ether');
		let totalEth = 0.01747+0.00524169;
		let fee = 30000;
		let est = "2-3";

		return escrowInstance.addInvoice(invoice, person2, now, idrEth, web3.fromAscii(fee+' '+est), feeEth, {
			value: web3.toWei(totalEth, 'ether'),
			gasPrice: 1000000000,
			gas: 340000, 
			from: person2
		}).then(function(result){
				return chai.assert.isOk(result);
		});

	});

	it("Buyer 2 failed proposed complain due to product hasn't arrived", () => {
		let invoice = web3.fromAscii("190920201");
		let index = 1;

		return escrowInstance.complain(invoice, index, {gas: 200000, gasPrice: 1000000000, from: person3}).then(function(success){
			return chai.assert.fail(success);
		}).catch(function(err){
			return chai.assert.isOk(err);
		});
	});

	it("Should send and set waybill product", () => {
		let invoice = web3.fromAscii("190920201");
		let waybill = [web3.fromAscii('abc123'), web3.fromAscii('def456')];

		escrowInstance.confirmSent(invoice, 1, waybill[0], {gas: 200000, gasPrice: 1000000000, from: person}).then(function(res){
			chai.assert.isOk(res);
		});

		escrowInstance.confirmSent(invoice, 2, waybill[1], {gas: 200000, gasPrice: 1000000000, from: person}).then(function(ress){
			chai.assert.isOk(ress);
		});

	});

	it("Should failed send and set waybill product due to Seller has sent product", () => {
		let invoice = web3.fromAscii("190920201");
		let waybill = web3.fromAscii('abc123');

		escrowInstance.confirmSent(invoice, 1, waybill, {gas: 200000, gasPrice: 1000000000, from: person}).then(function(res){
			chai.assert.fail(res);
		}).catch(function(err){
			chai.assert.isOk(err);
		});

	});

	it("Buyer 2 should failed cancel the transaction due to Seller has sent product", () => {
		let invoice = web3.fromAscii("190920201");
		let index = 0;

		return escrowInstance.aborted(invoice, index, {gas: 200000, gasPrice: 1000000000, from: person3}).then(function(result){
			return chai.assert.fail(result);
		}).catch(function(err){
			return chai.assert.isOk(err);
		});

	});

	it("Waybill should same", () => {
		let expectedWaybill = "abc123";

		return escrowInstance.getWaybillByInvoiceIndex.call(0, 1).then(function(_waybill){
			return assert.equal(expectedWaybill, web3.toUtf8(_waybill), "Waybill wasn't properly added");
		});

	});

	it("Buyer 2 proposed complain", () => {
		let invoice = web3.fromAscii("190920201");
		let index = 1;

		return escrowInstance.complain(invoice, index, {gas: 200000, gasPrice: 1000000000, from: person3}).then(function(success){
			return chai.assert.isOk(success);
		});
	});

	it("Buyer 2 failed confirm the product due to Buyer 2 has proposed complain", () => {
		let invoice = web3.fromAscii("190920201");
		let index = 1;

		return escrowInstance.confirmReceived(invoice, index, {gas: 200000, gasPrice: 1000000000, from: person3}).then(function(success){
			return chai.assert.fail(success);
		}).catch(function(err){
			return chai.assert.isOk(err);
		});
	});

	it("Buyer 3 confirm the product", () => {
		let invoice = web3.fromAscii("190920201");
		let index = 2;

		return escrowInstance.confirmReceived(invoice, index, {gas: 200000, gasPrice: 1000000000, from: person2}).then(function(success){
			return chai.assert.isOk(success);
		});
	});

});