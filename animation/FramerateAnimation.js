define(
    [
        "dojo/_base/declare",
        "dojo/_base/lang",
        "./_base",
        "./Animation",
        "./SerializedMixin",
        "./engines/framerate-engine"
    ],
    function(declare, lang, base, Animation, SerializedMixin, engine) {
        
        
        ///////////////////////////////////////////////////////////////////////
        // The FramerateAnimation class, timed animations that run with a
        // framerate.
        
        
        ///////////////////////////////////////////////////////////////////////
        // FramerateAnimation class
        ///////////////////////////////////////////////////////////////////////
        
        var FramerateAnimation = declare([Animation, SerializedMixin], {
            
            
            ///////////////////////////////////////////////////////////////////
            // options
            ///////////////////////////////////////////////////////////////////
            
            // the delay in seconds
            delay: 0,
            
            // the duration in seconds
            duration: 0,
            
            // the animation's framerate (number of frames per second)
            // the engine will attempt to honor this as precisely as possible.
            // divisions of 60 frames per second, i.e.
            // 60, 30, 15, 10, 5, 3, 2, 1, 0.5, 0.25, work best.
            framerate: 60,
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // the time remaining in milliseconds before the animation updates
            // (null when the animation is stopped)
            _frameRemaining: null,
            
            // the time remaining in milliseconds of the animation's delay
            // (null when the animation is stopped)
            _delayRemaining: null,
            
            // the time remaining in milliseconds of the animation's duration
            // (null when the animation is stopped)
            _durationRemaining: null,
            
            // the cached progress value
            _progress: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(options) {
                
                // sanity checks
                if (isNaN(this.delay) || 
                    typeof(this.delay) !== "number" ||
                    this.delay < 0
                ) {
                    
                    throw new Error(
                        "The animation's delay must be a Number greater " +
                        "than or equal to zero."
                    );
                }
                
                if (isNaN(this.duration) || 
                    typeof(this.duration) !== "number" ||
                    this.duration < 0
                ) {
                    
                    throw new Error(
                        "The animation's duration must be a Number greater " +
                        "than or equal to zero."
                    );
                }
                
                if (isNaN(this.framerate) ||
                    typeof(this.framerate) !== "number" ||
                    this.framerate <= 0.0
                ) {
                    
                    throw new Error(
                        "The animation's framerate must be a Number greater " +
                        "than zero."
                    );
                }
                
                if (this.easing !== null && !lang.isFunction(this.easing)) {
                    
                    throw new Error(
                        "The animation's easing must be null or a function."
                    );
                }
            },
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            ///////////////////////////////////////////////////////////////////
            
            _afterPlay: function() {
                
                this.inherited(arguments);
                
                // start updating this animation?
                if (this._state.isRunning()) {
                    
                    engine.add(this);
                }
            },
            
            _afterReverse: function() {
                
                this.inherited(arguments);
                
                // start updating this animation?
                if (this._state.isRunning()) {
                    
                    engine.add(this);
                }
            },
            
            _afterPause: function() {
                
                this.inherited(arguments);
                
                // stop updating this animation
                engine.remove(this);
            },
            
            _afterStop: function() {
                
                this.inherited(arguments);
                
                // stop updating this animation
                engine.remove(this);
            },
            
            _shouldUpdate: function(timeDelta) {
                
                var shouldUpdate = false;
                
                // normalize the time delta
                timeDelta = timeDelta || 0.0;
                
                // reduce this frame's remaining time
                this._frameRemaining -= timeDelta;
                
                // did our frame complete?
                if (this._frameRemaining <= 0.0) {
                    
                    shouldUpdate = true;
                    
                    // reset the frame's remaining time
                    frameDuration = 1000.0 / this.framerate;
                    this._frameRemaining = frameDuration + (this._frameRemaining % frameDuration);
                }
                
                return shouldUpdate;
            },
            
            _hasStarted: function(timeDelta) {
                
                // normalize the time delta
                timeDelta = timeDelta || 0.0;
                
                // does the change in time take us past the starting point?
                return (this._delayRemaining - timeDelta) <= 0.0;
            },
            
            _startedUpdate: function(timeDelta) {
                
                // normalize the time delta
                timeDelta = timeDelta || 0.0;
                
                // reduce the delay's remaining time
                this._delayRemaining -= timeDelta;
                
                // shave off the remainder of the delay from the duration
                this._durationRemaining += this._delayRemaining;
            },
            
            _notStartedUpdate: function(timeDelta) {
                
                // normalize the time delta
                timeDelta = timeDelta || 0.0;
                
                // reduce the delay's remaining time
                this._delayRemaining -= timeDelta;
            },
            
            _update: function(timeDelta) {
                
                // normalize the time delta
                timeDelta = timeDelta || 0.0;
                
                // reduce the duration's remaining time
                this._durationRemaining -= timeDelta;
                
                // is the animation completed?
                return this._delayRemaining <= 0.0 && this._durationRemaining <= 0.0;
            },
            
            _noUpdate: function(timeDelta) {
                
                // normalize the time delta
                timeDelta = timeDelta || 0.0;
                
                if (this._started) {
                    
                    this._durationRemaining -= timeDelta;
                    
                } else {
                    
                    this._delayRemaining -= timeDelta;
                }
            },
            
            _applyUpdate: function() {
                
                // TEMP!
                console.log(this._ease(this._getProgress()));
            },
            
            _completedUpdate: function() {
                
                // stop updating this animation
                engine.remove(this);
            },
            
            _initializeProgress: function(delay, duration, progress, skipDelay) {
                
                var 
                    // the total delay and duration
                    total,
                    
                    // the percentage of the total that delay and duration
                    // each comprise
                    delayPercent,
                    durationPercent;
                
                
                // normalize the progress value
                if (progress === undefined) {
                    
                    progress = 0.0;
                
                } else {
                    
                    progress = Math.min(1.0, Math.max(0.0, progress));
                }
                
                // _progress is calculated internally by _frameRemaining,
                // _delayRemaining and _durationRemaining, so initialize
                // these values.
                
                // the first frame update is instantaneous.
                // it will be set to an appropriate value for the
                // framerate by _shouldUpdate().
                this._frameRemaining = 0;
                
                // the other values depend on whether skipDelay is set
                if (skipDelay === true) {
                    
                    // we're skipping the delay
                    this._delayRemaining = 0;
                    
                    // set the duration according to progress
                    this._durationRemaining = 1000.0 * (1.0 - progress) * duration;
                    
                } else {
                    
                    // we'll need the total length of the animation
                    total = delay + duration;
                    
                    // set the delay and duration based on progress
                    // and their percentages of the total length
                    if (total === 0.0) {
                        
                        // simple case
                        this._delayRemaining = 0.0;
                        this._durationRemaining = 0.0;
                        
                    } else {
                        
                        // complex case
                        delayPercent = delay / total;
                        durationPercent = duration / total;
                        
                        // set the delay based on whether the progress has
                        // passed it
                        this._delayRemaining = 
                            progress < delayPercent
                            ?
                            1000.0 * (delayPercent - progress) * total
                            :
                            0.0;
                            
                        // set the duration based on whether the progress
                        // has passed the delay
                        this._durationRemaining = 
                            progress < delayPercent
                            ?
                            1000.0 * duration
                            :
                            1000.0 * (1.0 - progress) * total;
                    }
                }
            },
            
            _uninitializeProgress: function() {
                
                this._frameRemaining = null;
                this._delayRemaining = null;
                this._durationRemaining = null;
            },
            
            _invertProgress: function(delay, duration, skipDelay) {
                
                delay = 1000.0 * delay;
                duration = 1000.0 * duration;
                
                // only invert the delay if it has not yet been passed through
                if (this._delayRemaining > 0) {
                    
                    this._delayRemaining =
                        skipDelay === true
                        ?
                        0
                        :
                            delay === 0
                            ?
                            0
                            :
                            delay * Math.min(1.0, Math.max(0.0, (1.0 - (this._delayRemaining / delay))));
                }
                
                this._durationRemaining =
                    duration === 0
                    ?
                    0
                    :
                    duration * Math.min(1.0, Math.max(0.0, (1.0 - (this._durationRemaining / duration))));
            },
            
            _getProgress: function(refresh) {
                
                var duration;
                
                // only update if a refresh was requested
                if (refresh) {
                    
                    if (
                        this._frameRemaining === null ||
                        this._delayRemaining === null ||
                        this._durationRemaining === null
                    ) {
                        
                        this._progress = null;
                    
                    } else {
                        
                        // are we past the delay?
                        if (this._delayRemaining <= 0.0) {
                            
                            duration = 1000.0 * this._getDuration();
                            
                            this._progress = duration > 0.0
                                ?
                                Math.min(1.0, Math.max(0.0, (duration - this._durationRemaining) / duration))
                                :
                                1.0;
                            
                        } else {
                            
                            // not past the delay
                            this._progress = 0.0;
                        }
                    }
                    
                    // invert the progress for reversing?
                    if (this._state.isReversing()) {
                        
                        this._progress = 1.0 - this._progress;
                    }
                }
                
                return this._progress;
            }
        });
        
        
        // define the package structure
        base.FramerateAnimation = FramerateAnimation;
        return base.FramerateAnimation;
    }
);
