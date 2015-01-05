var UICreator = (function() {
	"use strict";
	 
	var myInstance = null;
	var includedElementScripts = [];
	var myLandingPage = null;
	var myInitFunctions = {};
	var mySetPropertiesFunction = {};
	var pageNavigationSubscribers = {};

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
		var NotifyNavigationSubscribers = function()
		{
			// The hash is the first part
			var hash = location.hash.split( "?" )[0];
			// Now remove and parameters (i.e. &param=value)
			hash = hash.split( "&" )[0];
			// Remove starting #-sign
			hash = hash.replace(/^.*?(#|$)/,'');
			for( var elementId in pageNavigationSubscribers ) {
				pageNavigationSubscribers[elementId]( elementId, hash || "" );
			}
		}
		
		// Hook the page navigation event
		$( window ).hashchange( NotifyNavigationSubscribers );
		
		// Hook the loaded event
		$( window ).ready( NotifyNavigationSubscribers );
						
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
					var htmlReader = new HTMLReader();
					var pages = myCfg.GetPath( "page.pages" );
					for( var currPage = 0; currPage < pages.length; ++currPage ) {
						CreatePage( pages[currPage], templateReader, htmlReader );
					}
			
					// Remove the template page
					$( ".templatePage" ).remove();
			
					EnableUI();	
				}				
			}
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.RegisterInit = function( elementType, func )
		{
			myInitFunctions[elementType] = func;
		}
		
		this.RegisterSetProperties = function( elementType, func )
		{
			mySetPropertiesFunction[elementType] = func;
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.RegisterPageNavigationSubscriber = function( elementId, func )
		{
			pageNavigationSubscribers[elementId] = func;
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.GetConfig = function()
		{
			return myCfg;
		}
				
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.Reinitialize = function( elementId, properties, defaultConfig )
		{
			var elementType = $( "#" + elementId ).attr( "tactileEditType" );
			
			// Has this element type registered a set properties function?
			if( mySetPropertiesFunction[elementType] ) {
				mySetPropertiesFunction[elementType](
					{
						elementId: "#" + elementId,
						elementConfig: SpahQL.db( properties ),
						defaultConfig: SpahQL.db( defaultConfig )
					}
				);
			}
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    // element is a pre-selected element
		// attribute is the name of the attribute to set on the 'element'
		// configPath is the path to where the data is found in the 'sourceDb'
		// sourceDb is a SpahQL object
		//
	    ///////////////////////////////////////////////////////////////////////////////////
		this.SetElementAttribute = function( element, attributeName, configPath, sourceDb )
		{
			var data = sourceDb.select( configPath );
			if( data.length == 1 ) {
				element.attr( attributeName, data[0].value );
			}
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var CreatePage = function( pageData, templateReader, htmlReader )
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
					var templateData = FindElementTemplate( currElem.type );
					
					if( templateData ) {						
						if( templateReader.Read( "elements/" + templateData.elementName + ".json" ) ) {
							if( htmlReader.Read( "elements/" + templateData.elementName + ".html" ) ) {
								var template = templateReader.GetPath( currElem.type );
								if( template ) {
									var elementId = CreateElement( pageName, template, htmlReader.Get(), currElem );
									
                                    // Set an attribute enabling the EditManager to determine what type this element is.
                                    $( elementId ).attr( "tactileEditType", currElem.type );

																
									// Has this element type registered an initialization function?									
									if( myInitFunctions[currElem.type] ) {
										myInitFunctions[currElem.type]( 
											{ 
												elementId: elementId,
												currentPage: pageName,
												elementConfig: currElem,
												templateConfig: template
											}
										);
									}
									
									// Has this element type registered a set properties function?
									if( mySetPropertiesFunction[currElem.type] ) {
										// Call setter function with default & current config as SpahQL objects.
										mySetPropertiesFunction[currElem.type](
											{
												elementId: elementId,
												elementConfig: SpahQL.db( currElem ),
												defaultConfig: SpahQL.db( template )
											}
										);
									}
									
									$( elementId ).trigger( "create" );
								}
								else {
									console.log( "Could not get template for '" + currElem.type + "'" );
								}
							}
							else {
								console.log( "Could not read HTML template for '" + currElem.type + "'" );
							}
						}
					}
					else {
						console.log( "Could not find a matching template file for element type '" + currElem.type + "'" );
					}
				}
			
				// Lastly trigger the create event on the page to make sure all elements are initialized.
				divPage.trigger( 'create' );
			}
			else {
				console.log( "Page does not contain pageName and/or elements" );
			}
		}
				
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var CreateElement = function( pageName, template, htmlTemplate, elementConfig )
		{
			var elementId = null;
		
			// Get the div with the class 'ui-content' we're supposed to work on.
			var page = $( "#" + pageName ).find( ".ui-content" );
			if( page ) {
			
				// Only load script the first time an element type is created.
				var loadScript = false;
				if( includedElementScripts.indexOf( elementConfig.type ) == -1 ) {
					// Load scripts this time...
					loadScript = true;
					// ...but prevent loading it again for this type.
					includedElementScripts.push( elementConfig.type );					
				}				
			
				// Create a dom object and insert it into the page
				var dom = $.parseHTML( htmlTemplate, loadScript );
			
				if( dom ) {			
					// Where should this element be placed?
					if( elementConfig.placement == "body" ) {
						$( "body" ).append( dom );
					}
					else { 					
						page.append( dom );
					}
					
					// Find the newly added element by class and remove the class
					var element = $( ".tactileElement" );
					element.removeClass( "tactileElement" );
					
					// Get the id from the configuration
					if( elementConfig.hasOwnProperty( "properties" ) && elementConfig.properties.hasOwnProperty( "id" ) ) {
						elementId =  elementConfig.properties.id;
						element.attr( "id", elementId );
						ApplyPlacement( elementConfig, template, elementId );
						
						// Setup the property edit handle, if present, to help the EditManager to find the element to edit later on.
						$( ".tactileEditHandle", $( dom ) ).attr( "elementIdToEdit", elementId );
						
						// Return id with preceding hash sign.
						elementId = "#" + elementId;
					}
					else {
						console.log( "Missing property.id on element on page '" + pageName + "'" );
					}
				}
			}
			else {
				console.log( "Could not find a div with class 'ui-content' in page '" + pageName + "'" ); 
			}	
			
			return elementId;
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ApplyPlacement = function( elementConfig, templateConfig, tactileId )
		{
			// Find the singular element with the position-class
			var placementElement = $( ".tactilePlacement" );
			
			if( placementElement && placementElement.length == 1 ) {
				placementElement.removeClass( "tactilePlacement" );
				// Set an id.
				placementElement.attr( "id", "Tactile" + tactileId + "-position" );
				
				// All elements are placed using fixed positioning
				placementElement.css( "position", "fixed" );
				
				// Apply default placement
				if( templateConfig.position ) {
					if( templateConfig.position.top && templateConfig.position.top.default ) { placementElement.css( "top", templateConfig.position.top.default ); }
					if( templateConfig.position.left && templateConfig.position.left.default ) { placementElement.css( "left", templateConfig.position.left.default ); }
				}
				
				if( templateConfig.size ) { 
					if( templateConfig.size.height && templateConfig.size.height.default ) { placementElement.css( "height", templateConfig.size.height.default ); }
					if( templateConfig.size.width && templateConfig.size.width.default ) { placementElement.css( "width", templateConfig.size.width.default ); }
				}
				
				// Apply configured placement
				if( elementConfig.position ) { placementElement.css( elementConfig.position ); }				
				if( elementConfig.size ) { placementElement.css( elementConfig.size ); }
			}
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
					res = myElements[i];
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
		var ReadConfig = function()
		{
			var res = false;

			if( myCfg.Read( "elements/element-index.json" ) ) {
				var elementContainer = myCfg.GetPath( "elements" );		
				
				if( elementContainer && elementContainer.length > 0 ) {		
									
					for( var i = 0; i < elementContainer.length; ++i ) {
						myElements.push( elementContainer[i] );						
					}
				
					if( myCfg.Read( "conf/tactile.json" ) ) {
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