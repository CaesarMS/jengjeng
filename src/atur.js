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
var counter;
var begin;

const urlParams = new URLSearchParams(window.location.search);
const sku = urlParams.get('sku');

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI('localhost', '5001');
// const ipfs = ipfsAPI('ipfs.infura.io', '5001', {protocol: 'https'});
var Buffer = require('buffer/').Buffer;

const App = {
	activateProduct: function(instance){
		var instanceUsed = instance;
		var note;

		if($('#act').text() == "Aktifkan"){
			note = 1;
		} else{
			note = 0;
		}

		console.log('note = ', note);
		return instanceUsed.updateNote(account, web3.fromAscii(sku), note, {gas: 200000, gasPrice: 1000000000, from: account}).then(function(success){
			if(success){
				location.reload();
			}else{
				alert("Status Gagal Diubah");
			}
		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
	},

	updatePrice: function(instance, i, min, max, price){
		var productInstance = instance;
		var idx = i;
		var start = min;
		var end = max;
		var idr = price;

		productInstance.updatePrice(account, web3.fromAscii(sku), idx, start, end, idr, {gas: 200000, gasPrice: 1000000000, from: account}).then(function(success){
			if(success){
				alert("Harga Berhasil Diubah, Reload untuk Perubahan");
				$('#c-'+idx).css('display','none');
				$('#c-'+idx).next().css('display','none');
				$('#price-'+idx).find('input[name=min]').attr('disabled','true');
				$('#price-'+idx).find('input[name=max]').attr('disabled','true');
				$('#price-'+idx).find('input[name=price]').attr('disabled','true');
			}else{
				alert("Harga Gagal Diubah");
			}
		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
    });
	},

	deletePrice: function(instance, i){
		var productInstance = instance;
		var idx = i;

		productInstance.deletePrice(account, web3.fromAscii(sku), idx, {gas: 200000, gasPrice: 1000000000, from: account}).then(function(success){
			if(success){
				alert("Harga Berhasil Dihapus, Reload untuk Perubahan");
				$('#price-'+idx).remove();
			}else{
				alert("Harga Gagal Dihapus");
			}
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
		var temp1;
		var temp2;
		var idx = i;
		var priceIdx = j;

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
				temp1 =	'<div class="row" id="price-'+ j +'">'+
		              '<div class="col-lg-12 col-md-6">'+
		                '<div class="row">'+
		                	'<div class="col-lg-2">'+
			                  '<div class="checkout__input">'+
			                    '<input type="number" name="min" min="1" disabled>'+
			                  '</div>'+
			                '</div>'+
			                '<div class="col-lg-2">'+
			                  '<div class="checkout__input">'+
			                    '<input type="number" name="max" min="1" disabled>'+
			                  '</div>'+
			                '</div>'+
			                '<div class="col-lg-4">'+
			                  '<div class="checkout__input">'+
			                    '<input type="number" name="price" min="1" disabled>'+
			                  '</div>'+
			               	'</div>'+
			                '<div class="col-lg-4">'+
			                  '<div class="checkout__input">'+
			                  	'<button class="site-btn" id="u-'+ j +'" style="margin-right: 10px;">Ubah</button>'+
			                  	'<button class="site-btn" style="background-color: #DC3545">Hapus</button>'+
			                  	'<button class="site-btn" id="c-'+ j +'" style="margin-right: 10px; display: none;">Simpan</button>'+
			                    '<button class="site-btn" style="background-color: #6C757D; display: none;">Batal</button>'+
			                  '</div>'+
			                '</div>'+
		                '</div>'+
		              '</div>'+
		          	'</div>';
								
        $('#priceForm').append(temp1);

				$('#price-'+j).find('input[name=min]').val(min);
				$('#price-'+j).find('input[name=max]').val(max);
				$('#price-'+j).find('input[name=price]').val(price);

				temp2 =	'<tr>'+
	              	'<td>'+min+'-'+max+'</td>'+
	              	'<td>=</td>'+
	               	'<td>Rp '+ numberWithCommas(price) +'</td>'+
	            	'</tr>';
	    	$('table').append(temp2);

				$('#u-'+j).click(function(){
					$('#u-'+j).css('display','none');
					$('#u-'+j).next().css('display','none');
					$('#c-'+j).css('display','inline-block');
					$('#c-'+j).next().css('display','inline-block');
					$('#price-'+j).find('input[name=min]').val('').removeAttr('disabled');
					$('#price-'+j).find('input[name=max]').val('').removeAttr('disabled');
					$('#price-'+j).find('input[name=price]').val('').removeAttr('disabled');

					return false;
				});

				$('#u-'+j).next().click(function(){
					if(confirm("Yakin Dihapus?")){
						console.log(account, ' ', sku, ' ',j);

						self.deletePrice(instanceUsed, j);
					}

					return false;
				});

				$('#c-'+j).click(function(){
					var min = $('#price-'+j).find('input[name=min]').val();
					var max = $('#price-'+j).find('input[name=max]').val();
					var price = $('#price-'+j).find('input[name=price]').val();
					console.log('#c-'+j, min, max, price);

					self.updatePrice(instanceUsed, j, min, max, price);

					return false;
				});

				$('#c-'+j).next().click(function(){

					$('#c-'+j).css('display','none');
					$('#c-'+j).next().css('display','none');
					$('#u-'+j).css('display','inline-block');
					$('#u-'+j).next().css('display','inline-block');
					$('#price-'+j).find('input[name=min]').val(min).attr('disabled','true');
					$('#price-'+j).find('input[name=max]').val(max).attr('disabled','true');
					$('#price-'+j).find('input[name=price]').val(price).attr('disabled','true');

					return false;
				});
			
				counter = j+1;
				begin = counter;
				console.log('BEGIN = ', begin);
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
	    var idx;
	    var name;
	    var userInstance;
	    var productInstance;
	    var pId;
	    var pName;
	    var pict;
	    var stock;
	    var note;
	    var desc;
	    var priceCount;
	    var temp1;
	    var temp2;
	    var ipfsHash;

	    ipfs.id(function(err, res) {
		 		if (err) throw err
		 		console.log("Connected to IPFS node!", res.id, res.agentVersion, res.protocolVersion);
		 	});
	    
	 //    window.ethereum.on('accountsChanged', function (accounts) {
	 //  		window.location = "profil.html";
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

	      $('#sku').text(sku);

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
	      	console.log('pName = ', pName = web3.toAscii(_pName));

	      	$('h3').text(pName);

	      	return productInstance.getPictByIndex.call(pId);
	      }).then(function(_pict){
	      	console.log('pict = ', pict = web3.toAscii(_pict));

	      	$('.product__details__pic__item > img').attr('src','https://ipfs.io/ipfs/'+pict);

	      	return productInstance.getStockByIndex.call(pId);	
	      }).then(function(_stock){
	      	console.log('stock = ', stock = _stock.toNumber());

	      	$('#stock').text(stock);
	      	
	      	return productInstance.getPriceRangeCountBySku.call(web3.fromAscii(sku));
	      }).then(function(_priceCount){
	      	console.log('price count = ', priceCount = _priceCount.toNumber());

					if(priceCount == 0){
						temp1 =	'<tr>'+
                    	'<td>Belum Ada Harga</td>'+
                  	'</tr>';
            temp2 =	'<div class="row" id="price-0">'+
					            '<div class="col-lg-12 col-md-6">'+
				                '<div class="row">'+
				                  '<div class="col-lg-2">'+
				                    '<div class="checkout__input">'+
				                    	'<p>Min Qty<span>*</span></p>'+
				                      '<input type="number" name="min" min="1">'+
				                    '</div>'+
				                  '</div>'+
				                  '<div class="col-lg-2">'+
				                    '<div class="checkout__input">'+
				                    	'<p>Max Qty<span>*</span></p>'+
				                      '<input type="number" name="max" min="1">'+
				                    '</div>'+
				                  '</div>'+
				                  '<div class="col-lg-4">'+
				                    '<div class="checkout__input">'+
				                    	'<p>Price<span>*</span></p>'+
				                      '<input type="number" name="price" min="1">'+
				                    '</div>'+
				                 	'</div>'+
				                  '<div class="col-lg-4">'+
				                    '<div class="checkout__input">'+
				                    	'<br><br><button class="site-btn" id="s-0" style="margin-right: 10px;">Simpan</button>'+
				                    '</div>'+
				                  '</div>'+
				                '</div>'+
				              '</div>'+
				          	'</div>';
						$('table').append(temp1);
	      		$('#priceForm').append(temp2);

	      		$('#s-0').click(function(){
			 				var min = $('#price-0').find('input[name=min]').val();
			 				var max = $('#price-0').find('input[name=max]').val();
			 				var price = $('#price-0').find('input[name=price]').val();
			 				self.createPrice(productInstance, min, max, price, 0);

			 				return false;
			 			});

			 			counter = 1;

					} else{
						for(let j=0; j<priceCount; j++){
							if(j!=priceCount-1){
								self.getPrice(productInstance, pId, j);
							}else{
								return self.getPrice(productInstance, pId, j);
							}
						}
						// counter = priceCount;
					}	      	
	      }).then(function(){
	      	return productInstance.getDescByIndex.call(pId);
	      }).then(function(_desc){
	      	console.log('desc = ', desc = web3.toAscii(_desc));

	      	$('.product__details__tab__desc > p').text(desc);

	      	return productInstance.getNoteByIndex.call(pId);
	      }).then(function(_note){
	      	console.log('note = ', note = _note.toNumber());

	      	if(priceCount !== 0){
	      		if(note==0){
		      		$('#note').text('Nonaktif');
		      		$('#act').text('Aktifkan').removeAttr('style');
		      	}else{
		      		$('#note').text('Aktif');
		      		$('#act').text('Nonaktifkan').css('background-color','#DC3545');
		      	}
	      	}else{
	      		$('#note').text('Nonaktif');
	      		$('#act').css('display','none');
	      	}

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

	      	setTimeout(function(){
						console.log('counter1 = ',counter);
						console.log('begin = ',begin);
			      $('#new').click(function(){
							var temp =	'<div class="row" id="price-'+ counter +'">'+
							              '<div class="col-lg-12 col-md-6">'+
							                '<div class="row">'+
							                  '<div class="col-lg-2">'+
							                    '<div class="checkout__input">'+
							                      '<input type="number" name="min" min="1">'+
							                    '</div>'+
							                  '</div>'+
							                  '<div class="col-lg-2">'+
							                    '<div class="checkout__input">'+
							                      '<input type="number" name="max" min="1">'+
							                    '</div>'+
							                  '</div>'+
							                  '<div class="col-lg-4">'+
							                    '<div class="checkout__input">'+
							                      '<input type="number" name="price" min="1">'+
							                    '</div>'+
							                 	'</div>'+
							                  '<div class="col-lg-4">'+
							                    '<div class="checkout__input">'+
							                    	'<button class="site-btn" id="s-'+ counter +'" style="margin-right: 10px;">Simpan</button>'+
							                      '<button class="site-btn" style="background-color: #DC3545" onclick="$(\'#price-'+ counter +'\').remove(); return false;">Hapus</button>'+
							                    '</div>'+
							                  '</div>'+
							                '</div>'+
							              '</div>'+
							          	'</div>';
			      	$('#priceForm').append(temp);
			      	counter++;
			      });      

			      var min=[];
			      var max=[];
			      var price=[];
			      var keep=[];
			      var stop;
			      var findKeep;
			      $('body').on('DOMSubtreeModified', 'form', function(){
					 		stop = $('form > div').length;
					 		console.log('count = '+stop);
							console.log('keep 1 = '+keep);
							console.log('counter = ',counter);
							console.log('begin2 = ',begin);

							for(let k=begin; k<counter+1; k++){
								findKeep = keep.find(kept => kept===k);
								console.log('findKeep = ', findKeep);
								console.log('k = ',k);
								// if(typeof min[k] === 'undefined')

								if(typeof findKeep === 'undefined'){
									keep.push(k);
									console.log('keep 2 = '+keep);
						 			$('#s-'+k).click(function(){
						 				min[k] = $('#price-'+k).find('input[name=min]').val();
						 				max[k] = $('#price-'+k).find('input[name=max]').val();
						 				price[k] = $('#price-'+k).find('input[name=price]').val();

						 				console.log('price-'+k, min[k], max[k], price[k]);

						 				self.createPrice(productInstance, min[k], max[k], price[k], k);

						 				return false;
						 			});
								}else{
									continue;
								}
					 		}
						});
			    }, 1000);

	      	$('#act').click(function(){
	      		self.activateProduct(productInstance);

	      		return false;
	      	});

					// DATA MODAL CHANGE BEGIN

					$("p:contains('SKU Produk')").next().text(sku);

					/*-------------------------------------------------------------
					  Nama Produk
					--------------------------------------------------------------*/

					$('input[name=name]').val(pName);

		      var changeName = $('#nameU').click(function(){
						$('#name').val('');
		      	$('#nameU').css("display","none");
						$('#nameO').css("display","block");
						$('#name').removeAttr('disabled');

		      	return false;
		      });

	    		var cancelName = $('#nameC').click(function(){
						$('#name').attr("disabled","true");
						$('#name').val(pName);
						$('#nameU').css("display","block");
						$('#nameO').css("display","none");

						return false;
					});

					var saveName = $('#nameS').click(function(){
						if ($('#name').val() !== '') {
							productInstance.updateName(account, web3.fromAscii(sku), web3.fromAscii($("input[name=name]").val()), {gas: 200000, gasPrice: 1000000000, from: account})
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
							alert("Nama Produk Tidak Boleh Kosong");
						}

						return false;
					});

					/*-------------------------------------------------------------
					  Deskripsi Produk
					--------------------------------------------------------------*/

					$('input[name=desc]').val(desc);

		      var changeDesc = $('#descU').click(function(){
						$('#desc').val('');
		      	$('#descU').css("display","none");
						$('#descO').css("display","block");
						$('#desc').removeAttr('disabled');

		      	return false;
		      });

	    		var cancelDesc = $('#descC').click(function(){
						$('#desc').attr("disabled","true");
						$('#desc').val(desc);
						$('#descU').css("display","block");
						$('#descO').css("display","none");

						return false;
					});

					var saveDesc = $('#descS').click(function(){
						if ($('#desc').val() !== '') {
							productInstance.updateDesc(account, web3.fromAscii(sku), web3.fromAscii($("input[name=desc]").val()), {gas: 200000, gasPrice: 1000000000, from: account})
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
							alert("Deskripsi Produk Tidak Boleh Kosong");
						}

						return false;
					});

					/*-------------------------------------------------------------
					  Stok Produk
					--------------------------------------------------------------*/

					$('input[name=stock]').val(stock);

		      var changeStock = $('#stockU').click(function(){
						$('#stockF').val('');
		      	$('#stockU').css("display","none");
						$('#stockO').css("display","block");
						$('#stockF').removeAttr('disabled');

		      	return false;
		      });

	    		var cancelStock = $('#stockC').click(function(){
						$('#stockF').attr("disabled","true");
						$('#stockF').val(stock);
						$('#stockU').css("display","block");
						$('#stockO').css("display","none");

						return false;
					});

					var saveStock = $('#stockS').click(function(){
						if ($('#stockF').val() !== '') {
							productInstance.updateStock(account, web3.fromAscii(sku), ($("input[name=stock]").val()-stock), {gas: 200000, gasPrice: 1000000000, from: account})
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
							alert("Stok Produk Tidak Boleh Kosong");
						}

						return false;
					});

					/*-------------------------------------------------------------
					  Gambar Produk
					--------------------------------------------------------------*/

					$('#pict').change(function(){
						$('#pictButton').css("display","block");

						$.validator.addMethod('filesize', function (value, element, param) {
				    	return this.optional(element) || (element.files[0].size <= param)
						}, 'File size must be less than {0}');

						$('#myForm').validate({
			      	errorElement: 'div',
			      	rules: {
			      		pict: {
			      			extension: 'png,jpe?g,gif',
			      			filesize: 250000
			      		}
			      	},
			      	messages:{
			      		pict:{
			      			extension: "Hanya mendukung ekstensi png/jpg/jpeg/gif",
			      			filesize: "Gambar harus berukuran kurang dari 250Kb"
			      		}
			      	}
			      });

						$('#pictButton').click(function(){
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

				           	console.log('ipfsHash = ', ipfsHash);

			          		productInstance.updatePict(account, web3.fromAscii(sku), web3.fromAscii(ipfsHash), {gas: 300000, gasPrice: 1000000000, from: account})
			          		.then(function(success){
			          			if(success){
		                    location.reload();
			          			} else{
			          				alert("Penyimpanan Gagal"); 
												console.log("Penyimpanan Gagal");
			          			}
			          		}).catch(function(e) {
				          		// There was an error! Handle it.
				          		console.log('error = ', e);
			        			});

					        });
					      };
      				}

							return false;
						})

					});

					// DATA MODAL CHANGE END	      	
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

	createPrice: function(_instance, _min, _max, _price, _i){
		var start = _min;
		var end = _max;
		var idr = _price;
		var productInstance = _instance;
		var idx = _i

		return productInstance.createPrice(account, web3.fromAscii(sku), start, end, idr, {gas: 200000, gasPrice: 1000000000, from: account}).then(function(_success){
			if(_success){
				if(!alert("Harga Berhasil Disimpan, Reload untuk Perubahan")){
					if(idx == 0){
						location.reload();
					}else{
						$('#s-'+idx).closest('.col-lg-4').css('display','none');
						$('#price-'+idx).find('input[name=min]').attr('disabled','true');
						$('#price-'+idx).find('input[name=max]').attr('disabled','true');
						$('#price-'+idx).find('input[name=price]').attr('disabled','true');
					}
				}			
			} else{
				alert("Harga Gagal Disimpan");
			}
		}).catch(function(e) {
      // There was an error! Handle it.
      console.log('error = ', e);
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

