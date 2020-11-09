var User = artifacts.require("User");
var Product = artifacts.require("Product");
var Escrow = artifacts.require("Escrow");

module.exports = function(deployer, network) {
    deployer.deploy(User).then(() => {
        return deployer.deploy(Product).then(() => {
            return deployer.deploy(Escrow, User.address, Product.address).then(()=>{
                deployer.link(User, Escrow);
                deployer.link(Product, Escrow);
            });
        });
    });
};