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
				// Set page title
				divPage.attr( "data-title", pageData.pageTitle );
				// Append this page to the DOM so we can work with it using jQuery
				$("body").append( divPage );
				
				// Loop the elements, and find each template.
				for( var i = 0; i < pageData.elements.length; ++i ) {
					var currElem = pageData.elements[i];
						
					// Search for the template data files.
					var templateFile = FindElementTemplate( currElem.type );
					
					if( templateFile ) {
						
						if( templateReader.Read( "/elements/" + templateFile ) ) {
							var template = templateReader.GetPath( currElem.type );
							if( template ) {
								CreateElement( pageName, template, currElem );
							}
						}
					}
					else {
						console.log( "Could not find a matching for template file for element type '" + type + "'" );
					}
				}	
			}
			else {
				console.log( "Page does not contain pageName and/or elements" );
			}
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var CreateElement = function( pageName, template, elementConfig )
		{
			// Get the div with the class 'ui-content' we're supposed to work on.
			var page = $( "#" + pageName ).find( ".ui-content" );
			if( page ) {
				// Create a dom object and insert it into the page
				page.append( $.parseHTML( template.html ) );
				// Find the newly added element by class.
				var positionElement = $( ".tactilePosition" );
				var element = $( ".tactileElement" );
				// Remove all classes
				positionElement.removeClass();
				element.removeClass();
				// Set id based on page name and configured id.
				positionElement.attr( "id", pageName + "-position-" + elementConfig.properties.id ); 
				element.attr( "id", pageName + "-" + elementConfig.properties.id ); 				
				ApplyDefaultProperties( element, template.properties );
				ApplyConfiguredProperties( element, elementConfig.properties );
				ApplyPosition( positionElement, elementConfig.position );
			}
			else {
				console.log( "Could not find a div with class 'ui-content' in page '" + pageName + "'" ); 
			}	
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ApplyDefaultProperties = function( element, props ) 
		{
			for( var key in props ) {
				element.attr( key, props[key].default );
			}			
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ApplyConfiguredProperties = function( element, props ) 
		{
			for( var key in props ) {
				element.attr( key, props[key] );
			}			
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ApplyPosition = function( element, position )
		{
			// All elements are placed using fixed positioning
			element.css( position );
			element.css( "position", "fixed" );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var FindElementTemplate = function( typeName )
		{
			var res = null;
			
			for( var i = 0; !res && i < myElements.length; ++i ) {
				if( myElements[i].elementName == typeName ) {
					res = myElements[i].template;
				}
			}
			
			return res;
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
						myElements.push( elementContainer[i] );						
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