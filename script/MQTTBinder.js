var MQTTBinder = (function() {
	"use strict";

	var myInstance = null;

	function MQTTBinderConstructor()
	{
	    ///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
	    this.Bind = function()
	    {
		}

		this.HandleMessage = function( topic, message )
		{
			console.log( message );
		}		
	};

	// Return the same instance each time - singelton
	return {
		Instance : function() {
			if( !myInstance ) {
				myInstance = new MQTTBinderConstructor();
			}
			return myInstance;
		}
	};
})();