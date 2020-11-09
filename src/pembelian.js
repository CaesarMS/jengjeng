import jQuery from 'jquery';
window.$ = window.jQuery = jQuery;

import 'bootstrap';
import mixitup from 'mixitup';

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

var accounts;
var account;

const App = {
	getDetail: function(instance, i, j, invc, q, f){
		var instanceUsed = instance;
		var id = "invoice-"+i;
		var invoice = invc;
		var idx = i;
		var invId = j;
		var quota = q;
		var fix = f;
		var buyer;
		var eth;
		var ethFee;
		var idr;
		var idrFee;
		var split;
		var note;
		var state;

		function numberWithCommas(x) {
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		return instanceUsed.getBuyerByInvoiceToBuyerIndex.call(account, idx, invId).then(function(_address){
			buyer = _address;
			console.log('BUYER = ', buyer);
			console.log('ACC = ', account);

			if(buyer.toLowerCase() === account.toLowerCase()){
				console.log('buyer = ', buyer, idx, invId);
				console.log('account = ', account, idx, invId);
				console.log('INVOICE = ', invoice, idx, invId);

				return instanceUsed.getItemPriceByBuyerToInvoiceIndex.call(account, idx, invId).then(function(_price){
					eth = web3.fromWei(_price, 'ether');
					console.log('eth = ', eth, idx, invId);

					return instanceUsed.getIdrByBuyerToInvoiceIndex.call(account, idx);
				}).then(function(_rp){
					idr = _rp.toNumber();

					return instanceUsed.getShippingFeeByBuyerToInvoiceIndex.call(account, idx, invId);
				}).then(function(_fee){
					ethFee = web3.fromWei(_fee, 'ether', idx, invId);

					return instanceUsed.getEstimateByBuyerToInvoiceIndex.call(account, idx, invId);
				}).then(function(_etd){
					split = web3.toUtf8(_etd).split(' ');
					idrFee = parseInt(split[0]);

					return instanceUsed.getStateByBuyerToInvoiceIndex.call(account, idx);
				}).then(function(_st){
					state = _st.toNumber();
					console.log('STATE = ', state, idx, invId);

					return instanceUsed.getNoteByBuyerToInvoiceIndex.call(account, idx, invId);
				}).then(function(_nt){
					note = _nt.toNumber();
					console.log('NOTE = ', note, idx, invId);

					return;
				}).then(function(){
					$('#'+id).find('#price').append(numberWithCommas(idr)+' IDR <br> ≡ '+eth+' ETH');
					$('#'+id).find('#fee').append(numberWithCommas(idrFee)+' IDR <br> ≡ '+ethFee+' ETH');
					$('#'+id).find('#tot').append(numberWithCommas(idr+idrFee)+' IDR <br> ≡ '+(parseFloat(eth)+parseFloat(ethFee))+' ETH');

					if(note == 3 || note == 2){
						$('#'+id).find('button:first-child').text('Komplain').parent().find('button').attr('disabled','true').css({
							"background" : "#EEEEEE",
							"color" : "#ABABAB"
						});
					}else if (note == 1){
						$('#'+id).find("button:contains('Diterima')").prev().text('Komplain').click(function(){
							if(confirm("Komplain? Refund: "+(parseFloat(eth))+" ETH")){
								instanceUsed.complain(web3.fromAscii(invoice), j, {gas: 200000, gasPrice: 1000000000, from: account}).then(function(success){
									if(success){
										if(!alert("Komplain Berhasil")){
											location.reload();
										}
									}else {
										alert("Komplain Gagal");
									}
								}).catch(function(e) {
							      // There was an error! Handle it.
							      console.log('error = ', e);
							    });
							}
						});

						$('#'+id).find("button:contains('Diterima')").click(function(){
							if(confirm("Sudah Menerima Barang?")){
								instanceUsed.confirmReceived(web3.fromAscii(invoice), invId, {gas: 200000, gasPrice: 1000000000, from: account}).then(function(success){
									if(success){
										if(!alert("Barang Telah Diterima")){
											location.reload();
										}
									} else{
										alert("Gagal Menyimpan");
									}
								})
							}

						});
					}else if(note == 0){
						$('#'+id).find("button:contains('Diterima')").attr('disabled','true').css({
							"background" : "#EEEEEE",
							"color" : "#ABABAB"
						});
						$('#'+id).find("button:contains('Diterima')").prev().text('Batal').click(function(){
							if(confirm("Membatalkan? Refund: "+(parseFloat(eth)+parseFloat(ethFee))+" ETH")){
								instanceUsed.aborted(web3.fromAscii(invoice), j,{gas: 200000, gasPrice: 1000000000, from: account}).then(function(success){
									if(success){
										if(!alert("Batal Berhasil")){
											location.reload();
										}
									}else {
										alert("Batal Gagal")
									}
								}).catch(function(e) {
							      // There was an error! Handle it.
							      console.log('error = ', e);
							    });
							}
						});
					}
				}).catch(function(e) {
		      // There was an error! Handle it.
		      console.log('error = ', e);
		    });
			}
		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
	},

	getInvoice: function(instance, i){
		var self = this;
		var id = "invoice-"+i;
		var instanceUsed = instance;
		var idx = i;
		var invoice;
		var pName;
		var pPict;
		var quota;
		var fix;
		var deadline;
		var idr;
		var invCount;
		var temp;
		var split;

		return instanceUsed.getInvoiceByBuyerToInvoiceIndex.call(account, idx).then(function(_inv){
			invoice = web3.toUtf8(_inv);

			return instanceUsed.getSkuByBuyerToInvoiceIndex.call(account, idx);
		}).then(function(_sk){
			Product.deployed().then(function(_instance){
				return _instance.getIndexBySku.call(_sk).then(function(_idd){
					return _instance.getNameByIndex.call(_idd.toNumber()).then(function(_name){
						pName = web3.toUtf8(_name);
						$('#'+id).find('h6').text(pName);

						return _instance.getPictByIndex.call(_idd).then(function(_pict){
							pPict = web3.toUtf8(_pict);

							return $('#'+id).find('img').attr('src','https://ipfs.io/ipfs/'+pPict);
						});
					});
				});
			});

			return instanceUsed.getQtyByBuyerToInvoiceIndex.call(account, idx);
		}).then(function(_qty){
			quota = _qty.toNumber();

			return instanceUsed.getFixBuyerByBuyerToInvoiceIndex.call(account, idx);
		}).then(function(_fx){
			fix = _fx.toNumber();
			$('#'+id).find('#slot').text(fix+' / '+quota);

			return instanceUsed.getDeadlineByBuyerToInvoiceIndex.call(account, idx);
		}).then(function(_dl){
			deadline = web3.toUtf8(_dl);
			split = deadline.split(' ');
			$('#'+id).find('#dl').append(split[0]+ '<br>' +split[1]);

			return instanceUsed.getInvoiceToBuyerCount.call(web3.fromAscii(invoice));
		}).then(function(_count){
			invCount = _count.toNumber();
			console.log('INVCOUNT EHEHE = ', invCount, idx);
			for(var j=0; j<invCount; j++){
				console.log('LOOPS J = ', invCount, j, idx);
				if(j!=invCount-1){
					self.getDetail(instanceUsed, idx, j, invoice, quota, fix);
				}else{
					return self.getDetail(instanceUsed, idx, j, invoice, quota, fix);
				}
			}

		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
	},

	start: function(){
		var self = this;
	    var idx;
	    var name;
	    var userInstance;
	    var productInstance;
	    var escrowInstance;
	    var temp;

	    
	  //   window.ethereum.on('accountsChanged', function (accounts) {
			//   location.reload();
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

	            $('.header__cart').find('h6').append(numberWithPoint(Math.round(balance*parseFloat(data.data.quote.IDR.price)))+' IDR');
	           },
	           error: function(jqXHR, textStatus, error){
	              console.log(error);
	           }
	        });
	      });

	      $("#address").text(account);

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

	          return Escrow.deployed();
	          
	        }).catch(function(e) {
	          // There was an error! Handle it.
	          console.log('error = ', e);
		      });
	      }).then(function(escrow){
	      	escrowInstance = escrow;

	      	return escrowInstance.getInvoiceCountByBuyer(account).then(function(_count){
	      		console.log('COUNT = ', _count.toNumber());
	      		for(var i=0; i<_count.toNumber(); i++){
	      			var id = "invoice-"+i;

							temp =	'<tr id="'+ id +'">'+
			                  '<td class="shoping__cart__item">'+
			                    '<img id="img" alt="">'+
			                    '<h6></h6>'+
			                  '</td>'+
			                  '<td class="shoping__cart__price" id="slot" style="width: 25px;"> </td>'+
			                  '<td class="shoping__cart__price" id="dl"> </td>'+
			                  '<td class="shoping__cart__price" id="price"> </td>'+
			                  '<td class="shoping__cart__price" id="fee"> </td>'+
			                  '<td class="shoping__cart__total" id="tot"> </td>'+
			                  '<td class="shoping__cart__price" id="act">'+
			                  	'<button class="site-btn" style="background: #DC3545; width: 150px;"></button>'+
			                  	'<button class="site-btn" style="width: 150px; margin-top: 10px;">Diterima</button>'+
			                  '</td>'+
			              	'</tr>';
			        $('tbody').append(temp);

			        if(i!=_count.toNumber()-1){
			        	self.getInvoice(escrowInstance, i);
			        }else{
			        	return self.getInvoice(escrowInstance, i);
			        }
	      		}
	      	}).then(function(){
	      		return User.deployed();
	      	}).catch(function(e) {
	          // There was an error! Handle it.
	          console.log('error = ', e);
		      });
	      }).then(function(contractInstance){
	      	userInstance = contractInstance;

	        return userInstance.getIndexByAddress.call(account).then(function(i){
	          idx = i;

	          return userInstance.getNameByIndex.call(idx).then(function(_name){
	          	console.log('Name = ', name = web3.toAscii(_name));
	            
	          	return $('#greeting').prepend('Hai '+name);
	          });
	        });
	      }).then(function(){
	        return [$(".loader").fadeOut(),$("#preloder").delay(200).fadeOut("slow")];
	      }).catch(function(e) {
	          // There was an error! Handle it.
	          console.log('error = ', e);
	      });

	      function numberWithPoint(x) {
		      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		    }
	      
	    });
	}
};

window.App = App;

window.addEventListener("load", function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  // if (typeof web3 !== 'undefined') {
  //   console.warn("Using web3 detected from external source.");
  //   // Use Mist/MetaMask's provider
  //   window.ethereum.enable();
  //   // window.web3 = new Web3(web3.currentProvider);
  //   window.web3 = new Web3(window.ethereum);


  //   web3.eth.getAccounts(function(err, accs) {
  //     User.setProvider(web3.currentProvider);
      
  //     User.deployed().then(function(contractInstance){
  //       return contractInstance.isUser.call(accs[0]).then(function(isIndeed){
  //         if(isIndeed){
  //           App.start();
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
