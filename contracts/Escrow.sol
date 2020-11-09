pragma solidity ^0.4.21;
import "./User.sol";
import "./Product.sol";

contract Escrow{
	User private user;
	Product private product;

	struct EscrowStruct{
		int qty;
		uint totalItemPrice;
		bytes32 deadline;
		uint state;
		int fixBuyer;
		uint idr;
		uint index;
		uint skuIndex;
		uint sellerIndex;
		uint skuToInvoiceIndex;
		uint sellerToInvoiceIndex;
	}
	struct BuyerStruct{
		bytes32 paymentDateTime;
		uint itemPrice;
		bytes32 estimate;
		uint shippingFee;
		bytes32 waybill;
		uint note;
		uint buyerIndex;
		uint invoiceToBuyerIndex;
		uint buyerToInvoiceIndex;
	}
	uint contractBalance;
	bytes32[] invoice;
	address private owner;
	mapping(bytes32 => EscrowStruct) private invoiceToDetail;
	mapping(bytes32 => BuyerStruct[]) private invoiceToBuyer;
	mapping(bytes32 => bytes32[]) private skuToInvoice;
	mapping(address => bytes32[]) private sellerToInvoice;
	mapping(address => bytes32[]) private buyerToInvoice;

	event NewTrx(bytes32 indexed invoice, uint index, bytes32 sku, int qty, bytes32 deadline);
	event UpdateTrx(bytes32 indexed invoice, uint index, address buyerAddress, bytes32 paymentDateTime, bytes32 estimate, uint shippingFee, uint pay);
	event ConfirmSent(bytes32 indexed invoice, uint invoiceToBuyerIndex, address buyerAddress, bytes32 waybill, uint pay);
	event ConfirmReceived(bytes32 indexed invoice, uint totalItemPrice, uint invoiceToBuyerIndex, address buyerAddress, uint pay);
	event AbortTrx(bytes32 indexed invoice, uint invoiceToBuyerIndex, address buyerAddress, uint pay);
	event FailedTrx(bytes32 indexed invoice);
	event ComplainTrx(bytes32 indexed invoice, uint invoiceToBuyerIndex, address buyerAddress, uint pay);

	modifier onlyOwner(){
		require (msg.sender == owner);
		_;	
	}

	function Escrow(address _userAddress, address _productAddress) public{
		user = User(_userAddress);
		product = Product(_productAddress);
		owner = msg.sender;
	}

	function createInvoice(
		bytes32 _invoice,
		int _qty,
		uint _idr,
		bytes32 _deadline,
		bytes32 _sku,
		address _seller) public payable returns(bool success)
	{
		require(product.getStockByIndex(product.getIndexBySku(_sku)) >= _qty);

		invoiceToDetail[_invoice].qty = _qty;
		invoiceToDetail[_invoice].totalItemPrice = 0;
		invoiceToDetail[_invoice].deadline = _deadline;
		invoiceToDetail[_invoice].state = 1;
		invoiceToDetail[_invoice].fixBuyer = 0;
		invoiceToDetail[_invoice].idr = _idr;
		invoiceToDetail[_invoice].index = invoice.push(_invoice)-1;
		invoiceToDetail[_invoice].skuIndex = product.getIndexBySku(_sku);
		invoiceToDetail[_invoice].skuToInvoiceIndex = skuToInvoice[_sku].push(_invoice)-1;
		invoiceToDetail[_invoice].sellerIndex = product.getSellerIndexByAddress(_seller, _sku);
		invoiceToDetail[_invoice].sellerToInvoiceIndex = sellerToInvoice[_seller].push(_invoice)-1;

		product.updateStock(_seller, _sku, -1*_qty);

		emit NewTrx(_invoice, invoiceToDetail[_invoice].index, _sku, _qty, _deadline);

		return true;
	}

	function addInvoice(
		bytes32 _invoice,
		address _buyer,
		bytes32 _paymentDateTime,
		uint _itemPrice,
		bytes32 _estimate,
		uint _shippingFee) public payable returns(bool success)
	{
		require(invoiceToDetail[_invoice].state == 1);
		require (invoiceToDetail[_invoice].fixBuyer < invoiceToDetail[_invoice].qty);
		require(msg.sender.balance > _itemPrice+_shippingFee && msg.value == _itemPrice+_shippingFee);

		contractBalance += msg.value;

		invoiceToDetail[_invoice].fixBuyer += 1;

		invoiceToBuyer[_invoice].push(BuyerStruct({
			paymentDateTime: _paymentDateTime,
			itemPrice: _itemPrice,
			estimate: _estimate,
			shippingFee: _shippingFee,
			waybill: "-",
			note: 0,
			buyerIndex: user.getIndexByAddress(_buyer),
			buyerToInvoiceIndex: buyerToInvoice[_buyer].push(_invoice)-1,
			invoiceToBuyerIndex: invoiceToBuyer[_invoice].length
		}));

		emit UpdateTrx(_invoice, invoiceToDetail[_invoice].index, _buyer, _paymentDateTime,	_estimate, _shippingFee, _itemPrice+_shippingFee);

		return true;
	}

	function aborted(bytes32 _invoice, uint _index) public returns(bool success){
		require (invoiceToBuyer[_invoice][_index].note == 0);
		
		uint amount = invoiceToBuyer[_invoice][_index].itemPrice+invoiceToBuyer[_invoice][_index].shippingFee;
		address buyer = user.getAddressByIndex(invoiceToBuyer[_invoice][_index].buyerIndex);

		buyer.transfer(amount);
		contractBalance -= amount;
		invoiceToDetail[_invoice].totalItemPrice -= invoiceToBuyer[_invoice][_index].itemPrice;
		invoiceToDetail[_invoice].fixBuyer -= 1;
		invoiceToBuyer[_invoice][_index].note = 3;

		if(invoiceToDetail[_invoice].state == 1  &&  invoiceToDetail[_invoice].fixBuyer == 0){
			// restore stock
			product.updateStock(getSellerByInvoiceIndex(invoiceToDetail[_invoice].index), getSkuByInvoiceIndex(invoiceToDetail[_invoice].index), invoiceToDetail[_invoice].qty);

			// change state
			invoiceToDetail[_invoice].state = 0;
		}

		emit AbortTrx(_invoice, _index, user.getAddressByIndex(invoiceToBuyer[_invoice][_index].buyerIndex),
			invoiceToBuyer[_invoice][_index].itemPrice+invoiceToBuyer[_invoice][_index].shippingFee);

		return true;
	}

	function failed(bytes32 _invoice) public returns(bool success){
		// restore stock
		product.updateStock(getSellerByInvoiceIndex(invoiceToDetail[_invoice].index), getSkuByInvoiceIndex(invoiceToDetail[_invoice].index), invoiceToDetail[_invoice].qty);	

		//change state
		invoiceToDetail[_invoice].state = 0;

		emit FailedTrx(_invoice);

		return true;
	}

	function confirmSent(bytes32 _invoice, uint _index, bytes32 _waybill) public returns(bool success){
		require (invoiceToDetail[_invoice].fixBuyer == invoiceToDetail[_invoice].qty);
		require (invoiceToDetail[_invoice].state == 1 && invoiceToBuyer[_invoice][_index].note == 0);

		invoiceToBuyer[_invoice][_index].note = 1;
		invoiceToBuyer[_invoice][_index].waybill = _waybill;

		emit ConfirmSent(_invoice, _index, user.getAddressByIndex(invoiceToBuyer[_invoice][_index].buyerIndex),
			_waybill, invoiceToBuyer[_invoice][_index].itemPrice+invoiceToBuyer[_invoice][_index].shippingFee);

		return true;
	}

	function confirmReceived(bytes32 _invoice, uint _index) public returns(bool success){
		require (invoiceToDetail[_invoice].state == 1 && invoiceToBuyer[_invoice][_index].note == 1);

		uint amount = invoiceToBuyer[_invoice][_index].itemPrice+invoiceToBuyer[_invoice][_index].shippingFee;
		address seller = product.getSellerBySellerIndex(invoiceToDetail[_invoice].sellerIndex);

		seller.transfer(amount);
		contractBalance -= amount;
		invoiceToDetail[_invoice].totalItemPrice += invoiceToBuyer[_invoice][_index].itemPrice;

		invoiceToBuyer[_invoice][_index].note = 2;

		emit ConfirmReceived(_invoice, invoiceToDetail[_invoice].totalItemPrice, _index, user.getAddressByIndex(invoiceToBuyer[_invoice][_index].buyerIndex),
			invoiceToBuyer[_invoice][_index].itemPrice+invoiceToBuyer[_invoice][_index].shippingFee);

		return true;
	}

	function complain(bytes32 _invoice, uint _index) public returns(bool success){
		require (invoiceToDetail[_invoice].state == 1 && invoiceToBuyer[_invoice][_index].note == 1);
		
		uint amount = invoiceToBuyer[_invoice][_index].itemPrice;
		uint fee = invoiceToBuyer[_invoice][_index].shippingFee;

		address buyer = user.getAddressByIndex(invoiceToBuyer[_invoice][_index].buyerIndex);
		address seller = product.getSellerBySellerIndex(invoiceToDetail[_invoice].sellerIndex);

		buyer.transfer(amount);
		seller.transfer(fee);
		contractBalance -= (amount+fee);

		invoiceToBuyer[_invoice][_index].note = 3;

		emit ComplainTrx(_invoice, _index, user.getAddressByIndex(invoiceToBuyer[_invoice][_index].buyerIndex),
			invoiceToBuyer[_invoice][_index].itemPrice);

		return true;
	}

	// Get Contract Balance
	function getContractBalance() public view returns(uint count){
		return contractBalance;
	}

	// Get Invoice Count
	function getInvoiceCount() public view returns(uint count){
		return invoice.length;
	}

	function getInvoiceCountBySeller(address _sellerAddress) public view returns(uint count){
		return sellerToInvoice[_sellerAddress].length;
	}

	function getInvoiceCountByBuyer(address _buyerAddress) public view returns(uint count){
		return buyerToInvoice[_buyerAddress].length;
	}

	function getInvoiceCountBySku(bytes32 _sku) public view returns(uint count){
		return skuToInvoice[_sku].length;
	}

	// Get Invoice To Buyer Count
	function getInvoiceToBuyerCount(bytes32 _invoice) public view returns(uint count){
		return invoiceToBuyer[_invoice].length;
	}

	// Get Invoice
	function getInvoiceByInvoiceIndex(uint _index) public view returns(bytes32 invoiceCode){
		return invoice[_index];
	}

	function getInvoiceBySkuToInvoiceIndex(bytes32 _sku, uint _index) public view returns(bytes32 invoiceCode){
		return skuToInvoice[_sku][_index];
	}

	function getInvoiceBySellerToInvoiceIndex(address _sellerAddress, uint _index) public view returns(bytes32 invoiceCode){
		return sellerToInvoice[_sellerAddress][_index];
	}

	function getInvoiceByBuyerToInvoiceIndex(address _buyerAddress, uint _index) public view returns(bytes32 invoiceCode){
		return buyerToInvoice[_buyerAddress][_index];
	}

	// Get Qty
	function getQtyByInvoiceIndex(uint _index) public view returns(int qty){
		return invoiceToDetail[invoice[_index]].qty;
	}

	function getQtyBySkuToInvoiceIndex(bytes32 _sku, uint _index) public view returns(int qty){
		return invoiceToDetail[skuToInvoice[_sku][_index]].qty;
	}

	function getQtyBySellerToInvoiceIndex(address _sellerAddress, uint _index) public view returns(int qty){
		return invoiceToDetail[sellerToInvoice[_sellerAddress][_index]].qty;
	}

	function getQtyByBuyerToInvoiceIndex(address _buyerAddress, uint _index) public view returns(int qty){
		return invoiceToDetail[buyerToInvoice[_buyerAddress][_index]].qty;
	}

	// Get Total Item Price
	function getTotalItemPriceByInvoiceIndex(uint _index) public view returns(uint totalItemPrice){
		return invoiceToDetail[invoice[_index]].totalItemPrice;
	}

	function getTotaltemPriceIBySkuToInvoiceIndex(bytes32 _sku, uint _index) public view returns(uint totalItemPrice){
		return invoiceToDetail[skuToInvoice[_sku][_index]].totalItemPrice;
	}	

	function getTotalItemPriceBySellerToInvoiceIndex(address _sellerAddress, uint _index) public view returns(uint totalItemPrice){
		return invoiceToDetail[sellerToInvoice[_sellerAddress][_index]].totalItemPrice;
	}

	function getTotalItemPriceByBuyerToInvoiceIndex(address _buyerAddress, uint _index) public view returns(uint totalItemPrice){
		return invoiceToDetail[buyerToInvoice[_buyerAddress][_index]].totalItemPrice;
	}

	// Get Deadline
	function getDeadlineByInvoiceIndex(uint _index) public view returns(bytes32 deadline){
		return invoiceToDetail[invoice[_index]].deadline;
	}

	function getDeadlineBySkuToInvoiceIndex(bytes32 _sku, uint _index) public view returns(bytes32 deadline){
		return invoiceToDetail[skuToInvoice[_sku][_index]].deadline;
	}

	function getDeadlineBySellerToInvoiceIndex(address _sellerAddress, uint _index) public view returns(bytes32 deadline){
		return invoiceToDetail[sellerToInvoice[_sellerAddress][_index]].deadline;
	}

	function getDeadlineByBuyerToInvoiceIndex(address _buyerAddress, uint _index) public view returns(bytes32 deadline){
		return invoiceToDetail[buyerToInvoice[_buyerAddress][_index]].deadline;
	}

	// Get State
	function getStateByInvoiceIndex(uint _index) public view returns(uint state){
		return invoiceToDetail[invoice[_index]].state;
	}

	function getStateBySkuToInvoiceIndex(bytes32 _sku, uint _index) public view returns(uint state){
		return invoiceToDetail[skuToInvoice[_sku][_index]].state;
	}

	function getStateBySellerToInvoiceIndex(address _sellerAddress, uint _index) public view returns(uint state){
		return invoiceToDetail[sellerToInvoice[_sellerAddress][_index]].state;
	}

	function getStateByBuyerToInvoiceIndex(address _buyerAddress, uint _index) public view returns(uint state){
		return invoiceToDetail[buyerToInvoice[_buyerAddress][_index]].state;
	}

	// Get Fix Buyer
	function getFixBuyerByInvoiceIndex(uint _index) public view returns(int fixBuyer){
		return invoiceToDetail[invoice[_index]].fixBuyer;
	}

	function getFixBuyerBySkuToInvoiceIndex(bytes32 _sku, uint _index) public view returns(int fixBuyer){
		return invoiceToDetail[skuToInvoice[_sku][_index]].fixBuyer;
	}

	function getFixBuyerBySellerToInvoiceIndex(address _sellerAddress, uint _index) public view returns(int fixBuyer){
		return invoiceToDetail[sellerToInvoice[_sellerAddress][_index]].fixBuyer;
	}

	function getFixBuyerByBuyerToInvoiceIndex(address _buyerAddress, uint _index) public view returns(int fixBuyer){
		return invoiceToDetail[buyerToInvoice[_buyerAddress][_index]].fixBuyer;
	}

	// Get Idr
	function getIdrByInvoiceIndex(uint _index) public view returns(uint rupiah){
		return invoiceToDetail[invoice[_index]].idr;
	}

	function getIdrBySkuToInvoiceIndex(bytes32 _sku, uint _index) public view returns(uint rupiah){
		return invoiceToDetail[skuToInvoice[_sku][_index]].idr;
	}

	function getIdrBySellerToInvoiceIndex(address _sellerAddress, uint _index) public view returns(uint rupiah){
		return invoiceToDetail[sellerToInvoice[_sellerAddress][_index]].idr;
	}

	function getIdrByBuyerToInvoiceIndex(address _buyerAddress, uint _index) public view returns(uint rupiah){
		return invoiceToDetail[buyerToInvoice[_buyerAddress][_index]].idr;
	}

	// Get SKU
	function getSkuByInvoiceIndex(uint _index) public view returns(bytes32 sku){
		return product.getSkuByIndex(invoiceToDetail[invoice[_index]].skuIndex);
	}

	function getSkuBySellerToInvoiceIndex(address _sellerAddress, uint _index) public view returns(bytes32 sku){
		return product.getSkuByIndex(invoiceToDetail[sellerToInvoice[_sellerAddress][_index]].skuIndex);
	}

	function getSkuBySkuToInvoiceIndex(bytes32 _sku, uint _index) public view returns(bytes32 sku){
		return product.getSkuByIndex(invoiceToDetail[skuToInvoice[_sku][_index]].skuIndex);
	}

	function getSkuByBuyerToInvoiceIndex(address _buyerAddress, uint _index) public view returns(bytes32 sku){
		return product.getSkuByIndex(invoiceToDetail[buyerToInvoice[_buyerAddress][_index]].skuIndex);
	}

	// Get Seller
	function getSellerByInvoiceIndex(uint _index) public view returns(address sellerAddress){
		return product.getSellerByIndex(invoiceToDetail[invoice[_index]].sellerIndex);
	}

	function getSellerBySkuToInvoiceIndex(bytes32 _sku, uint _index) public view returns(address sellerAddress){
		return product.getSellerByIndex(invoiceToDetail[skuToInvoice[_sku][_index]].sellerIndex);
	}

	function getSellerBySellerToInvoiceIndex(address _sellerAddress, uint _index) public view returns(address sellerAddress){
		return product.getSellerByIndex(invoiceToDetail[sellerToInvoice[_sellerAddress][_index]].sellerIndex);
	}
	
	function getSellerByBuyerToInvoiceIndex(address _buyerAddress, uint _index) public view returns(address sellerAddress){
		return product.getSellerByIndex(invoiceToDetail[buyerToInvoice[_buyerAddress][_index]].sellerIndex);
	}

	// Get Payment Date Time
	function getPaymentDateTimeByInvoiceIndex(uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 paymentDateTime){
		return invoiceToBuyer[getInvoiceByInvoiceIndex(_index)][_invoiceToBuyerIndex].paymentDateTime;
	}

	function getPaymentDateTimeBySkuToInvoiceIndex(bytes32 _sku, uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 paymentDateTime){
		return invoiceToBuyer[getInvoiceBySkuToInvoiceIndex(_sku, _index)][_invoiceToBuyerIndex].paymentDateTime;
	}

	function getPaymentDateTimeBySellerToInvoiceIndex(address _sellerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 paymentDateTime){
		return invoiceToBuyer[getInvoiceBySellerToInvoiceIndex(_sellerAddress, _index)][_invoiceToBuyerIndex].paymentDateTime;
	}

	function getPaymentDateTimeByBuyerToInvoiceIndex(address _buyerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 paymentDateTime){
		return invoiceToBuyer[getInvoiceByBuyerToInvoiceIndex(_buyerAddress, _index)][_invoiceToBuyerIndex].paymentDateTime;
	}

	// Get Item Price
	function getItemPriceByInvoiceIndex(uint _index, uint _invoiceToBuyerIndex) public view returns(uint itemPrice){
		return invoiceToBuyer[getInvoiceByInvoiceIndex(_index)][_invoiceToBuyerIndex].itemPrice;
	}

	function getItemPriceBySkuToInvoiceIndex(bytes32 _sku, uint _index, uint _invoiceToBuyerIndex) public view returns(uint itemPrice){
		return invoiceToBuyer[getInvoiceBySkuToInvoiceIndex(_sku, _index)][_invoiceToBuyerIndex].itemPrice;
	}

	function getItemPriceBySellerToInvoiceIndex(address _sellerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(uint itemPrice){
		return invoiceToBuyer[getInvoiceBySellerToInvoiceIndex(_sellerAddress, _index)][_invoiceToBuyerIndex].itemPrice;
	}

	function getItemPriceByBuyerToInvoiceIndex(address _buyerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(uint itemPrice){
		return invoiceToBuyer[getInvoiceByBuyerToInvoiceIndex(_buyerAddress, _index)][_invoiceToBuyerIndex].itemPrice;
	}

	// Get Estimate
	function getEstimateByInvoiceIndex(uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 estimate){
		return invoiceToBuyer[getInvoiceByInvoiceIndex(_index)][_invoiceToBuyerIndex].estimate;
	}

	function getEstimateBySkuToInvoiceIndex(bytes32 _sku, uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 estimate){
		return invoiceToBuyer[getInvoiceBySkuToInvoiceIndex(_sku, _index)][_invoiceToBuyerIndex].estimate;
	}

	function getEstimateBySellerToInvoiceIndex(address _sellerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 estimate){
		return invoiceToBuyer[getInvoiceBySellerToInvoiceIndex(_sellerAddress, _index)][_invoiceToBuyerIndex].estimate;
	}

	function getEstimateByBuyerToInvoiceIndex(address _buyerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 estimate){
		return invoiceToBuyer[getInvoiceByBuyerToInvoiceIndex(_buyerAddress, _index)][_invoiceToBuyerIndex].estimate;
	}

	// Get Shipping Fee
	function getShippingFeeByInvoiceIndex(uint _index, uint _invoiceToBuyerIndex) public view returns(uint shippingFee){
		return invoiceToBuyer[getInvoiceByInvoiceIndex(_index)][_invoiceToBuyerIndex].shippingFee;
	}

	function getShippingFeeBySkuToInvoiceIndex(bytes32 _sku, uint _index, uint _invoiceToBuyerIndex) public view returns(uint shippingFee){
		return invoiceToBuyer[getInvoiceBySkuToInvoiceIndex(_sku, _index)][_invoiceToBuyerIndex].shippingFee;
	}

	function getShippingFeeBySellerToInvoiceIndex(address _sellerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(uint shippingFee){
		return invoiceToBuyer[getInvoiceBySellerToInvoiceIndex(_sellerAddress, _index)][_invoiceToBuyerIndex].shippingFee;
	}

	function getShippingFeeByBuyerToInvoiceIndex(address _buyerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(uint shippingFee){
		return invoiceToBuyer[getInvoiceByBuyerToInvoiceIndex(_buyerAddress, _index)][_invoiceToBuyerIndex].shippingFee;
	}

	// Get Note
	function getNoteByInvoiceIndex(uint _index, uint _invoiceToBuyerIndex) public view returns(uint note){
		return invoiceToBuyer[getInvoiceByInvoiceIndex(_index)][_invoiceToBuyerIndex].note;
	}

	function getNoteBySkuToInvoiceIndex(bytes32 _sku, uint _index, uint _invoiceToBuyerIndex) public view returns(uint note){
		return invoiceToBuyer[getInvoiceBySkuToInvoiceIndex(_sku, _index)][_invoiceToBuyerIndex].note;
	}

	function getNoteBySellerToInvoiceIndex(address _sellerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(uint note){
		return invoiceToBuyer[getInvoiceBySellerToInvoiceIndex(_sellerAddress, _index)][_invoiceToBuyerIndex].note;
	}

	function getNoteByBuyerToInvoiceIndex(address _buyerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(uint note){
		return invoiceToBuyer[getInvoiceByBuyerToInvoiceIndex(_buyerAddress, _index)][_invoiceToBuyerIndex].note;
	}

	// Get Waybill
	function getWaybillByInvoiceIndex(uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 waybill){
		return invoiceToBuyer[getInvoiceByInvoiceIndex(_index)][_invoiceToBuyerIndex].waybill;
	}

	function getWaybillBySkuToInvoiceIndex(bytes32 _sku, uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 waybill){
		return invoiceToBuyer[getInvoiceBySkuToInvoiceIndex(_sku, _index)][_invoiceToBuyerIndex].waybill;
	}

	function getWaybillBySellerToInvoiceIndex(address _sellerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 waybill){
		return invoiceToBuyer[getInvoiceBySellerToInvoiceIndex(_sellerAddress, _index)][_invoiceToBuyerIndex].waybill;
	}

	function getWaybillByBuyerToInvoiceIndex(address _buyerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(bytes32 waybill){
		return invoiceToBuyer[getInvoiceByBuyerToInvoiceIndex(_buyerAddress, _index)][_invoiceToBuyerIndex].waybill;
	}

	// Get Buyer
	function getBuyerByInvoiceIndex(uint _index, uint _invoiceToBuyerIndex) public view returns(address buyerAddress){
		return user.getAddressByIndex(invoiceToBuyer[getInvoiceByInvoiceIndex(_index)][_invoiceToBuyerIndex].buyerIndex);
	}

	function getBuyerBySkuToInvoiceIndex(bytes32 _sku, uint _index, uint _invoiceToBuyerIndex) public view returns(address buyerAddress){
		return user.getAddressByIndex(invoiceToBuyer[getInvoiceBySkuToInvoiceIndex(_sku, _index)][_invoiceToBuyerIndex].buyerIndex);
	}

	function getBuyerBySellerToInvoiceIndex(address _sellerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(address buyerAddress){
		return user.getAddressByIndex(invoiceToBuyer[getInvoiceBySellerToInvoiceIndex(_sellerAddress, _index)][_invoiceToBuyerIndex].buyerIndex);
	}

	function getBuyerByInvoiceToBuyerIndex(address _buyerAddress, uint _index, uint _invoiceToBuyerIndex) public view returns(address buyerAddress){
		return user.getAddressByIndex(invoiceToBuyer[getInvoiceByBuyerToInvoiceIndex(_buyerAddress, _index)][_invoiceToBuyerIndex].buyerIndex);
	}
}	
