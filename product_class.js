"use strict";
/**
 *
 * Product is a Class for Product information and functionality
 *
 * @author      Andrew J McCauley <amccauley723@gmail.com>
 * @version     1.0
 *
 *
 *
 */
var Product = (function () {
    var PDP_DATA_URL = '/scripts/';

    /**
	*	@constructor
	*/
    function Product(sku) {
        this(sku, '');
    }

    /**
	*	@constructor
	*/
    function Product(sku, model, readyCallback, domain) {
        var dom = domain || document.domain;

        setDomain.call(this, dom);

        this._sku = sku;
        this._model = model;
        this._qty = 1;
        this._fulfillmentType = 'SHIP_TO_HOME';
        this._storeNumber = '00000';
        this._storeCostOfGoods = '0.00';

        this._readyCallback = readyCallback || function () { };

        getData.call(this);
    }

    function getData(sku) {
        if (typeof (window['model_' + this._model]) === 'undefined') {
            loadScript.call(this);
        }
    }

    function setDomain(domain) {
        this._domain = domain;
    }

    function loadScript() {

        var $this = this;

        var date = new Date();
        var timestamp = date.getFullYear() + '' + date.getDate() + '' + date.getMonth();

        this._modelData = {};
        this._skuData = {};

        $.ajax({
            method: 'get',
            dataType: 'script',
            cache: true,
            async: false,
            url: '//' + this._domain + PDP_DATA_URL + timestamp + '_' + this._model + '_pdp.js?cd=1m',
            beforeSend: function (jqXHR) {
                jqXHR.overrideMimeType("text/javascript; charset=iso-8859-1");
            },
            complete: function () {
                loadSkuData.call($this);
                $this._readyCallback();
            }
        });
    }

    function loadSkuData() {
        this._modelData = window['model_' + this._model];
        this._styles = window['styles_' + this._model];
        this._styleData = window['styles_' + this._model][this._sku];
        setOtherStyles.call(this, this._styles);
        buildProductObject.call(this);
    }

    function establishFunction(func) {
        if (typeof (window[func]) === 'undefined') {
            window[func] = function () { };
        }
    }

    function error(msg) {
        var error = {};
        error.message = msg;
        return error;
    }

    function setOtherStyles(styleObj) {
        var styles = [];
        for (var s in styleObj) {
            styles.push(s);
        }
        this._otherStyles = styles;
    }

    function getOtherStyles() {
        return this._otherStyles;
    }

    function getPrice() {
        var priceObj = {};
        if (typeof (this._selectedSize) !== 'undefined') {
            for (var s = 0; s < this._sizeData.length; s++) {
                if (this._selectedSize === this._sizeData[s].size) {
                    priceObj = getPriceObject.call(this._sizeData[s].listPrice, this._sizeData[s].salePrice);
                }
            }
        } else {
            priceObj = getPriceObject.call(this, this._styleData[5], this._styleData[6]);
        }
        return priceObj;
    }

    function getPriceObject(listPrice, salePrice) {
        var data = {};
        data.listPrice = listPrice;
        data.salePrice = salePrice;
        return data;
    }

    function getSizeObject(data) {
        var sizeInfo = new Object();
        sizeInfo.size = $.trim(data[0]);
        sizeInfo.listPrice = data[1];
        sizeInfo.salePrice = data[2];
        sizeInfo.UPC = data[7].toString().split(';')[0];
        sizeInfo.storeSKU = data[7].toString().split(';')[1];
        sizeInfo.isSFS = false;
        if (data[4].toLowerCase() == 'n' && data[5].toLowerCase() == 'y') {
            sizeInfo.isSFS = true;
        }
        return sizeInfo;
    }

    function createSizeObject() {

        var data = new Object();
        data.availableSizes = [];
        for (var a in this._modelData.AVAILABLE_SIZES) {
            data.availableSizes.push($.trim(this._modelData.AVAILABLE_SIZES[a]))
        }
        data.inStockSizes = {};
        var sizes = this._styleData[7];
        for (var s = 0; s < sizes.length; s++) {
            data.inStockSizes[$.trim(sizes[s][0])] = getSizeObject(sizes[s]);
        }
        return data;
    }

    function getProductData() {
        var $params = {};
        $params.data = {};

        // REQUIRED
        $params.data.model = getModelNumber.call(this);
        $params.data.sku = getProductNumber.call(this);
        $params.data.size = getSelectedSize.call(this);

        // OPTIONAL
        $params.data.qty = getQuantity.call(this);
        $params.data.lineItemId = this._lineItemId;
        $params.data.fulfillmentType = getFulfillmentType.call(this);
        $params.data.storeNumber = getStoreNumber.call(this);
        $params.data.storeCostOfGoods = getStoreCostOfGoods.call(this);

        $params.method = 'POST';
        return $params;
    }

    /* SELECTED SIZE */
    function setSelectedSize(size) {
        var response;
        if (typeof (getSizeData.call(this).inStockSizes[size]) === 'undefined') {
            response = error('Out Of Stock');
        } else {
            this._selectedSize = size;
            response = size;
        }
        return response;
    }

    function getSelectedSize() {
        return this._selectedSize;
    }

    /* QUANTITY */
    function setQuantity(quantity) {
        this._qty = quantity;
    }

    function getQuantity() {
        return this._qty;
    }

    function launchLegacyISA(page, callback) {
        var $this = this;
        var $page = page || 'pdp';
        var $callback = callback || function () { };
        establishFunction.call(this, 'showBubble');
        establishFunction.call(this, 'hideBubble');
        onFindStoreLinkClick();
        launchStorePickupOverlay('pdp', function (sku, size, qty, storeNumber, fulfillmentType, storeCostOfGoods) {
            ISACallback.call($this, sku, size, qty, storeNumber, fulfillmentType, storeCostOfGoods);
            $callback(sku, size, qty, storeNumber, fulfillmentType, storeCostOfGoods);
            return false;
        }, 0, 0);
    }

    function ISACallback(sku, size, qty, storeNumber, fulfillmentType, storeCostOfGoods) {
        setSelectedSize.call(this, size);
        setQuantity.call(this, qty);
        setStoreNumber.call(this, storeNumber);
        setFulFillmentType.call(this, fulfillmentType);
        setStoreCostOfGoods.call(this, storeCostOfGoods);
    }

    /* FULFILLMENT TYPE */
    function setFulFillmentType(fulfillmentType) {
        this._fulfillmentType = fulfillmentType;
    }

    function getFulfillmentType() {
        return this._fulfillmentType;
    }

    /* STORE NUMBER */
    function setStoreNumber(storeNumber) {
        this._storeNumber = storeNumber;
    }

    function getStoreNumber() {
        return this._storeNumber;
    }

    /* STORE COST OF GOODS */
    function setStoreCostOfGoods(storeCostOfGoods) {
        this._storeCostOfGoods = storeCostOfGoods;
    }

    function getStoreCostOfGoods() {
        return this._storeCostOfGoods;
    }

    /* MODEL NAME */
    function setModelName(name) {
        this._modelName = name;
    }
    function getModelName() {
        return this._modelName;
    }

    /* MODEL NUMBER */
    function setModelNumber(model) {
        this._model = model;
    }
    function getModelNumber() {
        return this._model;
    }

    /* PRODUCT NUMBER */
    function setProductNumber(sku) {
        this._sku = sku;
        loadSkuData.call(this);
    }
    function getProductNumber() {
        return this._sku;
    }

    /* DESCRIPTION */
    function setDescription(description) {
        this._description = description;
    }
    function getDescription() {
        return this._description;
    }

    /* PRICE */
    function setPrice(listPrice, salePrice) {
        this._price = { 'listPrice': listPrice, 'salePrice': salePrice };
    }
    function getPrice() {
        return this._price;
    }

    /* GENDERAGE */
    function setGenderAge(genderAge) {
        this._gender_age = genderAge;
    }
    function getGenderAge() {
        return this._gender_age;
    }

    /* SIZE DATA */
    function setSizeData() {
        this._sizeData = createSizeObject.call(this);
    }
    function getSizeData() {
        return this._sizeData;
    }

    /* SIZE CHART */
    function setSizeChart(chartId) {
        this._sizeChartID = chartId;
    }
    function getSizeChart() {
        return this._sizeChartID;
    }

    /* BRAND */
    function setBrand(brand) {
        this._brand = brand;
    }
    function getBrand() {
        return this._brand;
    }

    /* INTANGIBLE */
    function setIntangible(intangible) {
        this._isintangible = intangible;
    }
    function getIntangible() {
        return this._isintangible;
    }

    /* REVIEW COUNT */
    function setReviewCount(count) {
        this._reviewCount = count;
    }
    function getReviewCount() {
        return this._reviewCount;
    }

    /* RATING */
    function setRating(rating) {
        this._rating = rating;
    }
    function getRating() {
        return this._rating;
    }

    function buildProductObject() {
        setModelName.call(this, this._modelData.NM);
        setDescription.call(this, this._modelData.INET_COPY);
        setPrice.call(this, this._styleData[5], this._styleData[6]);
        setGenderAge.call(this, this._modelData.GENDER_AGE);
        setSizeData.call(this);
        setSizeChart.call(this, this._modelData.SIZECHART_CD);
        setBrand.call(this, this._modelData.BRAND);
        setIntangible.call(this, this._modelData.ISINTANGIBLE);
        setReviewCount.call(this, this._modelData.REVIEWS.TOTALREVIEWCOUNT);
        setRating.call(this, this._modelData.REVIEWS.WEIGHTEDAVERAGERATING);
    }

    function addToWishlist(callback) {

        getWishlist.call(this);

        /** SET DATA **/
        var $params = {};

        $params = $.extend(true, $params, getProductData.call(this));

        //$params.action = 'addItem';

        this._wishlist.addToWishlist($params, function (data) {
            callback(data);
        });
    }

    function addToCart(callback, form) {
        if (this._selectedSize !== '') {
            getCart.call(this);
            /** SET DATA **/
            var $params = {};

            $params.form = form || '';

            $params = $.extend(true, $params, getProductData.call(this));

            $params.action = 'add';

            this._cart.addToCart($params, function (data) {
                callback(data);
            });

        } else {
            console.log('NO SIZE');
        }
    }

    function getCart() {
        if (typeof (this._cart) !== 'Object') {
            this._cart = new Cart();
        }
    }

    function getWishlist() {
        if (typeof (this._wishlist) !== 'Object') {
            this._wishlist = new Wishlist();
        }
    }

    Product.prototype.setProductNumber = function (sku) {
        return setProductNumber.call(this, sku);
    };

    Product.prototype.getProductNumber = function () {
        return getProductNumber.call(this);
    };

    Product.prototype.getModelName = function () {
        return getModelName.call(this);
    };

    Product.prototype.getOtherStyles = function () {
        return getOtherStyles.call(this);
    };

    Product.prototype.getDescription = function () {
        return getDescription.call(this);
    };

    Product.prototype.getPrice = function () {
        return getPrice.call(this);
    };

    Product.prototype.getGenderAge = function () {
        return getGenderAge.call(this);
    };

    Product.prototype.getSizes = function () {
        return getSizeData.call(this);
    };

    Product.prototype.getSizeChart = function () {
        return getSizeChart.call(this);
    };

    Product.prototype.getBrand = function () {
        return getBrand.call(this);
    };

    Product.prototype.getIsIntangible = function () {
        return getIntangible.call(this);
    };

    Product.prototype.getReviewCount = function () {
        return getReviewCount.call(this);
    };

    Product.prototype.getRating = function () {
        return getRating.call(this);
    };

    Product.prototype.getSelectedSize = function () {
        return this._selectedSize;
    };

    Product.prototype.setSelectedSize = function (size) {
        return setSelectedSize.call(this, size);
    };

    Product.prototype.launchLegacyISA = function (page, callback) {
        launchLegacyISA.call(this, page, callback);
    };

    Product.prototype.getFulfillmentType = function () {
        return this._fulfillmentType;
    };

    Product.prototype.setFulfillmentType = function (fulFillmentType) {
        return setFulFillmentType.call(this, fulFillmentType);
    };

    Product.prototype.getStoreNumber = function () {
        return this._storeNumber;
    };

    Product.prototype.setStoreNumber = function (storeNumber) {
        return set.setStoreNumber(this, storeNumber);
    };

    Product.prototype.getStoreCostOfGoods = function () {
        return this._storeCostOfGoods;
    };

    Product.prototype.setStoreCostOfGoods = function (storeCostOfGoods) {
        return setStoreCostOfGoods.call(this, storeCostOfGoods);
    };

    Product.prototype.addToCart = function (callback) {
        addToCart.call(this, callback);
    };

    Product.prototype.addToCartLegacy = function (form, callback) {
        addToCart.call(this, callback, form);
    };

    Product.prototype.addToWishlist = function (callback) {
        if (typeof (callback) === 'function') {
            addToWishlist.call(this, callback);
        }
    };

    Product.prototype.setDomain = function (domain) {
        setDomain.call(this, domain);
    };

    return Product;
}());