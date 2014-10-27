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
		var myElements = [];

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
					var templateReader = new ConfigurationReader();
					var pages = myCfg.GetPath( "page.pages" );
					for( var currPage = 0; currPage < pages.length; ++currPage ) {
						CreatePage( pages[currPage], templateReader );
					}

					BindEvents();
					EnableUI();	
				}				
			}
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var CreatePage = function( pageData, templateReader )
		{
			if( pageData.pageName && pageData.elements ) {
				var pageName = pageData.pageName;
				
				// Create a duplicate of the template located in our DOM.
				var divPage = $( ".templatePage" ).clone();
				// Remove class used to find the div
				divPage.removeClass( "templatePage" );
				// Set the id attribute so it can be navigated to.
				divPage.attr( "id", pageName );
				
				// Loop the elements, and find each template.
				for( var i = 0; i < pageData.elements.length; ++i ) {
					var currElem = pageData.elements[i];
					var type = currElem.type;
					var prop = currElem.properties;
					//http://stackoverflow.com/questions/6643412/how-can-i-clone-modify-and-prepend-an-element-with-jquery					
				}
				
				// Append this page to the DOM.
				$("body").append( divPage );	
			}
			else {
				console.log( "Page does not contain pageName and/or elements" );
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
			// Bind event handler for all checkboxes
			$('form').on('change', ':checkbox', CheckBoxChange );
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ReadConfig = function()
		{
			var res = false;

			if( myCfg.Read( "/elements/element-index.json" ) ) {
				var elementContainer = myCfg.GetPath( "elements" );		
				
				if( elementContainer && elementContainer.length > 0 ) {		
									
					for( var i = 0; i < elementContainer.length; ++i ) {
						var element = elementContainer[i];
						myElements.push( element );						
					}
				
					if( myCfg.Read( "/conf/tactile.json" ) ) {
						// Get the page we're going to show when all things are done.
						myLandingPage = "#" + myCfg.GetString( "page", "landingPage" );
	
						res = true;
					}
				}
				else {
					console.log( "No elements could be found" );
				}
			}
			else {
				console.log( "Could not read configuration" );
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