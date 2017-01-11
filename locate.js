/**
 *
 * Determines user location to display correct store data
 *
 * @author      Andrew J McCauley <amccauley723@gmail.com>
 * @version     1.0
 *
 *
 *
 */

var flLocate = {
    locationType: 'IP', // default to "IP" but can also be "Geo"
    locationHasChanged: 'false', // default is false, will be set to true is user location has updated from external script and store info needs to update again with new location data

    /**
     * Initial function to start flLocate logic
     * @param {string} locationType - looking for either "IP" or "Geo"
     */
    init: function(locationType) {
        //console.log('LOCATE FUNCTION: init');
        flLocate.locationType = locationType;
        flLocate.determineUserLocation(locationType);
    },

    /**
     * Handles all logic for determining what session storage data currently exists and of that data which one is the users current location
     * @param {string} locationType - looking for either "IP" or "Geo", optional
     */
    determineUserLocation: function(locationType) {
        //console.log('LOCATE FUNCTION: determineUserLocation');
        var lt = locationType || flLocate.locationType;
        // determine which data exists in session storage
        var userLocationInput = flLocate.getUserInputLocation();
        // check to see what current user current location is, used at end of function to determine if change has been made
        var userStartLocation = flLocate.getUserLocation();
        var myStore = utils.sessionStorage.getItem('userMyStore');

        if (userLocationInput) {
            flLocate.setUserLocation(userLocationInput);
        }


        if (!myStore) {
            flLocate.getMyStore(function(res) {
                if (!$.isEmptyObject(res)) {
                    flLocate.setMyStore(res);
                }

                if (!$.isEmptyObject(res) && !userLocationInput) {
                    flLocate.setUserLocation(res.Zipcode.toString().substring(0,5));
                }
            });
        }

        if (lt === 'IP') {
            if (!utils.sessionStorage.getItem('userMyStore') && !userLocationInput && !utils.sessionStorage.getItem('userIPLocation')) {
                flLocate.getUserIPLocation(function(res) {
                    if (res !== '') {
                        flLocate.setUserLocation(res.zip);
                    }
                });
            } else if (!utils.sessionStorage.getItem('userMyStore') && !userLocationInput && utils.sessionStorage.getItem('userIPLocation')) {
                var userIPLocation = JSON.parse(utils.sessionStorage.getItem('userIPLocation'));
                flLocate.setUserLocation(userIPLocation.zip);
            }
        } else if (lt === 'Geo') {
            // TODO get/set geo location data
            if (!utils.sessionStorage.getItem('userMyStore') && !userLocationInput && utils.sessionStorage.getItem('userGeoLocation')) {
                var userGeoLocation = utils.sessionStorage.getItem('userGeoLocation');
                flLocate.setUserLocation(userGeoLocation);
            }
        }

        // after a currentLocation is set, check to see if nearest stores should be updated
        if (!utils.sessionStorage.getItem('userNearestStores')) {
            // TODO should this happen on page load or be up to developers to request the info...?
        }

        var userEndLocation = flLocate.getUserLocation();

        if (userStartLocation != userEndLocation) {
            $(document).trigger('userLocation:update');
        }
    },

    /**
     * Checks for a session storage value for My Store information, if it doesn't exist will make an ajax request to location web service to find a My Store
     * @param {function} callback
     * @param {boolean} override - used to override session storage value and use the location web service to check for a new My Store location and save this value
     */
    getMyStore: function(callback, override) {
        var overrideSession = override || false;
        //console.log('LOCATE FUNCTION: getMyStore');
        var myStore = utils.sessionStorage.getItem('userMyStore');
        if (myStore && !overrideSession) {
            callback(JSON.parse(myStore));
        } else {
            $.getJSON('/storepickup/locations?action=getFavoriteLocations', function(res) {
                if (res.success && res.data.locations.length > 0) {
                    flLocate.setMyStore(res.data.locations[0]);
                    callback(res.data.locations[0]);
                } else {
                    if (res.data.locations.length === 0 && myStore && overrideSession) {
                        utils.sessionStorage.removeItem('userMyStore');
                    }
                    callback({});
                }
            });
        }
    },

    /**
     * Sets my store data in session storage
     * @param {object} data - my store data
     */
    setMyStore: function(data) {
        //console.log('LOCATE FUNCTION: setMyStore');
        utils.sessionStorage.setItem('userMyStore', JSON.stringify(data));
        flLocate.determineUserLocation();
        $(document).trigger('myStore:update');
    },

    /**
     * Sets last store added to cart from mobile isa in session storage
     * @param {object} data - my store data
     */

    setLastStoreAddedFromISA: function(data){
        // TODO add added to cart store session data
        utils.sessionStorage.setItem('lastStoreAddedToCartFromISA', data);
    },

    /**
     * Returns user postal value from session storage
     * @returns {string}
     */
    getUserLocation: function() {
        return utils.sessionStorage.getItem('userCurrentLocation');
    },

    /**
     * Saves user location value to session storage
     * @param {string} location
     */
    setUserLocation: function(location) {
        //console.log('LOCATE FUNCTION: setUserLocation');
        utils.sessionStorage.setItem('userCurrentLocation', location);
    },

    /**
     * Returns user manually entered location value
     * @returns {string}
     */
    getUserInputLocation: function() {
        return utils.sessionStorage.getItem('userLocationInput');
    },

    /**
     *
     * @param userInput
     */
    setUserInputLocation: function(userInput) {
        utils.sessionStorage.setItem('userLocationInput', userInput);
        flLocate.determineUserLocation();
    },

    getUserIPLocation: function(callback) {
        //console.log('LOCATE FUNCTION: getUserIPLocation');
        $.getJSON('/locator/locations?action=getGeoLocation&cd=0', function(res) {
            var r = res;
            if (!$.isEmptyObject(res)) {
                res.zip = res.zip.substring(0, 5);
                flLocate.setUserIPLocation(res);
                callback(res);
            } else {             
                var loc = window.location.host;    
                    callback('');       
            }
        });
    },

    /**
     * Set User IP location in session storage
     * @param {object} data - IP location response data
     */
    setUserIPLocation: function(data) {
        //console.log('LOCATE FUNCTION: setUserIPLocation');
        utils.sessionStorage.setItem('userIPLocation', JSON.stringify(data));
        flLocate.determineUserLocation();
    },

    /**
     * Function that uses navigator geolocation functionality to get current geo properties. Accepts success and error callbacks to handle success data and different error codes
     * @param {function} successCB - on success calls callback function and passes position data as parameter
     * @param {function} errorCB - on error calls error callback function and passes in error code object as parameter
     */
    getUserGeoLocation: function(successCB, errorCB) {
        //console.log('LOCATE FUNCTION: getUserGeoLocation');
        window.navigator.geolocation.getCurrentPosition(successCB, errorCB);
    },

    /**
     * Set User Geo location in session storage
     * @param {string} postal - postal code
     */
    setUserGeoLocation: function(postal) {
        //console.log('LOCATE FUNCTION: setUserGeoLocation');
        utils.sessionStorage.setItem('userGeoLocation', postal);
        flLocate.determineUserLocation();
    },

    /**
     * Function that accepts multiple parameters used in ajax request for store data from perpetual inventory web service
     * @param {string} latLong - latitude and longitude parameters in string ready for ajax request
     * @param {number} sku - current sku value
     * @param {string} size - current size selected value
     * @param {function} callback - callback function that accepts response value for parameter
     */
    getStoresForProduct: function (latLong, sku, size, callback) {
        //console.log('LOCATE FUNCTION: getStoreForProduct');
        $.getJSON('/storepickup/locations?action=getRequestKey', function (data) {
            var requestKey = data.nextRequestKey;

            var testURL = '/storepickup/locations?action=getLocations&latlng=' + latLong + '&sku=' + sku + '&size=' + size + '&favStores=false&requestKey=' + requestKey;
            // testURL = '/locator/locations?action=getStores&latlng=" + latLong + "&sku=" + sku + "&size=" + size + "&requestKey='

            $.getJSON(testURL, function (res) {
                //console.log(res.data.locations);
                callback(res.data.locations);
            });
        });

    },

    /**
     * Function that accepts multiple parameters used in ajax request for store data from perpetual inventory web service
     * @param {string} latLong - latitude and longitude parameters in string ready for ajax request
     * @param {function} callback - callback function that accepts response value for parameter
     */
    getStoresForLocation: function (latLong, callback) {
        //console.log('LOCATE FUNCTION: getStoresForLocation');
        var stores = utils.sessionStorage.getItem('nearestStores');

        if (!stores) {
            $.getJSON('/storepickup/locations?action=getRequestKey', function (data) {
                var requestKey = data.nextRequestKey;

                var testURL = '/storepickup/locations?action=getLocations&latlng=' + latLong + '&favStores=false&requestKey=' + requestKey;
                // testURL = '/locator/locations?action=getStores&latlng=" + latLong + "&sku=" + sku + "&size=" + size + "&requestKey='

                $.getJSON(testURL, function (res) {
                    flLocate.setNearestStores(res.data.locations);
                    callback(res.data.locations);
                });
            });
        } else {
            callback(JSON.parse(stores));
        }

    },

    /**
     * Sets nearest store data in session storage
     * @param {object} data
     */
    setNearestStores: function(data) {
        //console.log('LOCATE FUNCTION: setNearestStores');
        utils.sessionStorage.setItem('nearestStores', JSON.stringify(data));
    },

    /**
     * Function that takes a postal value and attempts to convert this value to latitude and longitude values
     * @param {number} postal - user input for location
     * @param {function} callback - callback that with latitude/longitude as parameters
     */
    convertPostalToLatLong: function(postal, callback) {
        //console.log('LOCATE FUNCTION: convertPostalToLatLong');
        var region = locale.split('_')[1] === 'CA' ? 'ca' : 'us';
        
        flMapApi.geocode({'address': postal, 'region' : region}, function(results){
            var latLong = flMapApi.latLngToString(results.latLng);
            callback(latLong);
        }, function(){
            callback('');
        });
    },

    /**
     * Function accepts latitude and longitude, uses google maps api to get location and calls callback function with postal code as parameter
     * @param {number} lat - latitude value
     * @param {number} long - longitude value
     * @param {function} callback - callback that receives postal code as parameter
     */
    convertLatLongToPostal: function(lat, long, callback) {
        //console.log('LOCATE FUNCTION: convertLatLongToPostal');
        
        /* This block has to be updated to use the Map Wrapper.
        $.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+lat+','+long+'&sensor=true').done(function(res) {
            console.log(res);
            var postal = res.results[2].address_components[0].short_name;
            callback(postal);
        });
        */
    },

    /**
     * Utilizes location web service to set a new My Store for the customer
     * @param {string} id - store number
     * @param {boolean} refresh - refreshes page if true
     * @param {function} callback
     */
    addMyStore : function(id, refresh, callback) {
        var cb = callback || function(){};
        $.ajax({
            url: '/storepickup/locations?action=setFavoriteStore&storeNumber=' + id + '&mode=override',
            dataType: 'json',
            method: 'get',
            async: false,
            success: function(d) {
                flLocate.getMyStore(function(res) {
                    if(refresh) {
                        location.reload();
                    }
                    cb(d);
                }, true);
            },
            error: function(e) {
                //console.log(e);
                callback('error', e);
            }
        });

        flLocate.determineUserLocation();
    }

};