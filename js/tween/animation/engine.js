define(
    [
        "./engine/Engine"
    ],
    function(Engine) {
        
        // the animation engine singleton
        // (set to request update frames every 5 milliseconds)
        return new Engine({
            rate: 5
        });
    }
);
