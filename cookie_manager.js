/**
 *
 * Methods for managing cookie data
 *
 * @author      Andrew J McCauley <amccauley723@gmail.com>
 * @version     1.0
 *
 *
 *
 */

(function($) {
    var methods = {
        create : function(name, value, days) {
            var expires;
            if (days) {
                var date = new Date();
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                expires = "; expires=" + date.toGMTString();
            }
            else expires = "";
            document.cookie = name + "=" + value + expires + "; path=/";
        },
        read : function(name) {
            c_name = name;
            if (document.cookie.length > 0) {
                c_start = document.cookie.indexOf(name + "=");
                if (c_start != -1) {
                    c_start = c_start + c_name.length + 1;
                    c_end = document.cookie.indexOf(";", c_start);
                    if (c_end == -1) {
                        c_end = document.cookie.length;
                    }
                    return unescape(document.cookie.substring(c_start, c_end));
                }
            }
            return "";
        },
        destroy : function(name) {
            document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/';
        }
    };

    $.cookie = function(method) {
        // Method calling logic
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.cookie' );
        }
    };
})(jQuery);