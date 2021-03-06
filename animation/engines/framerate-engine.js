define(
    [
        "dojo/_base/declare",
        "dojo/_base/lang",
        "../SerializedMixin",
        "../../structures/DoublyLinkedList"
    ],
    function(declare, lang, SerializedMixin, DoublyLinkedList) {
        
        
        ///////////////////////////////////////////////////////////////////////
        // The FrameEngine class, the core engine used by FramerateAnimation
        // instances.
        //
        // uses window.requestAnimationFrame() to synchronize animation
        // updates to the browser's screen refresh.
        
        
        ///////////////////////////////////////////////////////////////////////
        // static values
        ///////////////////////////////////////////////////////////////////////
        
        // the browser's requestAnimationFrame method
        // if this is not available, the framework falls back to a
        // default update interval of 16 milliseconds.
        var _requestAnimationFrame = 
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequsetAnimationFrame ||
            window.msRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            null;
        
        
        ///////////////////////////////////////////////////////////////////////
        // FramerateEngine class
        ///////////////////////////////////////////////////////////////////////
        
        var FramerateEngine = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // options
            ///////////////////////////////////////////////////////////////////
            
            // the number of milliseconds to wait between requesting
            // screen updates
            rate: 5,
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // is the engine running
            _started: false,
            
            // the update interval (from setInterval)
            _interval: null,
            
            // the last update's time in milliseconds
            _lastTime: null,
            
            // the animations (DoublyLinkedList)
            _animations: null,
            
            // the animations map (maps each animation's serial number to its
            // node in the DoublyLinkedList)
            _animationsMap: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(options) {
                
                declare.safeMixin(this, options);
                
                // sanity checks
                if (isNaN(this.rate) || this.rate < 1) {
                    
                    throw new Error(
                        "The animation engine's rate must be a number " +
                        "of milliseconds greater than 0."
                    );
                }
                
                // set the rate to a whole integer and base it on whether
                // or not _requestAnimationFrame is available
                this.rate =
                    _requestAnimationFrame !== null
                    ?
                    Math.round(this.rate)
                    :
                    16;
                
                // initialize the data structures
                this._animations = new DoublyLinkedList();
                this._animationsMap = { };
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // add an animation
            add: function(animation) {
                
                var serial;
                
                animation = animation || null;
                
                if (animation !== null && 
                    lang.isFunction(animation.isInstanceOf) &&
                    animation.isInstanceOf(SerializedMixin)
                ) {
                    
                    serial = animation.getSerial();
                    
                    // update the data structures
                    if (this._animationsMap[serial] === undefined) {
                        
                        this._animationsMap[serial] = this._animations.insertLast(animation);
                    }
                    
                    // make sure the engine has started
                    if (!this._started) {
                        
                        this._start();
                    }
                }
            },
            
            // remove an animation
            remove: function(animation) {
                
                var serial;
                
                animation = animation || null;
                
                if (animation !== null) {
                    
                    serial = animation.getSerial();
                    
                    if (this._animationsMap[serial] !== undefined) {
                        
                        // update the data structures
                        this._animations.remove(this._animationsMap[serial]);
                        delete this._animationsMap[serial];
                    }
                }
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            ///////////////////////////////////////////////////////////////////
            
            // start the animation engine
            // should only be called if _started is false
            _start: function() {
                
                this._started = true;
                this._interval = setInterval(lang.hitch(this, this._tick), this.rate);
                this._lastTime = (new Date()).valueOf();
                
                console.log("starting engine");
            },
            
            // stop the animation engine
            // should only be called if _started is true
            _stop: function() {
                                
                this._started = false;
                clearInterval(this._interval);
                this._interval = null;
                this._lastTime = null;
                
                console.log("stopping engine");
            },
            
            // tick the animation engine forward
            _tick: function() {
                
                if (_requestAnimationFrame !== null) {
                    
                    _requestAnimationFrame(lang.hitch(this, this._update));
                    
                } else {
                    
                    this._update();
                }
            },
            
            // update the animations
            _update: function() {
                
                var 
                    // what time is it now?
                    nowTime = (new Date()).valueOf(),
                    
                    // how much time has passed
                    timeDelta = nowTime - this._lastTime;
                
                // are we still running?
                if (this._started) {
                
                    // should we actually update the animations?
                    if (timeDelta >= this.rate) {
                        
                        // update the animations
                        this._animations.forEach(function(animation) {
                        
                            animation.update(timeDelta);
                        });
                    
                        // track the last time we updated
                        this._lastTime = nowTime;
                    }
                    
                    // have all of our animations been removed?
                    if (this._animations.count() === 0 && this._started) {
                    
                        this._stop();
                    }
                }
            }
            
        });
        
        
        // create the FramerateEngine singleton,
        // set to request update frames every 4 milliseconds
        return new FramerateEngine({
            rate: 4
        });
    }
);