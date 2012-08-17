define(
    [
        "dojo/_base/array",
        "dojo/_base/declare",
        "dojo/_base/lang",
        "./_base",
        "./AnimationState"
    ],
    function(array, declare, lang, base, AnimationState) {
        
        
        ///////////////////////////////////////////////////////////////////////
        // The Animation class defines an animation abstractly as a delay,
        // a duration and an easing function coupled with methods for playing,
        // reversing, stopping, pausing and updating. It supports callbacks
        // for events that occur during the animation.
        //
        // Subclasses are responsible for fleshing out an animation's
        // functionality by overriding the methods detailed below.
        
        
        ///////////////////////////////////////////////////////////////////////
        // internal static constants
        ///////////////////////////////////////////////////////////////////////
        
        // names of supported callback events
        var Callbacks = {
            
            // called synchronously whenever the animation is played
            "play": true,
            
            // called synchrounously whenever the animation is reversed
            "reverse": true,
            
            // called synchronously whenever the animation is paused
            "pause": true,
            
            // called synchronously whenever the animation is stopped
            "stop": true,
            
            // called asynchronously after an animation's delay has passed
            // and it's about to start playing but has not yet been updated
            "playStarted": true,
            
            // called asynchronously after an animation's delay has passed
            // and it's about to start reversing but has not yet been updated
            "reverseStarted": true,
            
            // called asynchronously after an animation's delay has passed
            // and it's about to start playing or reversing
            // but has not yet been updated
            "started": true,
            
            // called asynchronously after an animation has completed after
            // being played
            "playCompleted": true,
            
            // called asynchronously after an animation has completed after
            // being reversed
            "reverseCompleted": true,
            
            // called asynchronously after an animation has completed after
            // being played or reversed
            "completed": true,
            
            // called asynchronously after an animation has been updated
            // this will always be passed the animation's final eased progress
            // value
            "updated": true
        };
        
        
        ///////////////////////////////////////////////////////////////////////
        // Animation class
        ///////////////////////////////////////////////////////////////////////
        
        var Animation = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // options
            ///////////////////////////////////////////////////////////////////
            
            // the animation's delay before it begins playing or reversing.
            // to be flexible, the type of this value is unrestricted by
            // the Animation class, but subclasses should perform sanity
            // checks to ensure that the duration's value is legitimate.
            // the Animation class allows the use of callback functions
            // for dynamically calculating the delay's value, as outlined
            // below.
            delay: null,
            
            // the animation's duration that it plays or reverses after the
            // delay has passed. the type of this value is also unrestricted,
            // and can also be defined as a callback function.
            duration: null,
            
            // the animation's easing function
            // the only restriction is that this must be a function or null
            // for no easing, but typical Animation subclasses will use
            // the easing functions defined in dojo-tween/easing/*
            easing: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            // an instance of AnimationState, describing this animation's
            // current state (playing | reversing, stopped | paused).
            // pausing is more complex, because it must also "remember"
            // if the animation was previously playing or reversing so
            // that resuming the animation works correctly.
            _state: null,
            
            // has the animation passed its delay and started playing
            // or reversing?
            _started: false,
            
            // callbacks
            // an object mapping callback event names to an array of functions
            // that will run when each event occurs.
            _callbacks: null,
            
            
            ///////////////////////////////////////////////////////////////////
            // constructor
            ///////////////////////////////////////////////////////////////////
            
            constructor: function(options) {
                
                declare.safeMixin(this, options);
                
                // sanity check the easing option
                if (this.easing !== null && !lang.isFunction(this.easing)) {
                    
                    throw new Error(
                        "The easing option must be null or a function."
                    );
                }
                
                // initialize the state
                this._state = new AnimationState();
                
                // initialize the callbacks
                this._callbacks = { };
                
                // subclasses should perform any other sanity checks
                // of the options in their constructors
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // play the animation starting at an optional progress value.
            // updates the animation's state and invokes any play callbacks.
            //
            // the progress value should be conceptualized as a measure from
            // the beginning of the animation toward its end, e.g. on a scale
            // from 0.0 to 1.0, a progress value of 0.8 means that the
            // animation should play from 0.8 to 1.0.
            //
            // the semantics of the progress value are defined by the subclass.
            // if no progress value was specified, the animation was not paused
            // and the animation was already playing, this method has no
            // effect.
            //
            // subclasses should generally not change this method, but rather
            // should override the _beforePlay(), _play() and _afterPlay()
            // methods in the internal overrides section below.
            play: function(progress) {
                
                var started = this._started;
                
                if (progress === undefined &&
                    !this._state.isPaused() && 
                    this._state.isPlaying()
                ) {
                    
                    return this;
                }
                
                // set up the progress values before the state changes
                this._beforePlay(progress);
                
                // change the state
                this._play();
                
                // refresh the progress cache
                this._getProgress(true);
                
                // run the synchronous play callbacks and perform any required
                // updates after the state change
                this._afterPlay();
                
                // do we need to run started callbacks?
                if (this._started && this._started !== started) {
                    
                    this._runCallbacks("playStarted");
                    this._runCallbacks("started");
                }
                
                return this;
            },
            
            // reverse the animation starting at an optional progress value.
            // updates the animation's state and invokes any reverse callbacks.
            //
            // the progress value should be conceptualized as a measure from
            // the end of the animation toward its beginning, e.g. on a scale
            // from 0.0 to 1.0, a progress value of 0.8 means that the
            // animation should reverse from 0.2 to 0.0.
            //
            // the semantics of the progress value are defined by the subclass.
            // if no progress value was specified, the animation was not paused
            // and the animation was already reversing, this method has no
            // effect.
            //
            // subclasses should generally not change this method, but rather
            // should override the _beforeReverse(), _reverse() and
            // _afterReverse() methods in the internal overrides section below.
            reverse: function(progress) {
                
                var started = this._started;
                
                if (progress === undefined &&
                    !this._state.isPaused() &&
                    this._state.isReversing()
                ) {
                    
                    return this;
                }
                
                // set up the progress values before the state changes
                this._beforeReverse(progress);
                
                // change the state
                this._reverse();
                
                // refresh the progress cache
                this._getProgress(true);
                
                // run the synchronous reverse callbacks and perform any
                // required updates after the state change
                this._afterReverse();
                
                // do we need to run started callbacks?
                if (this._started && this._started !== started) {
                    
                    this._runCallbacks("reverseStarted");
                    this._runCallbacks("started");
                }
                
                return this;
            },
            
            // pause the animation at an optional progress value, and also
            // optionally set the animation in a reversing state.
            // updates the animation's state and invokes any reverse callbacks.
            // 
            // the progress value should be conceptualized according to how
            // the reverse parameter is set. if reverse if false or undefined,
            // the same meaning as play() is used. if reverse is true, the
            // same meaning as reverse() is used.
            // 
            // the semantics of the progress value are defined by the subclass.
            // if no progress value was specified or the animation was already
            // paused and its playing / reversing state is not being changed,
            // the method has no effect.
            // 
            // subclasses should generally not change this method, but rather
            // should override the _beforePause(), _pause() and _afterPause()
            // methods in the internal overrides section below.
            pause: function(progress, reverse) {
                
                var started = this._started,
                    
                    // normalize reverse to a boolean
                    shouldReverse = reverse || false;
                    
                if (progress === undefined &&
                    this._state.isPaused() && (
                        reverse === undefined || (
                            reverse !== undefined && (
                                (shouldReverse && this._state.isReversing()) ||
                                (!shouldReverse && this._state.isPlaying())
                            )
                        )
                    )
                ) {
                    
                    return this;
                }
                
                // set up the progress values before the state changes
                this._beforePause(progress, reverse);
                
                // change the state
                this._pause(reverse);
                
                // refresh the progress cache
                this._getProgress(true);
                
                // run the synchronous pause callbacks and perform any
                // required updates after the state change
                this._afterPause();
                
                // do we need to run started callbacks?
                if (this._started && this._started !== started) {
                    
                    if (this._state.isPlaying()) {
                        
                        this._runCallbacks("playStarted");
                        
                    } else if (this._state.isReversing()) {
                        
                        this._runCallbacks("reverseStarted");
                    }
                    this._runCallbacks("started");
                }
                
                return this;
            },
            
            // stop the animation
            // updates the animation's state and invokes any stop callbacks.
            stop: function() {
                
                // uninitialize the progress values before the state changes
                this._beforeStop();
                
                // change the state
                this._stop();
                
                // refresh the progress cache
                this._getProgress(true);
                
                // run the synchronous stop callbacks and perform any
                // required updates after the state change
                this._afterStop();
                
                return this;
            },
            
            // update the animation
            // subclasses must define the semantics of the arguments
            // to this function and override the hooks called by update()
            // to define the functionality of the animation.
            // all arguments passed to update() are passed along to
            // each of its hooks.
            update: function() {
                
                var
                    // was the animation started before?
                    started = this._started,
                    
                    // should we update the animation?
                    shouldUpdate = false,
                    
                    // did the animation complete?
                    completed = false;
                
                // do nothing if the animation is stopped
                if (this._state.isStopped()) {
                    
                    return this;
                }
                
                // if the animation is paused, apply an update so that the
                // initialized progress values update the animation and 
                // run the paused update so the animation has a chance
                // to stop running more updates.
                if (this._state.isPaused()) {
                    
                    this._applyUpdate.apply(this, arguments);
                    this._pausedUpdate.apply(this, arguments);
                    
                    return this;
                }
                
                // should we update the animation?
                shouldUpdate = this._shouldUpdate.apply(this, arguments);
                if (shouldUpdate) {
                    
                    // has the animation started?
                    this._started = started || (this._hasStarted.apply(this, arguments));
                    if (this._started) {
                        
                        // did we just start the animation?
                        if (!started) {
                            
                            // run the started update
                            this._startedUpdate.apply(this, arguments);
                            
                            // run the started callbacks
                            if (this._state.isPlaying()) {
                                
                                this._runCallbacks("playStarted");

                            } else if (this._state.isReversing()) {
                                
                                this._runCallbacks("reverseStarted");
                            }
                            
                            this._runCallbacks("started");
                        }
                        
                        // run the main update, which returns whether the
                        // animation has completed.
                        completed = this._update.apply(this, arguments);
                        
                        // now that updates are completed, refresh the 
                        // progress cache. this is a bit wasteful if
                        // the subclass does not implement progress caching.
                        this._getProgress(true);
                        
                        // apply the update
                        this._applyUpdate.apply(this, arguments);
                        
                        // run the updated callbacks
                        this._runCallbacks("updated");
                        
                        // did the animation complete?
                        if (completed) {
                            
                            // run completed callbacks
                            if (this._state.isPlaying()) {
                                
                                this._runCallbacks("playCompleted");
                            
                            } else if (this._state.isReversing()) {
                                
                                this._runCallbacks("reverseCompleted");
                            }
                            
                            this._runCallbacks("completed");
                            
                            // uninitialize the progress
                            this._started = false;
                            this._uninitializeProgress();
                            
                            // set the state to stopped
                            this._state.stop();
                            
                            // run the completed update
                            this._completedUpdate.apply(this, arguments);
                        }
                        
                    } else {
                        
                        // run the not started updates
                        this._notStartedUpdate.apply(this, arguments);
                    }
                    
                } else {
                    
                    // run the no update
                    this._noUpdate.apply(this, arguments);
                }
                
                return this;
            },
            
            // is the animation playing?
            // if the animation is paused, returns true if the animation
            // was paused from the playing state
            isPlaying: function() {
                
                return this._state.isPlaying();
            },
            
            // is the animation reversing?
            // if the animation is paused, returns true if the animation
            // was paused from the reversing state
            isReversing: function() {
                
                return this._state.isReversing();
            },
            
            // is the animation paused?
            isPaused: function() {
                
                return this._state.isPaused();
            },
            
            // is the animation stopped?
            isStopped: function() {
                
                return this._state.isStopped();
            },
            
            // add one or several callbacks at once by name - options are:
            // play, reverse, pause, stop, playStarted, reverseStarted,
            // started, playCompleted, reverseCompleted, completed, updated
            on: function(nameOrCallbacks, callback) {
                
                var name = lang.isString(nameOrCallbacks) ? nameOrCallbacks : null,
                    callbacks = lang.isObject(nameOrCallbacks) ? nameOrCallbacks : null;
                
                if (name !== null && lang.isFunction(callback)) {
                    
                    if (!(name in Callbacks)) {
                        
                        throw new Error(
                            "The animation callback event \"" + 
                            name + 
                            "\" is not supported."
                        );
                    }
                    
                    if (!(name in this._callbacks)) {
                        
                        this._callbacks[name] = [];
                    }
                    this._callbacks[name].push(callback);
                    
                } else if (callbacks !== null && callback === undefined) {
                    
                    for (name in callbacks) {
                        
                        if (!(name in Callbacks)) {

                            throw new Error(
                                "The animation callback event \"" + 
                                name + 
                                "\" is not supported."
                            );
                        }
                        
                        if (lang.isFunction(callbacks[name])) {
                            
                            if (!(name in this._callbacks)) {
                                
                                this._callbacks[name] = [];
                            }
                            this._callbacks[name].push(callback);
                        }
                    }
                
                } else {
                    
                    throw new Error(
                        "Invalid parameters passed to on()."
                    );
                }
                
                return this;
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // internal overrideables
            //
            // subclasses should override these methods to tailor the
            // animation's functionality.
            //
            // the override hooks for play(), reverse(), pause() and stop()
            // i.e. _beforePlay(), _play(), _afterPlay(), etc., should
            // generally call this.inherited(arguments) to perform the
            // Animation class' base functionality.
            // it's only for cases where the overall animation functionality
            // is being changed that the Animation class' methods should not
            // be called.
            //
            // the override hooks for updates, i.e. _shouldUpdate(),
            // _hasStarted(), _startedUpdate(), etc. must be defined by
            // subclasses and should not call this.inherited(arguments).
            //
            // the override hooks for progress, i.e. _initializeProgress(),
            // _uninitializeProgress(), _invertProgress() and _getProgress()
            // must be defined by subclasses and should not call
            // this.inherited(arguments).
            ///////////////////////////////////////////////////////////////////
            
            // called by play() before the state is changed
            // if the optional progress value is specified or the animation
            // is stopped, calls the _initializeProgress() method
            // with calculated delay and duration values.
            // otherwise, if the animation was reversing, calls the
            // _invertProgress() method with the calculated delay
            // and duration values.
            _beforePlay: function(progress) {
                
                if (progress !== undefined || this._state.isStopped()) {
                    
                    this._initializeProgress(
                        this._getDelay(),
                        this._getDuration(),
                        progress
                    );
                    
                    this._started = this._hasStarted();
                
                } else if (this._state.isReversing()) {
                    
                    this._invertProgress(
                        this._getDelay(),
                        this._getDuration()
                    );
                    
                    this._started = this._hasStarted();
                }
            },
            
            // called by play() to change the state
            _play: function() {
                
                this._state.play();
            },
            
            // called by play() after the state is changed
            // runs play callbacks synchronously
            _afterPlay: function() {
                
                this._runCallbacks("play");
            },
            
            // called by reverse() before the state is changed
            // if the optional progress value is specified or the animation
            // is stopped, calls the _initializeProgress() method
            // with calculated delay and duration values.
            // otherwise, if the animation was playing, calls the
            // _invertProgress() method with the calculated delay
            // and duration values.
            _beforeReverse: function(progress) {
                
                if (progress !== undefined || this._state.isStopped()) {
                    
                    this._initializeProgress(
                        this._getDelay(),
                        this._getDuration(),
                        progress
                    );
                    
                    this._started = this._hasStarted();
                
                } else if (this._state.isPlaying()) {
                    
                    this._invertProgress(
                        this._getDelay(),
                        this._getDuration()
                    );
                    
                    this._started = this._hasStarted();
                }
            },
            
            // called by reverse() to change the state
            _reverse: function() {
                
                this._state.reverse();
            },
            
            // called by reverse() after the state is changed
            // runs reverse callbacks synchronously
            _afterReverse: function() {
                
                this._runCallbacks("reverse");
            },
            
            // called by pause() before the state is changed
            // if the optional progress value is specified or the animation
            // is stopped, calls the _initializeProgress() method
            // with calculated delay and duration values.
            // otherwise, if the animation's playing / reversing state
            // is changing, calls the _invertProgress() method with the
            // calculated delay and duration values.
            _beforePause: function(progress, reverse) {
                
                // normalize reverse to a boolean
                var shouldReverse = reverse || false;
                
                // are we pausing at a specific progress point
                // or from the stopped state?
                if (progress !== undefined || this._state.isStopped()) {
                    
                    this._initializeProgress(
                        this._getDelay(),
                        this._getDuration(),
                        progress
                    );
                    
                    this._started = this._hasStarted();
                }
                
                // did we have a request to set the play / reverse state?
                if (
                    reverse !== undefined && (
                        (this._state.isPlaying() && shouldReverse) ||
                        (this._state.isReversing() && !shouldReverse) ||
                        (this._state.isStopped() && shouldReverse)
                    )
                ) {
                    
                    this._invertProgress(
                        this._getDelay(),
                        this._getDuration()
                    );
                    
                    this._started = this._hasStarted();
                }
            },
            
            // called by pause() to change the state
            _pause: function(reverse) {
                
                this._state.pause(reverse);
            },
            
            // called by pause() after the state is changed
            // runs pause callbacks synchronously
            _afterPause: function() {
                
                this._runCallbacks("pause");
            },
            
            // called by stop() before the state is changed
            // calls the _uninitializeProgress() method
            _beforeStop: function() {
                
                this._started = false;
                this._uninitializeProgress();
            },
            
            // called by stop() to change the state
            _stop: function() {
                
                this._state.stop();
            },
            
            // called by stop() after the state is changed
            // runs stop callbacks synchronously
            _afterStop: function() {
                
                this._runCallbacks("stop");
            },
            
            // called by update() to determine whether the animation should
            // be updated right now. if it returns true, a call to
            // _hasStarted() will be made to decide what to do next.
            // if it returns false, _noUpdate() will be called.
            // the semantics of the arguments must be defined by the subclass.
            _shouldUpdate: function() {
                
            },
            
            // called by update() to determine whether the animation has
            // started (passed its delay). if it returns true and the
            // animation has just started, _startedUpdate() will be called
            // and then _update() will be called.
            // if it returns false, _notStartedUpdate() will be called.
            // the semantics of the arguments must be defined by the subclass,
            // but this method is special in that it needs to function
            // correctly when no arguments are passed.
            _hasStarted: function() {
                
            },
            
            // called by update() when it determines that the animation should
            // be updated and has just started (passed its delay).
            // the semantics of the arguments must be defined by the subclass.
            _startedUpdate: function() {
                
            },
            
            // called by update() when it determines that the animation
            // should be updated but has not yet started (passed its delay).
            // the semantics of the arguments must be defined by the subclass.
            _notStartedUpdate: function() {
                
            },
            
            // called by update() when it determines that the animation should
            // be updated and has already started.
            // it must return a boolean indicating whether the animation has
            // completed.
            // the semantics of the arguments must be defined by the subclass.
            _update: function() {
                
            },
            
            // called by update() when it determines that the animation should
            // not be updated.
            // the semantics of the arguments must be defined by the subclass.
            _noUpdate: function() {
                
            },
            
            // called by update() to apply an update to the animation
            // after _update() has been called and _getProgress() has been
            // refreshed.
            _applyUpdate: function() {
                
            },
            
            // called by update() if the animation is paused after
            // _applyUpdate() has been called. typically, this should 
            // be used by subclasses to prevent more updates.
            _pausedUpdate: function() {
                
            },
            
            // called by update() after the animation has completed
            _completedUpdate: function() {
                
            },
            
            // initialize the animation's progress state with the calculated 
            // delay and duration values and an optional progress value.
            // the semantics of this must be defined by subclasses.
            _initializeProgress: function(delay, duration, progress) {
                
                
            },
            
            // uninitialize the animation's progress state.
            // the semantics of this must be defined by subclasses.
            _uninitializeProgress: function() {
                
                
            },
            
            // invert the animation's progress state with the calculated
            // delay and duration values.
            // this happens when an animation that was playing is
            // reversed or vice-versa.
            // the semantics of this must be defined by subclasses.
            _invertProgress: function(delay, duration) {
                
                
            },
            
            // get the animation's progress.
            // if a subclass wishes to implement progress caching,
            // it should only re-calculate the progress value
            // when the refresh parameter is true.
            // the semantics of this must be defined by subclasses.
            _getProgress: function(refresh) {
                
                
            },
            
            // get the parameters that will be passed to the animation's
            // delay callback function.
            _getDelayParameters: function() {
                
                return [];
            },
            
            // get the parameters that will be passed to the animation's
            // duration callback function.
            _getDurationParameters: function() {
                
                return [];
            },
            
            // get the parameters that will be passed to the animation's
            // event callback functions. the default implementation returns
            // an array with this animation the calculated progress, and
            // the calculated eased progress.
            _getCallbackParameters: function() {
                
                var progress = this._getProgress();
                return [this, progress, this._ease(progress)];
            },
            
            // ease the given progress value.
            // this should only be overridden if the subclass is using
            // non-numerical values for progress or the progress
            // range is not [0.0, 1.0].
            _ease: function(progress) {
                
                return (
                    typeof progress === "number"
                    ?
                        this.easing === null
                        ?
                        progress
                        :
                        this.easing(progress, 0.0, 1.0, 1.0)
                    :
                    null
                );
            },
            
            
            ///////////////////////////////////////////////////////////////////
            // internal methods
            //
            // these should generally not be overridden
            ///////////////////////////////////////////////////////////////////
            
            // get the animation's delay value
            _getDelay: function() {
                
                if (lang.isFunction(this.delay)) {
                    
                    return this.delay.apply(null, this._getDelayParameters());
                
                } else {
                    
                    return this.delay;
                }
            },
            
            // get the animation's duration value
            _getDuration: function() {
                
                if (lang.isFunction(this.duration)) {
                    
                    return this.duration.apply(null, this._getDurationParameters());
                    
                } else {
                    
                    return this.duration;
                }
            },
            
            // run the callback functions for the given animation event name
            _runCallbacks: function(name) {
                
                var callbacks = name in this._callbacks ? this._callbacks[name] : null;
                if (callbacks !== null) {
                    
                    array.forEach(callbacks, lang.hitch(this, this._runCallback));
                }
            },
            
            // run a callback function, passing values from
            // _getCallbackParameters
            _runCallback: function(callback) {
                
                callback.apply(null, this._getCallbackParameters());
            }
            
        });
        
        // define the package structure
        base.Animation = Animation;
        return base.Animation;
    }
);