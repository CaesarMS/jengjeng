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
	start: function(){
		var self = this;
	    var idx;
	    var name;
	    var wa;
	    var loc;
	    var city;
	    var cityId;
	    var prov;
	    var provId;
	    var prov_id;
	    var userInstance;
	    
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

	          return User.deployed();
	        });
	      }).then(function(contractInstance){
	      	userInstance = contractInstance;

	        return userInstance.getIndexByAddress.call(account).then(function(i){
	          idx = i;

	          return userInstance.getNameByIndex.call(idx).then(function(_name){
	            console.log('Name = ', name = web3.toAscii(_name));
	            $('#greeting').prepend('Hai '+name);
	          	$('#name').val(name);

	            return userInstance.getLocationByIndex.call(idx);
	          }).then(function(_loc){
	          	console.log('loc = ', loc = web3.toAscii(_loc));
	      			$('#loc').val(loc);

	      			return userInstance.getProvinceByIndex.call(idx);
	          }).then(function(_prov){
	          	prov_id = _prov;
  			   		$.ajax({
						type: 'GET',
						url: 'http://caesar.otwsidang.com/fetch.php',
						data: {target:'province?id='+prov_id},
						dataType: "json",
						success: function(data){
							console.log('prov = ', prov = data.rajaongkir.results.province);
						$('#prov').val(prov);
					   },
					   error: function(jqXHR, textStatus, error){
					   		console.log(error);
					   }
					}); 

	      			return userInstance.getCityByIndex.call(idx);
	          }).then(function(_city){
	          	$.ajax({
								type: 'GET',
								url: 'http://caesar.otwsidang.com/fetch.php',
								data: {target:'city?id='+_city+'&province='+prov_id},
								dataType: "json",
								success: function(data){
									console.log('city = ', city = data.rajaongkir.results.city_name);
									if(typeof city !== 'undefined'){
										$('#city').val(city);
									}else{
										$('#city').val("Kota/Kabupaten Tidak Sesuai dengan Provinsi");
									}
							   },
							   error: function(jqXHR, textStatus, error){
							   		console.log(error);
							   		
							   }
							}); 

	      			return userInstance.getWaByIndex.call(idx);
	          }).then(function(_wa){
	          	console.log('wa = ', wa = web3.toAscii(_wa));
	      			return $('#wa').val(wa);
	          });
	        });
	      }).then(function(){
	        return [$(".loader").fadeOut(),$("#preloder").delay(200).fadeOut("slow")];
	      }).catch(function(e) {
          // There was an error! Handle it.
          console.log('error = ', e);
	      });

	      /*-------------------------------------------------------------
				  Name
				--------------------------------------------------------------*/

	      var changeName = $('#nameU').click(function(){
					$('#name').val('');
	      	$('#nameU').css("display","none");
					$('#nameO').css("display","block");
					$('#name').removeAttr('disabled');

	      	return false;
	      });

    		var cancelName = $('#nameC').click(function(){
					$('#name').attr("disabled","true");
					$('#name').val(name);
					$('#nameU').css("display","block");
					$('#nameO').css("display","none");

					return false;
				});

				var saveName = $('#nameS').click(function(){
					if ($('#name').val() !== '') {
						userInstance.updateName(account, web3.fromAscii($("input[name=name]").val()), {gas: 200000, gasPrice: 1000000000, from: account})
						.then(function(success){
							if(success){
								location.reload();
							}else{
								alert("Penyimpanan Gagal"); 
								console.log("Penyimpanan Gagal");
							}
						}).catch(function(e) {
			    		// There was an error! Handle it.
			    		console.log('error = ', e);
			    	});
					}else {
						alert("Nama Tidak Boleh Kosong");
					}

					return false;
				});

				/*-------------------------------------------------------------
				  Location
				--------------------------------------------------------------*/

				var changeLoc = $('#locU').click(function(){
					$('#loc').val('');
	      	$('#locU').css("display","none");
					$('#locO').css("display","block");
					$('#loc').removeAttr('disabled');
	      	
	      	return false;
	      });

    		var cancelLoc = $('#locC').click(function(){
					$('#loc').attr("disabled","true");
					$('#loc').val(loc);
					$('#locU').css("display","block");
					$('#locO').css("display","none");

					return false;
				});

				var saveLoc = $('#locS').click(function(){
					if ($('#loc').val() !== '') {
						userInstance.updateLocation(account, web3.fromAscii($("input[name=loc]").val()), {gas: 200000, gasPrice: 1000000000, from: account})
						.then(function(success){
							if(success){
								location.reload();
							}else{
								alert("Penyimpanan Gagal"); 
								console.log("Penyimpanan Gagal");
							}
						}).catch(function(e) {
			    		// There was an error! Handle it.
			    		console.log('error = ', e);
			    	});
					}else{
						alert("Alamat Tidak Boleh Kosong");
					}
					
					return false;
				});

    		/*-------------------------------------------------------------
				  Province
				--------------------------------------------------------------*/

				var changeProv = $('#provU').click(function(){
					$('#prov').val('');
	      	$('#provU').css("display","none");
					$('#provO').css("display","block");
					$('#prov').removeAttr('disabled');

	      	return false;
	      });

    		var cancelProv = $('#provC').click(function(){
					$('#prov').attr("disabled","true");
					$('#prov').val(prov);
					$('#provU').css("display","block");
					$('#provO').css("display","none");

					return false;
				});

    		$.ajax({
					type: 'GET',
					url: 'http://caesar.otwsidang.com/fetch.php',
					data: {target:'province'},
					dataType: "json",
					success: function(data){
						var putt = $("#provlist");
						data.rajaongkir.results.forEach(prov => {
							putt.append('<option data-prov="'+ prov.province_id +'" value="'+ prov.province +'"></option>');
				   		});

						var plist = $("#provlist > option");
						$("input[name=province]").change(e => {
							try{
								provId = Array.from(plist).find(pl => pl.value === e.target.value);
								provId = provId.dataset.prov;
							}catch(err){
								provId = "Province Not Found ("+err+")";
							}
							console.log(provId);
						});
				   },
				   error: function(jqXHR, textStatus, error){
				   		console.log(error);
				   }
				}); 

				var saveProv = $('#provS').click(function(){
					if ($('#prov').val() !== '') {
						userInstance.updateProvince(account, provId, {gas: 200000, gasPrice: 1000000000, from: account})
						.then(function(success){
							if(success){
								location.reload();
							}else{
								alert("Penyimpanan Gagal"); 
								console.log("Penyimpanan Gagal");
							}
						}).catch(function(e) {
			    		// There was an error! Handle it.
			    		console.log('error = ', e);
			    	});
					}else{
						alert("Provinsi Tidak Boleh Kosong");
					}
					
					return false;
				});

    		/*-------------------------------------------------------------
				  City
				--------------------------------------------------------------*/

				var changeCity = $('#cityU').click(function(){
					$('#city').val('');
	      	$('#cityU').css("display","none");
					$('#cityO').css("display","block");
					$('#city').removeAttr('disabled');

	      	return false;
	      });

    		var cancelCity= $('#cityC').click(function(){
					$('#city').attr("disabled","true");
					$('#city').val(city);
					$('#cityU').css("display","block");
					$('#cityO').css("display","none");

					return false;
				});

				$.ajax({
					type: 'GET',
					url: 'http://caesar.otwsidang.com/fetch.php',
					data: {target:'city'},
					dataType: "json",
					success: function(jsondata){
						var put = $("#citylist");
						jsondata.rajaongkir.results.forEach(city => {
							put.append('<option data-city="'+ city.city_id +'" value="'+ city.city_name +'"></option>');
			   		});

						var clist = $("#citylist > option");
						$("input[name=city]").change(e => {
							try{
								cityId = Array.from(clist).find(cl => cl.value === e.target.value);
								cityId = cityId.dataset.city;
							}catch(err){
								cityId = "City Not Found ("+err+")";
							}
							console.log(cityId);
						});
					},
					error: function(jqXHR, textStatus, error){
				   		console.log(error);
			   	}
				});

				var saveCity = $('#cityS').click(function(){
					if ($('#city').val() !== '') {
						userInstance.updateCity(account, cityId, {gas: 200000, gasPrice: 1000000000, from: account})
						.then(function(success){
							if(success){
								location.reload();
							}else{
								alert("Penyimpanan Gagal"); 
								console.log("Penyimpanan Gagal");
							}
						}).catch(function(e) {
			    		// There was an error! Handle it.
			    		console.log('error = ', e);
			    	});
					}else{
						alert("Kota/Kabupaten Tidak Boleh Kosong");
					}
					
		    	return false;
				});

    		/*-------------------------------------------------------------
				  Wa
				--------------------------------------------------------------*/

				var changeWa = $('#waU').click(function(){
					$('#wa').val('');
	      	$('#waU').css("display","none");
					$('#waO').css("display","block");
					$('#wa').removeAttr('disabled');
	      	
	      	return false;
	      });

    		var cancelWa = $('#waC').click(function(){
					$('#wa').attr("disabled","true");
					$('#wa').val(wa);
					$('#waU').css("display","block");
					$('#waO').css("display","none");

					return false;
				});

    		var saveWa = $('#waS').click(function(){
    			if ($('#wa').val() !== '') {
    				userInstance.updateWa(account, web3.fromAscii($("input[name=wa]").val()), {gas: 200000, gasPrice: 1000000000, from: account})
						.then(function(success){
							if(success){
								location.reload();
							}else{
								alert("Penyimpanan Gagal"); 
								console.log("Penyimpanan Gagal");
							}
						}).catch(function(e) {
			    		// There was an error! Handle it.
			    		console.log('error = ', e);
			    	});
    			} else{
    				alert("WhatsApp Tidak Boleh Kosong");
    			}
					
					return false;
				});

	    });
		
    function numberWithPoint(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

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
