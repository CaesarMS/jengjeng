  User.deployed().then(function(contractInstance){
    return contractInstance.getOwner().then(function(v) {
      console.log("Owner = "+v); 
      alert("Owner " + v);

    }).then(function(){
      alert("You're at "+account);
      console.log("You're at "+account);

      return contractInstance.getAbc();
    }).then(function(w){
      console.log("Abc without toNum = "+w); 
      alert("Abc without toNum = " + w);

      return Escrow.deployed();
    });
  }).then(function(instance){
    return instance.getAbcUser().then(function(z){
      console.log("Abc from Escrow without toNum = "+z); 
      alert("Abc from Escrow without toNum = " + z);
    });
  });