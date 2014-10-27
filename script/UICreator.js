var UICreator = (function() {
	"use strict";
	 
	var myInstance = null;
	var myLandingPage = null;

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	function UICreatorConstructor() {
	
		var elementsCreated = false;
		var myCfg = new ConfigurationReader();		

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.BuildPages = function()
		{
			// Only allow one call per page-load
			if( !elementsCreated ) {
				elementsCreated = true;

				if( ReadConfig() ) {
					BindEvents();
					EnableUI();	
				}				
			}
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var EnableUI = function()
		{
			$('#one').trigger('create');

			if( myLandingPage ) {
				$.mobile.navigate( myLandingPage );
			}
			else {
				console.log( "No landing page defined in configuration" );
			}
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////		
		var BindEvents = function()
		{
			// Bind eventhandler for all checkboxes
			$('form').on('change', ':checkbox', CheckBoxChange );
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ReadConfig = function()
		{
			var res = false;

			if( myCfg.Read( "/conf/tactile.json" ) ) {
				// Get the JQMobile page we're going to show when all things are done.
				myLandingPage = "#" + myCfg.GetString( "page", "landingPage" );

				var page = myCfg.GetPath( "page.pages" );
				for( var currPage = 0; currPage < page.length; ++currPage ) {
					console.log( page[currPage] );
				}

				res = true;
			}

			return res;
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var CheckBoxChange = function( event )
		{
			var id ="#" + event.target.id;
			console.log( $( id ).data( "mqtt-topic") );
		}
	}
	

	// Return the same instance each time - singelton
	return {
		Instance : function() {
			if( !myInstance ) {
				myInstance = new UICreatorConstructor();
			}
			return myInstance;
		}
	};

})();