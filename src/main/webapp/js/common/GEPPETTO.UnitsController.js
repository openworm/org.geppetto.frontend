
/**
 * Customizes units for Math.js library
 *
 */
define(function(require)
{
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
            	unit = unit.replace(/\s/g,'');
            	this.unitsMap[unit] = label;
            },
            
            getUnitLabel : function(unit){
            	var label;
            	unit = unit.replace(/\s/g,'');
            	if(unit!=undefined && unit != null){
            		label = this.unitsMap[unit];
            	}
            	return label;
            },
            
            getUnitsMap : function(){
            	return this.unitsMap;
            },
            
            hasUnit : function(unit){
            	unit = unit.replace(/\s/g,'');
            	
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
