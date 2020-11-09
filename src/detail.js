import jQuery from 'jquery';
window.$ = window.jQuery = jQuery;

import 'bootstrap';
import mixitup from 'mixitup';
import moment from 'moment';

import '../css/bootstrap.min.css';
import '../css/font-awesome.min.css';
import '../css/elegant-icons.css';
import '../css/nice-select.css';
import '../css/jquery-ui.min.css';
import '../css/owl.carousel.min.css';
import '../css/slicknav.min.css';
import '../css/style.css';

import '../js/jquery.nice-select.min.js';
import '../js/jquery-ui.min.js';
import '../js/jquery.slicknav.js';
import '../js/owl.carousel.min.js';
import '../js/main.js';

import Fortmatic from 'fortmatic';
import { default as Web3 } from 'web3';
import { default as contract } from 'truffle-contract';

import user_artifacts from '../build/contracts/User.json';
import product_artifacts from '../build/contracts/Product.json';
import escrow_artifacts from '../build/contracts/Escrow.json';

const customNodeOptions = {
  rpcUrl: 'http://127.0.0.1:7545', // your own node url
  chainId: 5777 // chainId of your own node
};

const fm = new Fortmatic('pk_test_65EC01E919DF266C', customNodeOptions);

var User = contract(user_artifacts);
var Product = contract(product_artifacts);
var Escrow = contract(escrow_artifacts);

var abiEscrow = escrow_artifacts.abi;
var addressEscrow = '0x7c3cee2368fb67d9BbF1B85e704D743ACaDc82B4';

var accounts;
var account;
var counter;
var begin;
var seller;

const urlParams = new URLSearchParams(window.location.search);
const sku = urlParams.get('sku');

