pragma solidity ^0.4.21;

contract Product{
	struct Detail{
		bytes32 name;
		bytes32 desc;
		bytes pict;
		int stock;
		uint note;
		uint index;
		uint sellerIndex;
		uint sellerToSkuIndex;
	}
	struct Range{
		uint min;
		uint max;
		uint price;
		uint priceIndex;
	}
	bytes32[] private sku;
	address[] private seller;
	address private owner;

	mapping(bytes32 => Detail) private skuToDetail;
	mapping(bytes32 => Range[]) private skuToPrice;
	mapping(address => bytes32[]) private sellerToSku;

	event NewSku(bytes32 indexed sku, uint index, bytes32 name, bytes32 desc, bytes pict, int stock, uint note, address sellerAddress);
	event NewSkuPrice(bytes32 indexed sku, uint priceIndex, uint min, uint max, uint price);
	event UpdateSku(bytes32 indexed sku, uint index, bytes32 name, bytes32 desc, bytes pict, int stock, uint note, address sellerAddress);
	event UpdateSkuPrice(bytes32 indexed sku, uint priceIndex, uint min, uint max, uint price);
	event DeleteSku(bytes32 indexed sku, uint index);
	event DeleteSkuPrice(bytes32 indexed sku, uint priceIndex);

	modifier onlyOwner(){
		require(msg.sender == owner);
		_;
	}

	function Product() public{
		owner = msg.sender;
	}

	function isSeller(address _sellerAddress) public view returns(bool isIndeed){
		if(seller.length == 0) return false;

		// return (seller[skuToDetail[sellerToSku[_sellerAddress][0]].sellerIndex] == _sellerAddress);
		return (sellerToSku[_sellerAddress].length > 0);
	}

	function isSku(bytes32 _sku) public view returns(bool isIndeed){
		if(sku.length == 0) return false;

		return (sku[skuToDetail[_sku].index] == _sku);
	}

	function insertProduct(address _sellerAddress, bytes32 _sku, bytes32 _name, bytes32 _desc, bytes _pict, int _stock) public returns(bool success){
		require(!isSku(_sku));

		if(!isSeller(_sellerAddress)){
			skuToDetail[_sku].sellerIndex = seller.push(_sellerAddress)-1;
		} else{
			skuToDetail[_sku].sellerIndex = skuToDetail[sellerToSku[_sellerAddress][0]].sellerIndex;
		}
		
		skuToDetail[_sku].name = _name;
		skuToDetail[_sku].desc = _desc;
		skuToDetail[_sku].pict = _pict;
		skuToDetail[_sku].stock = _stock;
		skuToDetail[_sku].note = 0;
		skuToDetail[_sku].index = sku.push(_sku)-1;
		skuToDetail[_sku].sellerToSkuIndex = sellerToSku[_sellerAddress].push(_sku)-1;

		emit NewSku(_sku, skuToDetail[_sku].index, _name, _desc, _pict, _stock, 0, _sellerAddress);

		return true;
	}

	function createPrice(address _sellerAddress, bytes32 _sku, uint _min, uint _max, uint _price) public returns(bool success){
		require(isSku(_sku));
		require(isSeller(_sellerAddress));
		
		skuToPrice[_sku].push(Range(_min, _max, _price, skuToPrice[_sku].length));

		emit NewSkuPrice(_sku, skuToPrice[_sku].length-1, _min, _max, _price);

		return true;
	}

	function deleteProduct(address _sellerAddress, bytes32 _sku) public returns(bool success){
		require(isSku(_sku));
		require(isSeller(_sellerAddress));

		uint indexToDelete = skuToDetail[_sku].index;
		uint sellerToSkuIndexToDelete = skuToDetail[_sku].sellerToSkuIndex;

		bytes32 skuToMove = sku[sku.length-1];
		bytes32 skuSellerToMove = sellerToSku[_sellerAddress][sellerToSku[_sellerAddress].length-1];

		sku[indexToDelete] = skuToMove;
		sellerToSku[_sellerAddress][sellerToSkuIndexToDelete] = skuSellerToMove;

		skuToDetail[skuToMove].index = indexToDelete;
		skuToDetail[skuToMove].sellerToSkuIndex = sellerToSkuIndexToDelete;

		sku.length--;
		sellerToSku[_sellerAddress].length--;
		delete skuToPrice[_sku];

		emit DeleteSku(_sku, indexToDelete);
		emit UpdateSku(skuToMove, indexToDelete, skuToDetail[skuToMove].name, skuToDetail[skuToMove].desc, skuToDetail[skuToMove].pict, skuToDetail[skuToMove].stock, skuToDetail[skuToMove].note, _sellerAddress);

		return true;
	}

	function deletePrice(address _sellerAddress, bytes32 _sku, uint _index) public returns(bool success){
		require(isSku(_sku));
		require(isSeller(_sellerAddress));

		uint indexToDelete = _index;

		// skuToPrice[_sku][indexToDelete].min = skuToPrice[_sku][skuToPrice[_sku].length-1].min;
		// skuToPrice[_sku][indexToDelete].max = skuToPrice[_sku][skuToPrice[_sku].length-1].max;
		// skuToPrice[_sku][indexToDelete].price = skuToPrice[_sku][skuToPrice[_sku].length-1].price;

		// skuToPrice[_sku].length--;

		delete skuToPrice[_sku][indexToDelete];

		emit DeleteSkuPrice(_sku, indexToDelete);
		emit UpdateSkuPrice(_sku, indexToDelete, skuToPrice[_sku][indexToDelete].min, skuToPrice[_sku][indexToDelete].max, skuToPrice[_sku][indexToDelete].price);

		return true;
	}

	function updateName(address _sellerAddress, bytes32 _sku, bytes32 _name) public returns(bool success){
		require(isSku(_sku));
		require(isSeller(_sellerAddress));

		skuToDetail[_sku].name = _name;

		emit UpdateSku(_sku, skuToDetail[_sku].index, _name, skuToDetail[_sku].desc, skuToDetail[_sku].pict, skuToDetail[_sku].stock, skuToDetail[_sku].note, _sellerAddress);

		return true;
	}

	function updateDesc(address _sellerAddress, bytes32 _sku, bytes32 _desc) public returns(bool success){
		require(isSku(_sku));
		require(isSeller(_sellerAddress));

		skuToDetail[_sku].desc = _desc;

		emit UpdateSku(_sku, skuToDetail[_sku].index, skuToDetail[_sku].name, _desc, skuToDetail[_sku].pict, skuToDetail[_sku].stock, skuToDetail[_sku].note, _sellerAddress);

		return true;
	}

	function updatePict(address _sellerAddress, bytes32 _sku, bytes _pict) public returns(bool success){
		require(isSku(_sku));
		require(isSeller(_sellerAddress));

		skuToDetail[_sku].pict = _pict;

		emit UpdateSku(_sku, skuToDetail[_sku].index, skuToDetail[_sku].name, skuToDetail[_sku].desc, _pict, skuToDetail[_sku].stock, skuToDetail[_sku].note, _sellerAddress);

		return true;
	}

	function updateStock(address _sellerAddress, bytes32 _sku, int _stock) public returns(bool success){
		require(isSku(_sku));
		require(isSeller(_sellerAddress));

		skuToDetail[_sku].stock += _stock;

		emit UpdateSku(_sku, skuToDetail[_sku].index, skuToDetail[_sku].name, skuToDetail[_sku].desc, skuToDetail[_sku].pict, skuToDetail[_sku].stock, skuToDetail[_sku].note, _sellerAddress);

		return true;
	}

	function updateNote(address _sellerAddress, bytes32 _sku, uint _note) public returns(bool success){
		require(isSku(_sku));
		require(isSeller(_sellerAddress));

		skuToDetail[_sku].note = _note;

		emit UpdateSku(_sku, skuToDetail[_sku].index, skuToDetail[_sku].name, skuToDetail[_sku].desc, skuToDetail[_sku].pict, skuToDetail[_sku].stock, _note, _sellerAddress);

		return true;
	}

	function updatePrice(address _sellerAddress, bytes32 _sku, uint _index, uint _min, uint _max, uint _price) public returns(bool success){
		require(isSku(_sku));
		require(isSeller(_sellerAddress));

		skuToPrice[_sku][_index].min = _min;
		skuToPrice[_sku][_index].max = _max;
		skuToPrice[_sku][_index].price = _price;

		emit UpdateSkuPrice(_sku, _index, _min, _max, _price);

		return true;
	}

	function getSkuCount() public view returns(uint count){
		return sku.length;
	}

	function getSkuCountByAddress(address _sellerAddress) public view returns(uint count){
		return sellerToSku[_sellerAddress].length;
	}

	function getPriceRangeCountBySku(bytes32 _sku) public view returns(uint count){
		return skuToPrice[_sku].length;
	}

	function getSellerCount() public view returns(uint count) {
		return seller.length;
	}

	function getSkuByIndex(uint _index) public view returns(bytes32 skuCode){
		return sku[_index];
	}

	function getSkuBySellerToSkuIndex(address _sellerAddress, uint _index) public view returns(bytes32 skuCode){
		return sellerToSku[_sellerAddress][_index];
	}

	function getSellerBySellerIndex(uint _index) public view returns(address sellerAddress){
		return seller[skuToDetail[sku[_index]].sellerIndex];
	}

	function getSellerByIndex(uint _index) public view returns(address sellerAddress){
		return seller[_index];
	}
	
	function getNameByIndex(uint _index) public view returns(bytes32 name){
		return skuToDetail[sku[_index]].name;
	}

	function getNameBySellerToSkuIndex(address _sellerAddress, uint _index) public view returns(bytes32 name){
		return skuToDetail[sellerToSku[_sellerAddress][_index]].name;
	}

	function getDescByIndex(uint _index) public view returns(bytes32 desc){
		return skuToDetail[sku[_index]].desc;
	}

	function getDescBySellerToSkuIndex(address _sellerAddress, uint _index) public view returns(bytes32 desc){
		return skuToDetail[sellerToSku[_sellerAddress][_index]].desc;
	}

	function getPictByIndex(uint _index) public view returns(bytes pict){
		return skuToDetail[sku[_index]].pict;
	}

	function getPictBySellerToSkuIndex(address _sellerAddress, uint _index) public view returns(bytes pict){
		return skuToDetail[sellerToSku[_sellerAddress][_index]].pict;
	}

	function getStockByIndex(uint _index) public view returns(int stock){
		return skuToDetail[sku[_index]].stock;
	}

	function getStockBySellerToSkuIndex(address _sellerAddress, uint _index) public view returns(int stock){
		return skuToDetail[sellerToSku[_sellerAddress][_index]].stock;
	}

	function getNoteByIndex(uint _index) public view returns(uint note){
		return skuToDetail[sku[_index]].note;
	}

	function getNoteBySellerToSkuIndex(address _sellerAddress, uint _index) public view returns(uint note){
		return skuToDetail[sellerToSku[_sellerAddress][_index]].note;
	}

	function getMinByIndex(uint _index, uint _priceIndex) public view returns(uint min){
		return skuToPrice[getSkuByIndex(_index)][_priceIndex].min;
	}

	function getMinBySellerToSkuIndex(address _sellerAddress, uint _index, uint _priceIndex) public view returns(uint min){
		return skuToPrice[getSkuBySellerToSkuIndex(_sellerAddress, _index)][_priceIndex].min;
	}

	function getMaxByIndex(uint _index, uint _priceIndex) public view returns(uint max){
		return skuToPrice[getSkuByIndex(_index)][_priceIndex].max;
	}

	function getMaxBySellerToSkuIndex(address _sellerAddress, uint _index, uint _priceIndex) public view returns(uint max){
		return skuToPrice[getSkuBySellerToSkuIndex(_sellerAddress, _index)][_priceIndex].max;
	}

	function getPriceByIndex(uint _index, uint _priceIndex) public view returns(uint price){
		return skuToPrice[getSkuByIndex(_index)][_priceIndex].price;
	}

	function getPriceBySellerToSkuIndex(address _sellerAddress, uint _index, uint _priceIndex) public view returns(uint price){
		return skuToPrice[getSkuBySellerToSkuIndex(_sellerAddress, _index)][_priceIndex].price;
	}

	function getIndexBySku(bytes32 _sku) public view returns(uint index){
		return skuToDetail[_sku].index;
	}

	function getSellerIndexByAddress(address _sellerAddress, bytes32 _sku) public view returns(uint index){
		return skuToDetail[sellerToSku[_sellerAddress][skuToDetail[_sku].sellerToSkuIndex]].sellerIndex;
	}
}