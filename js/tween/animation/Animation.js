define(
    [
        "dojo/_base/declare",
        "./_base",
        "./engine"
    ],
    function(declare, base, engine) {
        
        
        ///////////////////////////////////////////////////////////////////////
        // The Animation class, an abstraction for any kind of timed animation.
        // 
        // It supports basic animation configurations for delay, duration,
        // framerate and easing, It has an API to control playing, reversing,
        // stopping and advancing play to a specific percentage. It also
        // supports callbacks for various play, reverse and updates
        // (see details below).
        
        
        ///////////////////////////////////////////////////////////////////////
        // internal static constants
        ///////////////////////////////////////////////////////////////////////
        
        var AnimationState = {
            paused: 0,
            playing: 1,
            reversing: -1
        };
        
        
        ///////////////////////////////////////////////////////////////////////
        // Animation class
        ///////////////////////////////////////////////////////////////////////
        
        var Animation = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // options
            ///////////////////////////////////////////////////////////////////
            
            // the animation's delay (in seconds)
            // when play() or reverse() is called, this amount of time will
            // pass before the animation actually runs.
            // the delay is skipped under certain conditions (detailed below).
            delay: 0,
            
            // the animation's duration (in seconds)
            // this is the amount of time the animation will play or reverse
            // after the delay time has passed.
            duration: 0,
            
            // the animation's framerate (number of frames per second)
            // the engine will attempt to honor this as precisely as possible.
            // divisions of 60 frames per second, i.e.
            // 60, 30, 15, 10, 5, 3, 2, 1, 0.5, 0.25, work best.
            framerate: 60,
            
            // the animation's easing (one of the methods from tween/easing/*)
            // this scales the progress value that is passed to onUpdate
            // callbacks.
            // if null, the default uses linear easing (no easing)
            easing: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // public state
            ///////////////////////////////////////////////////////////////////
            
            // the animation's serial number, set by the animation engine
            serial: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the animation's current state
            // set to one of AnimationState.paused, AnimationState.playing or 
            // AnimationState.reversing.
            _state: AnimationState.paused,
            
            // is the animation running (after the delay has passed)?
            _running: false,
            
            // the time remaining in milliseconds before the animation updates
            _frameRemaining: null,
            
            // the time remaining in milliseconds of the animation's delay
            _delayRemaining: null,
            
            // the time remaining in milliseconds of the animation's duration
            _durationRemaining: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(options) {
                
                
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // TEMP!
            play: function() {
                
                engine.add(this);
            },
            
            // TEMP!
            stop: function() {
                
                engine.remove(this);
            },
            
            
            // tick the animation forward by the given number of milliseconds
            // (called by the animation engine)
            tick: function(timeDelta) {
                
                
                console.log(timeDelta);
            }
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            ///////////////////////////////////////////////////////////////////
            
            
            
        });
        
        
        // define the package structure
        base.Animation = Animation;
        return base.Animation;
    }
);