const App = {
	addInvoice: function(instance, inv, prcEth, et, og, ogEth){
		var instanceUsed = instance;
		var invoice = inv;
		var idrEth = prcEth;
		var etd = et;
		var ongkir = og;
		var ongkirEth = ogEth;

		var now = moment().format("DD-MM-YYYY HH:mm:ss");
		console.log('now = ', now);
		console.log('acc = ', account);
		return instanceUsed.addInvoice(web3.fromAscii(invoice), account, web3.fromAscii(now), web3.toWei(idrEth, 'ether'), web3.fromAscii(ongkir+' '+etd), web3.toWei(ongkirEth, 'ether'), {
		// return instanceUsed.addInvoice(web3.fromAscii(invoice), account, web3.fromAscii(now), web3.toWei(1, 'ether'), web3.fromAscii(ongkir+' '+etd), web3.toWei(0, 'ether'), {
		value: web3.toWei(idrEth+ongkirEth, 'ether'),
		// value: web3.toWei(1, 'ether'),
		gasPrice: 1000000000,
		gas: 350000, 
		from: account}).then(function(success){
			if(success){
				if(!alert("Pembayaran Berhasil")){window.location.reload();}
			}else{
				alert("Penambahan Invoice Gagal");
			}
		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
	},

	getInvoice: function(instance, i){
		var self = this;
		var instanceUsed = instance;
		var escrowId = 'escrow-'+i;
		var idx = i;
		var inisiator;
		var invoice;
		var quota;
		// var skuId;
		var fix;
		var deadline;
		var split;
		var idr;
		var idrEth;
		var temp;
		var state;
		var ongkir;
		var ongkirEth;
		var etd;

		function numberWithCommas(x) {
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		function getEth(i, o){
			$.ajax({
				type: 'GET',
				url: 'http://caesar.otwsidang.com/idr.php',
				data: {amount: i},
				dataType: "json",
				success: function(data){
					console.log('idrEth = ', idrEth = parseFloat(data.data.quote.ETH.price.toFixed(8)));

					$.ajax({
						type: 'GET',
						url: 'http://caesar.otwsidang.com/idr.php',
						data: {amount: o},
						dataType: "json",
						success: function(data){
							console.log('ongkirEth = ', ongkirEth = parseFloat(data.data.quote.ETH.price.toFixed(8)));

							$('#tot2').text(idrEth+ongkirEth+' ETH');
					   },
					   error: function(jqXHR, textStatus, error){
					   		console.log(error);
					   }
					}); 

			  },
			  error: function(jqXHR, textStatus, error){
			  	console.log(error);
			  }
			}); 
		}

		return instanceUsed.getBuyerBySkuToInvoiceIndex.call(web3.fromAscii(sku), idx,0).then(function(_frst){
			User.deployed().then(function(instance){
				instance.getIndexByAddress.call(_frst).then(function(_u){
					instance.getNameByIndex.call(_u).then(function(_name){
						inisiator = web3.toUtf8(_name);
					})
				});
			});

			return instanceUsed.getInvoiceBySkuToInvoiceIndex.call(web3.fromAscii(sku), idx);
		}).then(function(_iv){
			invoice = web3.toUtf8(_iv);

			return instanceUsed.getQtyBySkuToInvoiceIndex.call(web3.fromAscii(sku), idx);
		}).then(function(_qty){
			quota = _qty.toNumber();

			return instanceUsed.getFixBuyerBySkuToInvoiceIndex.call(web3.fromAscii(sku), idx);
		}).then(function(_fx){
			fix = _fx.toNumber();

			return instanceUsed.getDeadlineBySkuToInvoiceIndex.call(web3.fromAscii(sku), idx);
		}).then(function(_dl){
			deadline = web3.toUtf8(_dl);

			return instanceUsed.getStateBySkuToInvoiceIndex.call(web3.fromAscii(sku), idx);
		}).then(function(_st){
			state = _st.toNumber();

			return instanceUsed.getIdrBySkuToInvoiceIndex.call(web3.fromAscii(sku), idx);
		}).then(function(_rp){
			idr = _rp.toNumber();

			if(fix < quota && state == 1 && moment().isSameOrBefore(moment(deadline, "DD-MM-YYYY HH:mm:ss"))){
				console.log(inisiator, fix+'/'+quota, deadline, idr, i);

				temp =	'<tr id="'+ escrowId +'">'+
                	'<td class="shoping__cart__price" id="name"></td>'+
                  '<td class="shoping__cart__price" id="slot"></td>'+
                  '<td class="shoping__cart__price" id="dl"></td>'+
                  '<td class="shoping__cart__price" id="price"></td>'+ 
                  '<td class="shoping__cart__price">'+
                  	'<button class="site-btn">Gabung</button>'+
                  '</td>'+
            		'</tr>';
    		$('tbody').append(temp);

				$('#'+escrowId).find('#name').text(inisiator);

				$('#'+escrowId).find('#slot').text(fix+' / '+quota);

				split = deadline.split(' ');
				$('#'+escrowId).find('#dl').append(split[0]+ '<br>' +split[1]);
				
				$('#'+escrowId).find('#price').text(numberWithCommas(idr)+' IDR');

    		$('#'+escrowId).find('button').click(function(){
    			$('#cekot').closest('.modal').attr('id','modal-'+ escrowId);

        	var selected_option = $('#ongkir2 option:selected');
					console.log('ongkir2 = ', ongkir = selected_option.data('value'), idx);
					console.log('etd2 = ', etd = selected_option.data('etd'), idx);
					$('#modal-'+escrowId).find('#idr2').text(numberWithCommas((parseInt(idr)+parseInt(ongkir)))+' IDR');
					getEth(idr, ongkir);

	  			$('#ongkir2').change(function(){
	  				$('#ongkir2 option').each(function() {
		  				if($(this).is(':selected')){
		  					console.log('ongkir2 = ', ongkir = $(this).data('value'), idx);
		  					console.log('etd2 = ', etd = $(this).data('etd'), idx);
		  					$('#modal-'+escrowId).find('#idr2').text(numberWithCommas((parseInt(idr)+parseInt(ongkir)))+' IDR');

		  					getEth(idr, ongkir);
		  				}
		  			});
	  			});

	  			$('#modal-'+escrowId).modal('show');

	  			$('#modal-'+escrowId).find('#pay2').click(function(){
						setTimeout(function(){
							console.log(idr, idrEth, ongkir, ongkirEth, idx);
							console.log('JUMLAH = ', parseFloat(idrEth)+parseFloat(ongkirEth));
							self.addInvoice(instanceUsed, invoice, idrEth, etd, ongkir, ongkirEth);
						},1000);					

						return false;
					});
    		});

				

			}

		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
	},

	pay: function(qty, etd, rp, price, ogk, ongkir, dl){
		var invCount;
		var quota = qty;
		var est = etd;
		var idr = rp
		var idrEth = price;
		var fee = ogk;
		var feeEth = ongkir;
		var instanceUsed;
		var date = moment();
		const batch = web3.createBatch();

		var invoice = date.format("DDMMYYYY");

		var now = date.format("DD-MM-YYYY HH:mm:ss");
		console.log('now = ', now);

		var deadline = date.add(dl,'d').format("DD-MM-YYYY HH:mm:ss");
		console.log('deadline = ', deadline);

		return Escrow.deployed().then(function(_instance){
			instanceUsed = _instance;

			return instanceUsed.getInvoiceCount.call().then(function(_count){
				console.log('invCount = ', invCount = _count.toNumber());
					
				invoice += invCount+1;
				console.log('invoice = ', invoice);

				batch.add(web3.eth.contract(abiEscrow).at(addressEscrow).createInvoice.request(web3.fromAscii(invoice), quota, idr, web3.fromAscii(deadline), web3.fromAscii(sku), seller, {
					gas: 340000,
					gasPrice: 1000000000,
					from: account
				}, (err, success) => {
					if (err) console.log('Error = ', err);
  				console.log('Success = ', success);
				}));

				batch.add(web3.eth.contract(abiEscrow).at(addressEscrow).addInvoice.request(web3.fromAscii(invoice), account, web3.fromAscii(now), web3.toWei(idrEth, 'ether'), web3.fromAscii(fee+' '+est), web3.toWei(feeEth, 'ether'), {
					value: web3.toWei(idrEth+feeEth, 'ether'),
					gasPrice: 1000000000,
					gas: 340000, 
					from: account
				}, (err, success) => {
					if (err) console.log('Error = ', err);
  				console.log('Success = ', success);
				}));

				return batch.execute();

			// 	return instanceUsed.createInvoice(web3.fromAscii(invoice), quota, idr, web3.fromAscii(deadline), web3.fromAscii(sku), seller, {
			// 		gas: 340000,
			// 		gasPrice: 1000000000,
			// 		from: account});
			// }).then(function(success){
			// 	if(success){
			// 		console.log('Success = ', success);
			// 		// return instanceUsed.addInvoice(web3.fromAscii(invoice), account, web3.fromAscii(now), web3.toWei(idrEth, 'ether'), web3.fromAscii(fee+' '+est), web3.toWei(feeEth, 'ether'), {
			// 		return instanceUsed.addInvoice(web3.fromAscii(invoice), account, web3.fromAscii(now), web3.toWei(1, 'ether'), web3.fromAscii(fee+' '+est), web3.toWei(0, 'ether'), {
			// 			// value: web3.toWei(idrEth+feeEth, 'ether'),
			// 			value: web3.toWei(1, 'ether'),
			// 			gasPrice: 1000000000,
			// 			gas: 300000, 
			// 			from: account});
			// 	}
			// 	else{
			// 		alert("Pembuatan Invoice Gagal");
			// 	}
			// }).then(function(success){
			// 	if(success){
			// 		if(!alert("Pembayaran Berhasil")){window.location.reload();}
			// 	}else{
			// 		alert("Pembayaran Gagal");
			// 	}

			// }).then(function(success){
			// 	if(!success){
			// 		if(!alert("Pembayaran Berhasil")){window.location.reload();}
			// 	} else{
			// 		alert("Pembayaran Gagal");
			// 	}
			}).then(function(){
				var observer = new MutationObserver(function(mutations) {
				    mutations.forEach(function(mutationRecord) {
				        if($('iframe').css('display')=='none'){
				        	location.reload();
				        } else{
				        	console.log('FORTMATIC MODAL SHOW');
				        }
				    });    
				});

				var target = $('iframe')[0];
				observer.observe(target, { attributes : true, attributeFilter : ['style'] });
			}).catch(function(e) {
	      // There was an error! Handle it.
	      console.log('error = ', e);
	    });

			// batch.execute();

		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });

		
	},

	getPrice: function(instance, i, j){
		var self = this;
		var instanceUsed = instance;
		var min;
		var max;
		var price;
		var priceEth;
		var temp;
		var idx = i;
		var priceIdx = j;
		var qty;
		var ongkir;
		var ongkirEth;
		var etd;

		return instanceUsed.getMinByIndex.call(idx, priceIdx).then(function(_min){
			min = _min.toNumber();

			return instanceUsed.getMaxByIndex.call(idx, priceIdx);
		}).then(function(_max){
			max = _max.toNumber();

			return instanceUsed.getPriceByIndex.call(idx, priceIdx);
		}).then(function(_price){
			price = _price.toNumber();

			if(min !== 0 && max !== 0 && price !== 0){
				console.log('min = ', min, j);
				console.log('max = ', max, j);
				console.log('price = ', price, j);

				$('input[name=qty], input[name=qty2]').attr('max',max);

				temp =	'<tr>'+
	              	'<td>'+min+'-'+max+'</td>'+
	              	'<td>=</td>'+
	               	'<td>Rp '+ numberWithCommas(price) +'</td>'+
	            	'</tr>';
	    	$('.product__details__price table').append(temp);


	    	$('.product__details__text').find('a').click(function(){
	    		qty = parseInt($('input[name=qty]').val());

	    		if(qty >= min && qty <= max){
	    			$('h4').find('span').text('('+ qty +' Orang)');

	    			$('#ongkir option').each(function() {
	    				if($(this).is(':selected')){
	    					console.log('ongkir = ', ongkir = $(this).data('value'));
	    					console.log('etd = ', etd = $(this).data('etd'));
	    					$('#ongkirP').text(numberWithCommas(ongkir)+' IDR');
	    				}
	    			});

	      		$('#pPrice').text(numberWithCommas(price)+' IDR');
	    			$('#idr').text(numberWithCommas(price+ongkir)+' IDR');

	    			$.ajax({
							type: 'GET',
							url: 'http://caesar.otwsidang.com/idr.php',
							data: {amount: price},
							dataType: "json",
							success: function(data){
								console.log('priceEth = ', priceEth = parseFloat(data.data.quote.ETH.price.toFixed(8)));

								$.ajax({
									type: 'GET',
									url: 'http://caesar.otwsidang.com/idr.php',
									data: {amount: ongkir},
									dataType: "json",
									success: function(data){
										console.log('ongkirEth = ', ongkirEth = parseFloat(data.data.quote.ETH.price.toFixed(8)));

										$('#tot').text(priceEth+ongkirEth+' ETH');

										$('#pay').click(function(){
											// if(j == 0){
												console.log('PAY = ', qty, etd, price, priceEth, ongkir, ongkirEth, $('#dl').val());
												self.pay(qty, etd, price, priceEth, ongkir, ongkirEth, $('#dl').val());
											// }
											return false;
										});

								   },
								   error: function(jqXHR, textStatus, error){
								   		console.log(error);
								   }
								}); 

						  },
						  error: function(jqXHR, textStatus, error){
						  	console.log(error);
						  }
						}); 
	    		}

	    	});
			}
      

		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });

    function numberWithCommas(x) {
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}
	},

	start: function(){
		var self = this;
		var s;
	    var idx;
	    var name;
	    var userInstance;
	    var productInstance;
	    var escrowInstance;
	    var pId;
	    var pName;
	    var pict;
	    var stock;
	    var note;
	    var desc;
	    var priceCount;
	    var from;
	    var to;

	    var invCount;
	    
	  //   window.ethereum.on('accountsChanged', function (accounts) {
	  // 		location.reload();
			// });
		    
	    web3.eth.getAccounts(function(err, accs) {
	      if (err != null) {
	        alert("There was an error fetching your accounts.");
	        return;
	      }

	      if (accs.length == 0) {
	        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
	        return;
	      }

	      accounts = accs;
	      account = accounts[0];

	      $('#login').css('display','none');
	      $('#isLogin').css('display','block');

	      $("a:contains('Deposit')").click(function(){
	        fm.user.deposit();

	        return false;
	      });

	      $("a:contains('Logout')").click(function(){
	        fm.user.logout().then(function(success){
	          if(success){
	            location.reload();
	          };
	        });

	        return false;
	      });

	      // CEK SALDO
	      web3.eth.getBalance(account, (error, balance) => {
	        if (error) throw error;
	        console.log('BALANCE = ', balance = web3.fromWei(web3.toDecimal(balance), 'ether'));
	        return $.ajax({
	          type: 'GET',
	          url: 'http://caesar.otwsidang.com/eth.php',
	          data: {amount: 1},
	          dataType: "json",
	          success: function(data){
	            $('#kurs').text('1 ETH = '+numberWithPoint(Math.round(data.data.quote.IDR.price))+' IDR');

	            $('.header__cart').find('h4').append('Saldo = '+parseFloat(balance).toFixed(4)+' ETH');

	            $('h6').append(numberWithPoint(Math.round(balance*parseFloat(data.data.quote.IDR.price)))+' IDR');
	           },
	           error: function(jqXHR, textStatus, error){
	              console.log(error);
	           }
	        });
	      });

	      var date = moment();

	      $('#sku').text(sku);
	      console.log(moment().format());

	      console.log('date = ', date.format("DD-MM-YYYY HH:mm:ss"));

	      console.log('date +2 hours = ', date.add(15,'h').format("DD-MM-YYYY HH:mm:ss"));

	      // set the provider for the each contract abstraction
	      User.setProvider(web3.currentProvider);
	      Product.setProvider(web3.currentProvider);
	      Escrow.setProvider(web3.currentProvider);

	      Product.deployed().then(function(instance){
	      	productInstance = instance;
	        return productInstance.isSeller.call(account).then(function(_seller){
	          if(_seller){
	            $(".seller").css("display","block");
	          }else{
	            $(".seller").css("display","none");
	          }

	          return productInstance.getIndexBySku.call(web3.fromAscii(sku));
	          
	        });
	      }).then(function(_index){
	      	console.log('pId = ', pId = _index.toNumber());

	      	return productInstance.getNameByIndex.call(pId);
	      }).then(function(_pName){
	      	console.log('pName = ', pName = web3.toUtf8(_pName));

	      	$('h3').text(pName);
	      	$('#pName').prepend(pName);

	      	return productInstance.getPictByIndex.call(pId);
	      }).then(function(_pict){
	      	console.log('pict = ', pict = web3.toAscii(_pict));

	      	$('.product__details__pic__item > img').attr('src','https://ipfs.io/ipfs/'+pict);

	      	return productInstance.getStockByIndex.call(pId);	
	      }).then(function(_stock){
	      	console.log('stock = ', stock = _stock.toNumber());

	      	$('#stock').text(stock);
	      	if(stock==0){
	      		$("a:contains('BELI')").removeAttr('data-target data-toggle').css({
	      			"cursor":"default",
	      			"background" : "#EEEEEE",
							"color" : "#ABABAB"
	      		});
	      	} else{
	      		$('input[name=qty]').attr('max',stock);
	      	}
	      	
	      	return productInstance.getPriceRangeCountBySku.call(web3.fromAscii(sku));
	      }).then(function(_priceCount){
	      	console.log('price count = ', priceCount = _priceCount.toNumber());

					for(let j=0; j<priceCount; j++){
						if(j!=priceCount-1){
							self.getPrice(productInstance, pId, j);
						}else{
							return self.getPrice(productInstance, pId, j);
						}
					}
	      }).then(function(){
	      	return productInstance.getDescByIndex.call(pId);
	      }).then(function(_desc){
	      	console.log('desc = ', desc = web3.toAscii(_desc));

	      	$('#tabs-1').find('p').text(desc);

	      	return productInstance.getSellerBySellerIndex(pId);
	      }).then(function(_address){
	      	console.log('seller = ', seller = _address);

					return User.deployed();
	      }).then(function(contractInstance){
	      	userInstance = contractInstance;

	      	return userInstance.getIndexByAddress.call(seller).then(function(_s){
	      		s = _s.toNumber();

	      		return userInstance.getCityByIndex(s).then(function(_from){
	      			console.log('from = ', from = _from.toNumber());

	      			return userInstance.getIndexByAddress.call(account);
	      		})
	      	}).then(function(i){
	          idx = i;

	          return userInstance.getNameByIndex.call(idx).then(function(_name){
	          	console.log('Name = ', name = web3.toAscii(_name));
							
							$('#greeting').prepend('Hai '+name);

							return userInstance.getCityByIndex(idx);
	          }).then(function(_to){
	          	console.log('to = ', to = _to.toNumber());

	          	return $.ajax({
								type: 'GET',
								url: 'http://caesar.otwsidang.com/cost.php',
								data: {
									from: from,
									to: to},
								dataType: "json",
								success: function(data){
									data.rajaongkir.results[0].costs.forEach(ogk => {
										$('#ongkir, #ongkir2').append('<option data-value="'+ ogk.cost[0].value+'" data-etd="'+ogk.cost[0].etd+'">'+ ogk.service +' - '+ numberWithCommas(ogk.cost[0].value) + ' IDR (' + ogk.cost[0].etd +' hari)</option>')
									});
							   },
							   error: function(jqXHR, textStatus, error){
							   		console.log(error);
							   }
							});
	          }).then(function(){
							return Escrow.deployed();
	          }).then(function(inst){
	          	escrowInstance = inst;

	          	$("#dl").niceSelect();

	          	$('#dl').change(function(){
	          		console.log('DEADLINE = ', $('#dl').val());
	          	});

	          	return escrowInstance.getInvoiceCountBySku.call(web3.fromAscii(sku)).then(function(_inv){
	          		console.log('invCount = ', invCount = _inv.toNumber());

	          		for(let k=0; k<invCount; k++){	  
    			        if(k!==invCount-1){
    			        	escrowInstance.getInvoiceBySkuToInvoiceIndex.call(web3.fromAscii(sku), k).then(function(_iv){
											escrowInstance.getInvoiceToBuyerCount.call(_iv).then(function(_ct){
												if(_ct.toNumber() !== 0){
													console.log('INVOICE TO BUYER COUNT = ', _ct.toNumber(), k);
													self.getInvoice(escrowInstance, k);
												}
											});
										});
    			        }else{
    			        	return escrowInstance.getInvoiceBySkuToInvoiceIndex.call(web3.fromAscii(sku), k).then(function(_iv){
											return escrowInstance.getInvoiceToBuyerCount.call(_iv).then(function(_ct){
												if(_ct.toNumber() !== 0){
													console.log('INVOICE TO BUYER COUNT = ', _ct.toNumber(), k);
													return self.getInvoice(escrowInstance, k);
												}
											});
										});
    			        }
	          		}

	          	});
	          }).then(function(){
	          	return [$(".loader").fadeOut(), $("#preloder").delay(200).fadeOut("slow")];
	          }).catch(function(e) {
		          // There was an error! Handle it.
		          console.log('error = ', e);
			      });
	        });
	      }).catch(function(e) {
	          // There was an error! Handle it.
	          console.log('error = ', e);
	      });

	    });

			function numberWithCommas(x) {
		    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
			}

      function numberWithPoint(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
	},

};

window.App = App;

window.addEventListener("load", function() {
  // // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  // if (typeof web3 !== 'undefined') {
  //   console.warn("Using web3 detected from external source.");
  //   // Use Mist/MetaMask's provider
  //   window.ethereum.enable();
  //   // window.web3 = new Web3(web3.currentProvider);
  //   window.web3 = new Web3(window.ethereum);

  //   web3.eth.getAccounts(function(err, accs) {
  //     User.setProvider(web3.currentProvider);
  //     Product.setProvider(web3.currentProvider);

  //     User.deployed().then(function(contractInstance){
  //       return contractInstance.isUser.call(accs[0]).then(function(isIndeed){
  //         if(isIndeed){
  //         	App.start();
  //         } else{
  //           window.location = "login.html";
  //         }
  //       });
  //     });
  //   });
  // } else {
  //   console.warn("No web3 detected. Please use MetaMask or Mist browser.");
  // }

  window.web3 = new Web3(fm.getProvider());

  fm.user.isLoggedIn().then(function(result){
    console.log('Login? ', result);
    if(result == true){
      web3.eth.getAccounts(function(err, accs) {
        console.log('Account = ', accs[0]);

        User.setProvider(web3.currentProvider);

        User.deployed().then(function(contractInstance){
          return contractInstance.isUser.call(accs[0]).then(function(isIndeed){
            if(isIndeed){
              App.start();
            } else{
              window.location = "login.html";
            }
          });
        });
      });
    } else{
      fm.user.login().then(() => {
          location.reload();
        });
      
      $("button:contains('Login')").click(function(){
        fm.user.login().then(() => {
          location.reload();
        });

        return false;
      });
    }
  });

});

