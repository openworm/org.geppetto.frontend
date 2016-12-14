define(function (require, exports, module) {

    var geppettoCommonLibrary = require('json!./GeppettoCommonLibrary.json');

    function getTypeById(typeId){
        for (var typeIndex in geppettoCommonLibrary.types){
            if (geppettoCommonLibrary.types[typeIndex].id == typeId){
                return "types." + typeIndex;
            }
        }
    }

    function getGeppettoCommonLibrary(){
        return geppettoCommonLibrary;
    }

    return {
		getGeppettoCommonLibrary: getGeppettoCommonLibrary,
        getTypeById: getTypeById
	};

})