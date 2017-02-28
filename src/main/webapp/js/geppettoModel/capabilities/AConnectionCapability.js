

/**
 * Client class use to augment a model with connection capabilities
 *
 * @module model/AConnectionCapability
 * @author Matteo Cantarelli
 */

define(['jquery'], function (require) {
    return {
        capabilityId: 'ConnectionCapability',
        A: null,
        B: null,

        /**
         * Get A
         */
        getA: function(){
            return this.A;
        },

        /**
         * Get B
         */
        getB: function(){
            return this.B;
        },

        /**
         * Set A
         */
        setA: function(a){
            this.A = a;
        },

        /**
         * Set B
         */
        setB: function(b){
            this.B = b;
        }
    }
});
