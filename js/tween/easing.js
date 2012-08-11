define(
    [
        "./easing/_base",
        
        // package modifiers
        "./easing/Linear",
        "./easing/Quadratic",
        "./easing/Cubic",
        "./easing/Quartic",
        "./easing/Quintic",
        "./easing/Sinusoidal",
        "./easing/Exponential",
        "./easing/Circular",
        "./easing/Elastic",
        "./easing/Back",
        "./easing/Bounce"
    ],
    function(easing) {
        
        ///////////////////////////////////////////////////////////////////////
        // convenience loader for all easing types
        //
        // all easing equations were adapted from jQuery's source
        
        return easing;
    }
);
