define(
    [
        "dojo/_base/declare",
        "./_base",
    ],
    function(declare, base) {
        
        
        ///////////////////////////////////////////////////////////////////////
        // The SerializedMixin class, a simple mixin for adding serial numbers
        // to object instances.
        
        
        ///////////////////////////////////////////////////////////////////////
        // internal static data
        ///////////////////////////////////////////////////////////////////////
        
        // the serial number
        var serial = 1;
        
        
        ///////////////////////////////////////////////////////////////////////
        // SerializedMixin class
        ///////////////////////////////////////////////////////////////////////
        
        var SerializedMixin = declare(null, {
            
            ///////////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////////
            
            // the serial number
            _serial: null,
            
            
            ///////////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////////
            
            constructor: function() {
                
                this._serial = serial;
                serial += 1;
            },
            
            ///////////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////////
            
            getSerial: function() {
                
                return this._serial;
            }
        });
        
        
        // define the package structure
        base.SerializedMixin = SerializedMixin;
        return base.SerializedMixin;
    }
);