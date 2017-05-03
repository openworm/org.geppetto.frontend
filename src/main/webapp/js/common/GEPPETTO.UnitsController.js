
/**
 * Customizes units for Math.js library
 *
 */
define(function(require)
{
	var math = require('mathjs');
    return function(GEPPETTO)
    {
        GEPPETTO.UnitsController =
        {
        	unitsMap : [],
        	
            /**Adds external unit to local map:
             * unit : String representing unit to be added to map
             * label : String used to associated the unit label with
             *  e.g "kilometer" for unit : "km"
             */
            addUnit : function(unit,label){
            	this.unitsMap[unit] = label;
            },
            
            getUnitLabel : function(unit){
            	var label;
            	if(unit!=undefined && unit != null){
            		label = this.unitsMap[unit];
            	}
            	return label;
            },
            
            getUnitsMap : function(){
            	return this.unitsMap;
            },
            
            hasUnit : function(unit){
                var hasUnit = false;

            	var match = this.unitsMap[unit];
            	if(match!=undefined || match !=null){
                    hasUnit = true;
            	}

            	return hasUnit;
            }
        };

    };
});
