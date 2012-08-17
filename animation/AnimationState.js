define(
    [
        "dojo/_base/declare",
        "./_base"
    ],
    function(declare, base) {
        
        
        ///////////////////////////////////////////////////////////////////////
        // The AnimationState class has methods for playing, reversing, 
        // pausing, stopping and querying the current state.
        
        
        ///////////////////////////////////////////////////////////////////////
        // internal static constants
        ///////////////////////////////////////////////////////////////////////
        
        var State = {
            
            // stopped and paused are mutually exclusive.
            // stopped indicates that the animation is not running
            // and that it currently stores no progress data.
            // paused indicates that the animation is not running
            // but that it is currently storing progress data.
            stopped: 1 << 0,
            paused: 1 << 2,
            
            // playing and reversing are mutually exclusive.
            // if the animation is stopped, neither should be set.
            // if the animation is paused, one should be set.
            // if the animation is neither stopped nor paused,
            // one should be set.
            playing: 1 << 3,
            reversing: 1 << 4
        };
        
        
        ///////////////////////////////////////////////////////////////////////
        // AnimationState class
        ///////////////////////////////////////////////////////////////////////
        
        var AnimationState = declare(null, {
            
            
            ///////////////////////////////////////////////////////////////////
            // internal state
            ///////////////////////////////////////////////////////////////////
            
            _state: State.stopped,
            
            
            ///////////////////////////////////////////////////////////////////
            // public api
            ///////////////////////////////////////////////////////////////////
            
            // n the playing state?
            isPlaying: function() {
                
                return (this._state & State.playing) !== 0;
            },
            
            // in the reversing state?
            isReversing: function() {
                
                return (this._state & State.reversing) !== 0;
            },
            
            // in the paused state?
            isPaused: function() {
                
                return (this._state & State.paused) !== 0;
            },
            
            // in the stopped state?
            isStopped: function() {
                
                return (this._state & State.stopped) !== 0;
            },
            
            // not in the stopped or paused state?
            isRunning: function() {
                
                return (this._state & (State.stopped | State.paused)) === 0;
            },
            
            // set the playing state
            play: function() {
                
                this._state = State.playing;
            },
            
            // set the reversing state
            reverse: function() {
                
                this._state = State.reversing;
            },
            
            // set the paused state, optionally specifying
            // whether to set the reversing state as well 
            pause: function(reverse) {
                
                if (reverse !== undefined) {
                
                    reverse = reverse || false;
                    this._state = State.paused | (reverse ? State.reversing : State.playing);
                
                } else {
                    
                    // if we're pausing a stopped animation,
                    // set the state to paused/playing.
                    // otherwise, just add the paused state.
                    if (this._state & State.stopped) {
                        
                        this._state = State.paused | State.playing;
                    
                    } else {
                        
                        this._state |= State.paused;
                    }
                }
            },
            
            // set the stopped state
            stop: function() {
                
                this._state = State.stopped;
            }
        });
        
        
        // define the package structure
        base.AnimationState = AnimationState;
        return base.AnimationState;
    }
);