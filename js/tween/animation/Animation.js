define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "./_base",
        "./engine"
    ],
    function(array, declare, lang, base, engine) {
        
        
        ///////////////////////////////////////////////////////////////////////
        // The Animation class, an abstraction for any kind of timed animation.
        // 
        // It supports basic animation configurations for delay, duration,
        // framerate and easing, It has an API to control playing, reversing,
        // stopping and advancing play to a specific percentage. It also
        // supports callbacks for various play, reverse, update and stop
        // events (see details below).
        
        
        ///////////////////////////////////////////////////////////////////////
        // internal static constants
        ///////////////////////////////////////////////////////////////////////
        
        var AnimationState = {
            stopped: 0,
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
            // set to one of AnimationState.stopped, AnimationState.playing or 
            // AnimationState.reversing.
            _state: AnimationState.stopped,
            
            // is the animation initialized (has remaining values)?
            _initialized: false,
            
            // has the animation started (run past the delay)?
            _started: false,
            
            // the time remaining in milliseconds before the animation updates
            // (null when the animation is not _initialized)
            _frameRemaining: null,
            
            // the time remaining in milliseconds of the animation's delay
            // (null when the animation is not _initialized)
            _delayRemaining: null,
            
            // the time remaining in milliseconds of the animation's duration
            // (null when the animation is not _initialized)
            _durationRemaining: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // callbacks
            ///////////////////////////////////////////////////////////////////
            
            // called synchronously whenever the animation is played
            _playCallbacks: null,
            
            // called synchrounously whenever the animation is reversed
            _reverseCallbacks: null,
            
            // called synchronously whenever the animation is stopped
            _stopCallbacks: null,
            
            // called asynchronously after an animation's delay has passed
            // and it's about to start playing but has not yet been updated
            _playStartedCallbacks: null,
            
            // called asynchronously after an animation's delay has passed
            // and it's about to start reversing but has not yet been updated
            _reverseStartedCallbacks: null,
            
            // called asynchronously after an animation's delay has passed
            // and it's about to start playing or reversing
            // but has not yet been updated
            _startedCallbacks: null,
            
            // called asynchronously after an animation has completed after
            // being play()ed
            _playCompletedCallbacks: null,
            
            // called asynchronously after an animation has completed after
            // being reverse()d
            _reverseCompletedCallbacks: null,
            
            // called asynchronously after an animation has completed after
            // being play()ed or reverse()d
            _completedCallbacks: null,
            
            // called asynchronously after an animation has been updated
            // this will always be passed the animation's final eased progress
            // value (1.0 with standard easing functions)
            _updatedCallbacks: null,
            
            // the callbacks map (a minor optimization)
            _callbacksMap: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(options) {
                
                declare.safeMixin(this, options);
                
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
                
                if (this.serial !== null) {
                    
                    throw new Error(
                        "You may not set the animation's serial number."
                    );
                }
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // play the animation
            play: function() {
                
                // does this change the animation state?
                if (this._state !== AnimationState.playing) {
                    
                    this._play();
                    
                    // add this animation to the engine so it gets updated
                    engine.add(this);
                }
                
                return this;
            },
            
            // reverse the animation
            reverse: function() {
                
                // does this change the animation state?
                if (this._state !== AnimationState.reversing) {
                    
                    this._reverse();
                    
                    // add this animation to the engine so it gets updated
                    engine.add(this);
                }
                
                return this;
            },
            
            // stop the animation
            // optionally force the animation to complete (asynchronously)
            stop: function(complete) {
                
                complete = complete || false;
                
                // does this change the animation state?
                if (this._state !== AnimationState.stopped) {
                    
                    this._stop(complete);
                    
                    // complete the animation asynchronously?
                    if (complete) {
                        
                        // add this animation to the engine so it gets updated
                        engine.add(this);
                        
                    } else {
                        
                        // remove this animation from the engine so that it 
                        // stops getting updated
                        engine.remove(this);
                    }
                }
                
                return this;
            },
            
            // tick the animation forward by the given number of milliseconds
            // (called by the animation engine)
            tick: function(timeDelta) {
                
                this._tick(timeDelta);
                
                // remove this animation from the engine so that it stops
                // getting updated?
                if (!this._initialized) {
                    
                    engine.remove(this);
                }
                
                return this;
            },
            
            // add several callbacks at once by name - options are:
            // play, reverse, stop, playStarted, reverseStarted, started,
            // playCompleted, reverseCompleted, completed, updated
            on: function(nameOrCallbacks, callback) {
                
                var map = this._getCallbacksMap(),
                    key;
                
                if (lang.isString(nameOrCallbacks) &&
                    map[nameOrCallbacks] &&
                    lang.isFunction(callback)
                ) {
                    
                    map[nameOrCallbacks](callback);
                
                } else if (lang.isObject(nameOrCallbacks)) {
                    
                    for (key in nameOrCallbacks) {
                        
                        if (key in map) {
                            
                            map[key](nameOrCallbacks[key]);
                        }
                    }
                }
                
                return this;
            },
            
            // add play callback
            addPlayCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._playCallbacks === null) {
                        
                        this._playCallbacks = [];
                    }
                    this._playCallbacks.push(callback);
                }
                
                return this;
            },
            
            // add reverse callback
            addReverseCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._reverseCallbacks === null) {
                        
                        this._reverseCallbacks = [];
                    }
                    this._reverseCallbacks.push(callback);
                }
                
                return this;
            },
            
            // add stop callback
            addStopCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._stopCallbacks === null) {
                        
                        this._stopCallbacks = [];
                    }
                    this._stopCallbacks.push(callback);
                }
                
                return this;
            },
            
            // add play started callback
            addPlayStartedCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._playStartedCallbacks === null) {
                        
                        this._playStartedCallbacks = [];
                    }
                    this._playStartedCallbacks.push(callback);
                }
                
                return this;
            },
            
            // add reverse started callback
            addReverseStartedCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._reverseStartedCallbacks === null) {
                        
                        this._reverseStartedCallbacks = [];
                    }
                    this._reverseStartedCallbacks.push(callback);
                }
                
                return this;
            },
            
            // add started callback
            addStartedCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._startedCallbacks === null) {
                        
                        this._startedCallbacks = [];
                    }
                    this._startedCallbacks.push(callback);
                }
                
                return this;
            },
            
            // add play completed callback
            addPlayCompletedCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._playCompletedCallbacks === null) {
                        
                        this._playCompletedCallbacks = [];
                    }
                    this._playCompletedCallbacks.push(callback);
                }
                
                return this;
            },
            
            // add reverse completed callback
            addReverseCompletedCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._reverseCompletedCallbacks === null) {
                        
                        this._reverseCompletedCallbacks = [];
                    }
                    this._reverseCompletedCallbacks.push(callback);
                }
                
                return this;
            },
            
            // add completed callback
            addCompletedCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._completedCallbacks === null) {
                        
                        this._completedCallbacks = [];
                    }
                    this._completedCallbacks.push(callback);
                }
                
                return this;
            },
            
            // add updated callback
            addUpdatedCallback: function(callback) {
                
                if (lang.isFunction(callback)) {
                    
                    if (this._updatedCallbacks === null) {
                        
                        this._updatedCallbacks = [];
                    }
                    this._updatedCallbacks.push(callback);
                }
                
                return this;
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            ///////////////////////////////////////////////////////////////////
            
            // play() internals
            // this changes the animation's state and runs callbacks,
            // but it does not update the animation engine.
            // it should only be called when _state !== AnimationState.playing.
            // takes optional delay and duration override parameters.
            _play: function(delay, duration) {
                
                // if the animation wasn't initalized, initialize it
                // otherwise, invert the animation if we were reversing
                if (!this._initialized) {
                    
                    this._initialize(delay, duration);
                
                } else if (this._state === AnimationState.reversing) {
                    
                    this._invert(delay, duration);
                }
                
                // set the state
                this._state = AnimationState.playing;
                
                // run any synchronous play callbacks?
                if (this._playCallbacks !== null) {
                    
                    array.forEach(this._playCallbacks, lang.hitch(this, this._runCallback));
                }
            },
            
            // reverse() internals
            // this changes the animation's state and handles callbacks,
            // but it does not update the animation engine.
            // it should only be called when _state !== AnimationState.playing.
            // takes optional delay and duration override parameters.
            _reverse: function(delay, duration) {
                
                // if the animation wasn't initalized, initialize it
                // otherwise, invert the animation if we were playing
                if (!this._initialized) {
                    
                    this._initialize(delay, duration);
                
                } else if (this._state === AnimationState.playing) {
                    
                    this._invert(delay, duration);
                }
                
                // set the state
                this._state = AnimationState.reversing;
                
                // run any synchronous reverse callbacks?
                if (this._reverseCallbacks !== null) {
                    
                    array.forEach(this._reverseCallbacks, lang.hitch(this, this._runCallback));
                }
            },
            
            // stop() internals
            // this changes the animation's state and handles callbacks,
            // but it does not update the animation engine
            _stop: function(complete) {
                
                this._state = AnimationState.stopped;
                
                // normalize the complete value
                complete = complete || false;
                
                // complete the animation asynchronously?
                if (complete) {
                    
                    this._complete();
                }
                
                // run any synchronous stop callbacks?
                if (this._stopCallbacks !== null) {
                    
                    array.forEach(this._stopCallbacks, lang.hitch(this, this._runCallback));
                }
            },
            
            // tick() internals
            // this changes the animation's state and handles callbacks,
            // but it does not update the animation engine
            _tick: function(timeDelta) {
                
                var
                    // had we already passed the delay and started the animation?
                    started = this._started,
                    
                    // did our frame's duration complete on this tick?
                    frameComplete = false,
                    
                    // the animation's frame duration
                    // (calculated if we need to update the frame's remaining time)
                    frameDuration;
                
                // if this animation is not initialized, do nothing
                if (!this._initialized) {
                    
                    return;
                }
                
                // reduce this frame's remaining time
                this._frameRemaining -= timeDelta;
                
                // did our frame complete?
                if (this._frameRemaining <= 0.0) {
                    
                    frameComplete = true;
                    
                    // reset the frame's remaining time
                    frameDuration = 1000.0 / this.framerate;
                    this._frameRemaining = frameDuration + (this._frameRemaining % frameDuration);
                }
                
                // act based on whether the frame completed, ensuring that
                // delays and durations are tied to the animation's framerate
                if (frameComplete) {
                    
                    // has our animation passed the delay and started?
                    this._started = started || (this._delayRemaining - timeDelta <= 0.0);
                    if (this._started) {
                        
                        // reduce the duration's remaining time
                        this._durationRemaining -= timeDelta;
                        
                        // did we just start the animation?
                        if (!started) {
                            
                            // reduce the delay's remaining time
                            this._delayRemaining -= timeDelta;
                        
                            // shave off the remainder of the delay from the duration
                            this._durationRemaining += this._delayRemaining;
                            
                            // run started callbacks
                            // TODO ...
                        }
                        
                        // update the animation
                        this._update();
                        
                        // run updated callbacks
                        // TODO ...
                        
                        // did the animation complete?
                        if (this._delayRemaining <= 0.0 && this._durationRemaining <= 0.0) {
                            
                            // run completed callbacks
                            // TODO ...
                            
                            // set the state to stopped
                            this._state = AnimationState.stopped;
                            
                            // uninitialize the animation
                            this._uninitialize();
                        }
                    
                    } else {
                        
                        // just reduce the delay's remaining time
                        this._delayRemaining -= timeDelta;
                    }
                    
                    
                } else {
                    
                    // the frame did not complete, so just update
                    // the remaining times
                    if (started) {
                        
                        this._durationRemaining -= timeDelta;
                        
                    } else {
                        
                        this._delayRemaining -= timeDelta;
                    }
                }
            },
            
            // initialize the animation
            // takes optional delay and duration override parameters.
            _initialize: function(delay, duration) {
                
                delay = (delay !== undefined ? delay : this.delay);
                duration = (duration !== undefined ? duration : this.duration);
                
                // we're still waiting for the delay to be over
                this._started = false;
                
                // set up the remaining values
                this._frameRemaining = 1000.0 / this.framerate;
                this._delayRemaining = 1000.0 * delay;
                this._durationRemaining = 1000.0 * duration;
                
                // the animation is now initialized
                this._initialized = true;
            },
            
            // uninitialize the animation
            _uninitialize: function() {
                
                this._started = false;
                this._frameRemaining = null;
                this._delayRemaining = null;
                this._durationRemaining = null;
                this._initialized = false;
            },
            
            // invert the animation
            // should only be called if the animation is _initialized.
            // takes optional delay and duration override parameters.
            _invert: function(delay, duration) {
                
                delay = 1000.0 * (delay !== undefined ? delay : this.delay);
                duration = 1000.0 * (duration !== undefined ? duration : this.duration);
                
                // "invert" the remaining values
                this._delayRemaining =
                    delay === 0
                    ?
                    0
                    :
                    delay * Math.min(1.0, Math.max(0.0, (1.0 - (this._delayRemaining / delay))));
                
                this._durationRemaining =
                    duration === 0
                    ?
                    0
                    :
                    duration * Math.min(1.0, Math.max(0.0, (1.0 - (this._durationRemaining / duration))));
            },
            
            // prepare the animation for an asynchronous completion.
            _complete: function() {
                
                // the animation's delay is "over", so set started
                this._started = true;
                
                // set the remaining values to 0 to trigger
                // a completion on the next asynchronous update
                this._frameRemaining = 0;
                this._delayRemaining = 0;
                this._durationRemaining = 0;
                
                // the animation is now initialized
                this._initialized = true;
            },
            
            // update the animation
            // subclasses can override this to perform required updates
            // the base class doesn't do anything
            _update: function() {
                                
                // TEMP!
                console.log(this._ease(this._getProgress()));
            },
            
            // get an array of parameters to pass to the callback function.
            // the base class just returns an array with the value
            // of _getEasedProgress(). subclasses may override this to 
            // pass other values to their callbacks.
            _getCallbackParameters: function() {
                
                return [this._ease(this._getProgress())];
            },
            
            // run a callback function, passing values from
            // _getCallbackParameters
            _runCallback: function(callback) {
                
                callback.apply(null, this._getCallbackParameters());
            },
            
            // get the animation's progress
            _getProgress: function() {
                
                var progress = 0.0,
                    duration;
                
                // only bother calculating if we've initialized the animation
                // and there is no more delay to run through
                if (this._initialized && this._delayRemaining <= 0.0) {
                                        
                    duration = 1000.0 * this.duration;
                    progress = duration > 0.0
                        ?
                        Math.min(1.0, Math.max(0.0, (duration - this._durationRemaining) / duration))
                        :
                        1.0;
                }
                
                // invert the progress for running in reverse?
                if (this._state === AnimationState.reversing) {
                    
                    progress = 1.0 - progress;
                }
                
                return progress;
            },
            
            // ease the given progress value
            _ease: function(progress) {
                
                return (
                    this.easing === null
                    ?
                    progress
                    :
                    this.easing(progress, 0.0, 1.0, 1.0)
                );
            },
            
            // get a map of callback names to their add* methods
            _getCallbacksMap: function() {
                
                if (this._callbacksMap === null) {
                    
                    this._callbacksMap = {
                        play: lang.hitch(this, this.addPlayCallback),
                        reverse: lang.hitch(this, this.addReverseCallback),
                        stop: lang.hitch(this, this.addStopCallback),
                        playStarted: lang.hitch(this, this.addPlayStartedCallback),
                        reverseStarted: lang.hitch(this, this.addReverseStartedCallback),
                        started: lang.hitch(this, this.addStartedCallback),
                        playCompleted: lang.hitch(this, this.addPlayCompletedCallback),
                        reverseCompleted: lang.hitch(this, this.addReverseCompletedCallback),
                        completed: lang.hitch(this, this.addCompletedCallback),
                        updated: lang.hitch(this, this.addUpdatedCallback)
                    }
                }
                
                return this._callbacksMap;
            }
        });
        
        
        // define the package structure
        base.Animation = Animation;
        return base.Animation;
    }
);
