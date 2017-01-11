/**
 *
 * Methods for managing local storage data
 *
 * @author      Andrew J McCauley <amccauley723@gmail.com>
 * @version     1.0
 *
 *
 *
 */

(function($) {
    var methods = {
        create : function(name, value) {
            if (typeof(Storage) !== "undefined" && methods.hasLocalStorage()) {
                localStorage.setItem(name, value);
            } else {
                $.cookie("create", name, value, 180);
            }
        },
        read : function(name) {
            if (typeof(Storage) !== "undefined" && methods.hasLocalStorage()) {
                return localStorage.getItem(name);
            } else {
                return $.cookie("read", name);
            }
        },
        destroy : function(name) {
            if (typeof(Storage) !== "undefined" && methods.hasLocalStorage()) {
                localStorage.removeItem(name);
            } else {
                $.cookie("destroy", name);
            }
        },
        hasLocalStorage : function() {
            try {
                localStorage.setItem("storage", "");
                localStorage.removeItem("storage");
                storageImpl = true;
            }
            catch(err) {
                storageImpl = false;
            }
            return storageImpl;
        }
    };

    $.localStorage = function(method) {
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.localStorage' );
        }
    };
})(jQuery);