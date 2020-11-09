import jQuery from 'jquery';
window.$ = window.jQuery = jQuery;

import 'bootstrap';
import 'jquery-validation';
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
import '../js/additional-methods.js';
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

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('localhost', '5001');
// const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'});
var Buffer = require('buffer/').Buffer;

const App = {
  start: function() {
    var self = this;
    var ipfsHash;

    // window.ethereum.on('accountsChanged', function (accounts) {
    //   location.reload();
    // });

    ipfs.id(function(err, res) {
	 		if (err) throw err
	 		console.log("Connected to IPFS node!", res.id, res.agentVersion, res.protocolVersion);
	 	});

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


      var sku;
  		var productName;
  		var desc;
  		var pict;
  		var stock;

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
        return contractInstance.getIndexByAddress.call(account).then(function(i){
          var idx = i;

          return contractInstance.getNameByIndex.call(idx).then(function(_name){
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

      $.validator.addMethod('filesize', function (value, element, param) {
	    	return this.optional(element) || (element.files[0].size <= param)
			}, 'File size must be less than {0}');

      $('#myForm').validate({
      	errorElement: 'div',
      	rules: {
      		pict: {
      			required: true,
      			extension: 'png,jpe?g,gif',
      			filesize: 250000
      		}
      	},
      	messages:{
      		pict:{
      			required: "Tolong melampirkan gambar",
      			extension: "Hanya mendukung ekstensi png/jpg/jpeg/gif",
      			filesize: "Gambar harus berukuran kurang dari 250Kb"
      		}
      	}
      });

      $('#sell').click(function(e){
      	e.preventDefault();
      	console.log('valid = ', $('#myForm').valid());

      	if($('#myForm').valid()){
      		const reader = new FileReader();
	      	const img = document.getElementById("pict").files[0];    	
	      	reader.readAsArrayBuffer(img);

	      	reader.onloadend = function() {
		        const buf = Buffer.from(reader.result) // Convert data into buffer
		        ipfs.add(buf, (err, result) => { // Upload buffer to IPFS
	           	if (err) throw err;
	           	ipfsHash = result[0].hash;

	           	console.log($("input[name=sku]").val()+' '+$("input[name=name]").val()+' '+$("#desc").val()+' '+ipfsHash+' '+$("input[name=stock]").val());

   	      		sku = web3.fromAscii($("input[name=sku]").val());
		      		productName = web3.fromAscii($("input[name=name]").val());
		      		desc = web3.fromAscii($("#desc").val());
		      		pict = web3.fromAscii(ipfsHash);
		      		stock = $("input[name=stock]").val();

	          	Product.deployed().then(function(instance){
	          		return instance.insertProduct(account, sku, productName, desc, pict, stock, {gas: 300000, gasPrice: 1000000000, from: account}).then(function(success){
	          			if(success){
                    window.location = "atur.html?sku="+$("input[name=sku]").val();
	          			}
	          			else{
	          				alert("Gagal disimpan");
	          			}
	          		});
	          	}).catch(function(e) {
	          		// There was an error! Handle it.
	          		console.log('error = ', e);
        			});

		        });
		      };
      	}else{
      		alert("Tolong perbaiki pengisian form");
      	}
      });      

    });
  
    function numberWithPoint(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

  },
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
