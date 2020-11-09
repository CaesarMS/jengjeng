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
var chk = false;

const App = {
  getPrice: function(instance, i, j){
    var instanceUsed = instance;
    var productId = 'product-'+i;
    var idx = i;
    var priceIdx = j;
    var min;
    var max;
    var price;

    function numberWithCommas(x) {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    return instanceUsed.getMinByIndex.call(idx, priceIdx).then(function(_min){
      min = _min.toNumber();

      return instanceUsed.getMaxByIndex.call(idx, priceIdx);
    }).then(function(_max){
      max = _max.toNumber();

      return instanceUsed.getPriceByIndex.call(idx, priceIdx);
    }).then(function(_price){
      price = _price.toNumber();

      if(min !== 0 && max !== 0 && price !== 0){
        console.log('min = ', min, priceIdx);
        console.log('max = ', max, priceIdx);
        console.log('price = ', price, priceIdx);

        $('#'+productId).find('h5').text('Rp '+numberWithCommas(price));

        return chk = true;
      }
    }).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
  },

  getProduct: function(instance, i){
    var self = this;
    var instance = instance;
    var productId = 'product-'+i;
    var name;
    var pict;
    var sku;
    var priceCount;
    var min;
    var max;
    var price;
    var note;
    
    return instance.getSkuByIndex.call(i).then(function(_sku){
      console.log('sku = ', sku = web3.toUtf8(_sku), i);

      return instance.getPriceRangeCountBySku.call(web3.fromAscii(sku));
    }).then(function(_priceCount){
      console.log('price count = ', priceCount = _priceCount.toNumber());

      return instance.getNoteByIndex.call(i);
    }).then(function(_note){
      console.log('note = ', note = _note.toNumber());

      if(priceCount !== 0){
        if(note !== 0){
          var temp =
              '<div class="col-lg-3 col-md-4 col-sm-6" id="'+ productId +'">'+
                '<div class="featured__item">'+
                  '<div class="featured__item__pic set-bg">'+
                  '</div>'+
                  '<div class="featured__item__text" onclick="window.location.href = \'detail.html?sku='+ sku.trim() +'\';" style="cursor: pointer;">'+
                    '<h6></h6>'+
                    '<h5></h5>'+
                  '</div>'+
                '</div>'+
              '</div>';

          $('#target').append(temp);

          return instance.getNameByIndex.call(i).then(function(_name){
            console.log('name = ', name = web3.toUtf8(_name), i);

            $('#'+productId).find('h6').text(name);

            return instance.getPictByIndex.call(i);
          }).then(function(_pict){
            console.log('pict = ', pict = web3.toAscii(_pict), i);

            $('#'+productId).find('.set-bg').attr('data-setbg','https://ipfs.io/ipfs/'+pict);

          }).then(function(){
            for(let k=0; k<priceCount; k++){
              if(self.getPrice(instance, i, k)){
                break;
              }
            }

            return setTimeout(function(){
              $('.set-bg').each(function () {
                var bg = $(this).data('setbg');
                $(this).css('background-image', 'url(' + bg + ')');
              });
            }, 500);
          }).catch(function(e) {
            // There was an error! Handle it.
            console.log('error = ', e);
          });
        }
      }

    }).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
  },

  start: function() {
    var self = this;
    var instanceUsed;
    var balance;
    var name;
    var wa;
    var loc;
    var city;
    var prov;
    var count;


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

            $('h4').append('Saldo = '+parseFloat(balance).toFixed(4)+' ETH');

            $('h6').append(numberWithPoint(Math.round(balance*parseFloat(data.data.quote.IDR.price)))+' IDR');
           },
           error: function(jqXHR, textStatus, error){
              console.log(error);
           }
        });
      });

      // set the provider for the each contract abstraction
      User.setProvider(web3.currentProvider);
      Product.setProvider(web3.currentProvider);
      Escrow.setProvider(web3.currentProvider);

      User.deployed().then(function(ii){
        ii.getOwner.call().then(function(owner){
          console.log('Owner = ', owner);
        });
      });

      Product.deployed().then(function(instance){
        instanceUsed = instance;
        return instance.isSeller.call(account).then(function(_isIndeed){
          console.log(_isIndeed);
          if(_isIndeed){
            $(".seller").css("display","block");
          }else{
            $(".seller").css("display","none");
          }

          return instance.getSkuCount.call();
        });
      }).then(function(_count){
        console.log('sku count = ', count = _count.toNumber());

        for(var i=0; i<count; i++){
          if(i!=count-1){
            self.getProduct(instanceUsed,i);
          }else{
            return self.getProduct(instanceUsed,i);
          }
        }
      }).then(function(){
        return User.deployed();
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

      function numberWithPoint(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
    });
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
