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
	sendWayBill: function(instance, inv, i, j, resi){
		var instanceUsed = instance;
		var id = 'invoice-'+i+'-'+j;
		var invoice = inv;
		var idx = i;
		var invId = j;
		var waybill = resi;

		return instanceUsed.confirmSent(web3.fromAscii(invoice), invId, web3.fromAscii(waybill), {gas: 200000, gasPrice: 1000000000, from: account}).then(function(success){
			if(success){
				alert("Penyimpanan Resi Berhasil");
				$('#'+id).find('input[name=resi]').attr('disabled','true');
				$('#'+id).find('button').css('display','none');
			}else{
				alert("Penyimpanan Resi Gagal");
			}
		});
	},

	getBuyer: function(instance, i, j, inv, nt){
		var self = this;
		var id = 'invoice-'+i+'-'+j;
		var instanceUsed = instance;
		var invoice = inv;
		var idx = i;
		var invId = j;
		var note = nt;
		var name;
		var wa;
		var loc;
		var prov;
		var city;
		var waybill;

		return instanceUsed.getBuyerBySellerToInvoiceIndex.call(account, idx, invId).then(function(_add){
			User.deployed().then(function(instance){
				instance.getIndexByAddress.call(_add).then(function(_u){
					return instance.getNameByIndex.call(_u).then(function(_n){
						name = web3.toUtf8(_n);
						console.log('name = ', name, idx, invId);
						return instance.getWaByIndex.call(_u);
					}).then(function(_w){
						wa = web3.toUtf8(_w);

						return instance.getLocationByIndex.call(_u);
					}).then(function(_l){
						loc = web3.toUtf8(_l);

						return instance.getProvinceByIndex.call(_u).then(function(_p){
							$.ajax({
								type: 'GET',
								url: 'http://caesar.otwsidang.com/fetch.php',
								data: {target:'province?id='+_p.toNumber()},
								dataType: "json",
								success: function(data){
									console.log('prov = ', prov = data.rajaongkir.results.province);

									return instance.getCityByIndex.call(_u).then(function(_c){
										$.ajax({
											type: 'GET',
											url: 'http://caesar.otwsidang.com/fetch.php',
											data: {target:'city?id='+_c.toNumber()+'&province='+_p.toNumber()},
											dataType: "json",
											success: function(data){
												console.log('city = ', city = data.rajaongkir.results.city_name);

												$('#'+id).find('p').append(name+'<br>'+wa+'<br>'+loc+'<br>'+city+', '+prov);

												if(note == 0){
													$('#'+id).find('button').click(function(){
														self.sendWayBill(instanceUsed, invoice, idx, invId, $('#'+id).find('input[name=resi]').val());

														return false;
													});
												}else{
													instanceUsed.getWaybillBySellerToInvoiceIndex.call(account, idx, invId).then(function(_wb){
														waybill = web3.toUtf8(_wb);
														$('#'+id).find('input[name=resi]').val(waybill).attr('disabled','true');
														$('#'+id).find('button').css('display','none');
													});
												}
									   	},
									   	error: function(jqXHR, textStatus, error){
									   		console.log(error);
										   		
								   		}
										}); 
									});
						   	},
						   	error: function(jqXHR, textStatus, error){
						   		console.log(error);
						   	}
							});
						});
					});
				});
			}).catch(function(e) {
	      // There was an error! Handle it.
	      console.log('error = ', e);
	    });
		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
	},

	getInvoice: function(instance, i, inv){
		var self = this;
		var id = "invoice-"+i;
		var instanceUsed = instance;
		var idx = i;
		var invoice = inv;
		var pName;
		var pPict;
		var quota;
		var fix;
		var deadline;
		var idr;
		var invCount;
		var temp;
		var split;
		var eth;
		var idr;
		var totEth;
		var state;
		var temp;
		var note;

		function numberWithCommas(x) {
	    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		}

		return instanceUsed.getSkuBySellerToInvoiceIndex.call(account, idx).then(function(_sk){
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

			return instanceUsed.getQtyBySellerToInvoiceIndex.call(account, idx);
		}).then(function(_qty){
			quota = _qty.toNumber();

			return instanceUsed.getFixBuyerBySellerToInvoiceIndex.call(account, idx);
		}).then(function(_fx){
			fix = _fx.toNumber();
			$('#'+id).find('#slot').text(fix+' / '+quota);

			return instanceUsed.getDeadlineBySellerToInvoiceIndex.call(account, idx);
		}).then(function(_dl){
			deadline = web3.toUtf8(_dl);
			split = deadline.split(' ');
			$('#'+id).find('#dl').append(split[0]+ '<br>' +split[1]);

			return instanceUsed.getIdrBySellerToInvoiceIndex.call(account, idx);
		}).then(function(_rp){
			idr = _rp.toNumber();
			$.ajax({
				type: 'GET',
				url: 'http://caesar.otwsidang.com/idr.php',
				data: {amount: idr},
				dataType: "json",
				success: function(data){
					console.log('eth = ', eth = parseFloat(data.data.quote.ETH.price.toFixed(8)), idx);

					$('#'+id).find('#price').append(numberWithCommas(idr)+' IDR <br> ± '+eth+' ETH');
			   },
			   error: function(jqXHR, textStatus, error){
			   		console.log(error);
			   }
			});

			if(fix !== 0){
				$.ajax({
					type: 'GET',
					url: 'http://caesar.otwsidang.com/idr.php',
					data: {amount: idr*fix},
					dataType: "json",
					success: function(data){
						console.log('totEth = ', totEth = parseFloat(data.data.quote.ETH.price.toFixed(8)), idx);

						$('#'+id).find('#tot').append(numberWithCommas(idr*fix)+' IDR <br> ± '+totEth+' ETH');
				   },
				   error: function(jqXHR, textStatus, error){
				   		console.log(error);
				   }
				}); 
			}else{
				$('#'+id).find('#tot').append('0 IDR <br> ± 0 ETH');
			}

			return instanceUsed.getStateBySellerToInvoiceIndex.call(account, idx);
		}).then(function(_st){
			state = _st.toNumber();
			console.log('STATE = ', state, idx);

			if(state == 0 || fix !== quota){
				$('#'+id).find('button').attr('disabled','true').css({
					"background" : "#EEEEEE",
					"color" : "#ABABAB"
				});
			}

			return instanceUsed.getInvoiceToBuyerCount.call(web3.fromAscii(invoice));
		}).then(function(_i){
			if(state !== 0 && fix == quota){
				console.log('invCount = ', invCount = _i.toNumber(), idx);				

        $('#'+id).find('button').click(function(){
        	$('.modal').attr('id','modal-'+ id);
        	$('#modal-'+id).modal('show');
        	if($('#modal-'+id).find('#invTarget').children().length){
						$('#modal-'+id).find('#invTarget').children().remove();
        	}

      		for(let j=0; j<_i.toNumber(); j++){
      			instanceUsed.getNoteBySellerToInvoiceIndex.call(account, idx, j).then(function(_nt){
      				note = _nt.toNumber();

      				if(note !== 3){
      					console.log(' j = ', j);
		        		let nid = 'invoice-'+i+'-'+j;
			        	if(j !== 0){ temp = '<hr>'; } else{ temp = ''; }
								temp = 	temp +	'<div class="row" id="'+ nid +'">'+
						                  		'<div class="col-lg-8">'+
						                      	'<div class="checkout__input">' +
					                          	'<p> </p>' +
					                          	'<input type="text" name="resi" placeholder="Masukkan Resi">' +
							                      '</div>' +
								                  '</div>' +
								                  '<div class="col-lg-4">' +
							                      '<button class="site-btn" style="margin-top: 123px;">Simpan</button>' +
								                  '</div>' +
								              	'</div>';
									
								$('#modal-'+id).find('#invTarget').append(temp);
								if(j!=_i.toNumber()-1){
									self.getBuyer(instanceUsed, idx, j, invoice, note);
								}else{
									return self.getBuyer(instanceUsed, idx, j, invoice, note);
								}
      				}
      			});
        	}
        });	
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
	    var escrowInstance;
	    var temp;
	    var temp2;
	    var invCount;
	    var ib;
	    
	 //    window.ethereum.on('accountsChanged', function (accounts) {
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
	        return instance.isSeller.call(account).then(function(_seller){
	          if(_seller){
	            $(".seller").css("display","block");
	          }else{
	            $(".seller").css("display","none");
	          }

	          return Escrow.deployed();
	        });
	      }).then(function(escrow){
	      	escrowInstance = escrow;

	      	return escrowInstance.getInvoiceCountBySeller.call(account).then(function(_count){
	      		console.log('COUNT = ', invCount = _count.toNumber());

	      		for(let i=0; i<invCount; i++){
 			     		escrowInstance.getInvoiceBySellerToInvoiceIndex.call(account, i).then(function(_inv){
								console.log('invoice = ', web3.toUtf8(_inv), i);

								escrowInstance.getInvoiceToBuyerCount.call(_inv).then(function(_c){
									ib = _c.toNumber();

									if(ib !== 0){
										console.log('invoice ke-'+ i, ib);
										var id = "invoice-"+i;

										temp =	'<tr id="'+ id +'">'+
						                  '<td class="shoping__cart__item">'+
						                    '<img id="img" alt="">'+
						                    '<h6></h6>'+
						                  '</td>'+
						                  '<td class="shoping__cart__price" id="slot" style="width: 25px;"> </td>'+
						                  '<td class="shoping__cart__price" id="dl"> </td>'+
						                  '<td class="shoping__cart__price" id="price"> </td>'+
						                  '<td class="shoping__cart__total" id="tot"> </td>'+
						                  '<td class="shoping__cart__price" id="act">'+
						                  	'<button class="site-btn">Resi</button>'+
						                  '</td>'+
						              	'</tr>';
						        $('tbody').append(temp);

						        if(i!=invCount-1){
						        	self.getInvoice(escrowInstance, i, web3.toUtf8(_inv));
						        }else{
						        	return self.getInvoice(escrowInstance, i, web3.toUtf8(_inv));
						        }
									}
								});
							});
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
  //     Product.setProvider(web3.currentProvider);
      
  //     User.deployed().then(function(contractInstance){
  //       return contractInstance.isUser.call(accs[0]).then(function(isIndeed){
  //         if(isIndeed){
  //         	return Product.deployed().then(function(instance){
  //         		return instance.isSeller.call(accs[0]).then(function(_seller){
  //         			if(_seller){
  //         				App.start();
  //         			}else{
  //         				window.location = "profil.html";
  //         			}
  //         		})
  //         	})
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
        Product.setProvider(web3.currentProvider);

        User.deployed().then(function(contractInstance){
          return contractInstance.isUser.call(accs[0]).then(function(isIndeed){
            if(isIndeed){
	          	return Product.deployed().then(function(instance){
	          		return instance.isSeller.call(accs[0]).then(function(_seller){
	          			if(_seller){
	          				App.start();
	          			}else{
	          				window.location = "profil.html";
	          			}
	          		})
	          	})
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
