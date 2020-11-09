import jQuery from 'jquery';
window.$ = window.jQuery = jQuery;

import 'bootstrap';
import moment from 'moment';
import daterangepicker from 'daterangepicker';

import '../fonts/Linearicons-Free-v1.0.0/icon-font.min.css';
import '../css/animate.css';
import '../css/hamburgers.min.css';
import '../css/animsition.min.css';
import '../css/select2.min.css';
import '../css/util.css';
import '../css/main.css';

import '../js/animsition.min.js';
import '../js/select2.min.js';
import '../js/countdowntime.js';

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

// window.ethereum.on('accountsChanged', function (accounts) {
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

		$("button:contains('Login')").css('display','none');

		$("button:contains('Logout')").click(function(){
      fm.user.logout().then(function(success){
        if(success){
          location.reload();
        };
      });

      return false;
    });

		var name;
		var wa;
		var loc;
		var cityId;
		var provId;

		// set the provider for the each contract abstraction
		User.setProvider(web3.currentProvider);
		Product.setProvider(web3.currentProvider);
		Escrow.setProvider(web3.currentProvider);

  		$("input[name=address]").val(account);

  		$.ajax({
			type: 'GET',
			url: 'http://caesar.otwsidang.com/fetch.php',
			data: {target:'city'},
			dataType: "json",
			success: function(jsondata){
				// var ct = JSON.parse(jsondata);
				// console.log(jsondata);

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
	  			

		   		$.ajax({
					type: 'GET',
					url: 'http://caesar.otwsidang.com/fetch.php',
					data: {target:'province'},
					dataType: "json",
					success: function(data){
						// var pv = JSON.parse(data);
						// console.log(data);

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
			        
			      $(".loader").fadeOut();
			      $("#preloder").delay(200).fadeOut("slow");
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
		
		$(".m-t-17 > button").click(function(e){
			e.preventDefault();

			name = web3.fromAscii($("input[name=name]").val());
			wa = web3.fromAscii($("input[name=wa]").val());
			loc = web3.fromAscii($("input[name=location]").val());

			console.log(account+" "+name+" "+wa+" "+loc+" "+cityId+" "+provId);

  			User.deployed().then(function(contractInstance){
  				contractInstance.createUser(account, name, loc, cityId, provId, wa, {gas: 200000, gasPrice: 1000000000, from: account}).then(function(success){
  					if(success){
  						window.location = "index.html";
  					} else{
  						alert("Registrasi Gagal"); 
  						console.log("Registrasi Gagal");
  					}
  				});
  				
  			}).catch(function(e) {
	          		// There was an error! Handle it.
	          		console.log('error = ', e);
        	});
  		});

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
  //           window.location = "/";
  //         } else{
  //           App.start();
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
              window.location = "/";
            } else{
              App.start();
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

      $("button:contains('Logout')").css('display','none');
    }
  });

});

