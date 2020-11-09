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
	getPrice: function(instance, i, j){
		var instanceUsed = instance;
		var idx = i;
		var priceIdx = j;
		var productId = 'product-'+idx;
		var min;
		var max;
		var price;

		return instanceUsed.getMinBySellerToSkuIndex.call(account, idx, priceIdx).then(function(_min){
			min = _min.toNumber();

			return instanceUsed.getMaxBySellerToSkuIndex.call(account, idx, priceIdx);
		}).then(function(_max){
			max = _max.toNumber();

			return instanceUsed.getPriceBySellerToSkuIndex.call(account, idx, priceIdx);
		}).then(function(_price){
			price = _price.toNumber();

			if(min !== 0 && max !== 0 && price !== 0){
				console.log('min = ', min, j);
				console.log('max = ', max, j);
				console.log('price = ', price, j);

				$('#'+productId).find('#price').append(min+'-'+max+' = Rp '+price, '<br>');
			}

		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });

	},

	getProduct: function(instance, i){
		var self = this;
		var idx = i;
		var instanceUsed = instance;
    var productId = 'product-'+idx;
    var sku;
		var pict;
		var name;
		var priceCount;
		var stock;
		var state;

		return instanceUsed.getSkuBySellerToSkuIndex.call(account, idx).then(function(_sku){
			console.log('sku = ', sku = web3.toAscii(_sku), idx);

			$('#'+productId).attr('onclick','window.location.href=\'atur.html?sku='+ sku +'\'');

			return instanceUsed.getPictBySellerToSkuIndex.call(account, idx);
		}).then(function(_pict){
			console.log('pict = ', pict = web3.toAscii(_pict), idx);

			$('#'+productId).find('img').attr('src','https://ipfs.io/ipfs/'+pict);

			return instanceUsed.getNameBySellerToSkuIndex.call(account, idx);
		}).then(function(_name){
			console.log('name = ', name = web3.toAscii(_name), idx);

			$('#'+productId).find('h6').text(name);

			return instanceUsed.getStockBySellerToSkuIndex.call(account, idx);
		}).then(function(_stock){
			console.log('stock = ', stock = _stock.toNumber(), idx);

			$('#'+productId).find('#stock').text(stock);

			return instanceUsed.getPriceRangeCountBySku.call(web3.fromAscii(sku));
		}).then(function(_priceCount){
			console.log('price count = ', priceCount = _priceCount.toNumber(), idx);

			if(priceCount == 0){
				$('#'+productId).find('#price').text('Belum Ada Harga');
			} else{
				for(var j=0; j<priceCount; j++){
					self.getPrice(instanceUsed, idx, j);
				}
			}

			return instanceUsed.getNoteBySellerToSkuIndex.call(account, idx);
		}).then(function(_note){
			console.log('state = ', state = _note.toNumber(), idx);

			if(state == 0){
				$('#'+productId).find('#state').text("Nonaktif");
			}else{
				$('#'+productId).find('#state').text("Aktif");
			}
		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
	},

	start: function(){
		var self = this;
		var count;
	    var idx;
	    var name;
	    var userInstance;
	    var productInstance;
	    
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

	          return productInstance.getSkuCountByAddress.call(account);
	        });
	      }).then(function(_skuCount){
	      	console.log('sku count = ', count = _skuCount.toNumber());

	      	for(var i=0; i<count; i++){
	         	var productId = 'product-'+i;

	         	var temp =	'<tr id="'+ productId +'" style="cursor: pointer;">'+
                          '<td class="shoping__cart__item">'+
                              '<img alt="" style="width: 101px; height: 100px;">'+
                              '<h6></h6>'+
                          '</td>'+
                          '<td class="shoping__cart__price" id="stock">'+
                          '</td>'+
                          '<td class="shoping__cart__price" id="price">'+
                          '</td>'+
                          '<td class="shoping__cart__price" id="state">'+
                          '</td>'+
                      	'</tr>';

          	$('tbody').append(temp);

          	if(i!=count-1){
          		self.getProduct(productInstance, i);
          	}else{
          		return self.getProduct(productInstance, i);
          	}
	        }        	
	      }).then(function(){
	      	return User.deployed();
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
	          	});
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
