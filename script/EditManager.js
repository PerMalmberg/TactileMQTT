
function EditableElement( id, startEditFn, endEditFn )
{
	this.Id = id;
	this.StartEdit = startEditFn;
	this.EndEdit = endEditFn;
}

var EditManager = (function() {
	"use strict";

	var myInstance = null;
	var myEditEnabled = false;
	var myConfig = null;
	
	var myEditableElements = [];

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	function EditManagerConstructor()
	{
	    this.ToggleEdit = function()
		{
			// Find the position elements
			var positions = $( "[id^='Tactile'][id$='-position']" );
		
			if( myEditEnabled ) {
				DisableEdit( positions );				
			}
			else {		
				EnableEdit( positions );
			}
			
			myEditEnabled = !myEditEnabled;
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var EndDrag = function( event, ui )
		{
			var element = ui.helper[0];
			
			// Find the element in the configuration
			var pages = myConfig.GetPath( "page.pages" );
			
			// TODO: Make this search/update more efficient. Any JSON manipulation libraries available?
			
			// Loop each page, and check if the element exists on that page
			var done = false;
			for( var pageIx in pages ) {
				var currPage = pages[pageIx];
				// Loop all elements on the page
				for( var key in currPage.elements ) {
					var currElement = currPage.elements[key];
					// Not all elements have the 'properties' property
					if( currElement.hasOwnProperty( "properties" ) ) {
						var prop = currElement.properties;
						// Is this the one we want?
						if( element.id == "Tactile" + prop.id + "-position" ) {
							// Set the position
							currElement.position = { top: ui.position.top, left: ui.position.left };
							done = false;
						}
					}
					
					if( done ) { break; }
				}
				
				if( done ) { break; }
			}
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		this.Init = function( configurationReader )
		{
			myConfig = configurationReader;
		
			$( window ).on( 'dblclick', function() {
				if( !myEditEnabled ) {
					if( confirm( "Enable edit mode?" ) ) {
						EditManager.Instance().ToggleEdit();
					}
				}
				else if( confirm( "Disable edit mode?" ) ) {
					EditManager.Instance().ToggleEdit();
				}
			});
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		this.RegisterEditableElement = function( editableElement )
		{
			myEditableElements.push( editableElement );
		}		
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var DisableEdit = function( positionElements )
		{
			positionElements.draggable( { disabled: true } );
				
			// Call EndEdit() on all registered elements
			for( var key in myEditableElements ) {
				var element = myEditableElements[key];
				element.EndEdit( element.Id );
			}
			
			console.log( "Disabled edit mode" );
			
			DisableEditTools();
			
			// Download the new config file
			Download();
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var EnableEdit = function( positionElements )
		{
			positionElements.draggable( { 
				disabled: false,
				cursor: "move",
				grid: [ 10, 10 ],
				start: function( event, ui ) {
					var positionElement = ui[0];
				},
				stop: EndDrag
			} );
				
			// Call StartEdit() on all registered elements
			for( var key in myEditableElements ) {
				var element = myEditableElements[key];
				element.StartEdit( element.Id );
			}
			
			EnableEditTools();
				
			console.log( "Enabled edit mode" );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var EnableEditTools = function()
		{
		
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var DisableEditTools = function()
		{
		
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var Download = function()
		{
			/*
			// Cannot set file name using data-url.
			var url = 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent( JSON.stringify( myConfig.GetConfig(), undefined, "\t" ) );
			window.open( url, '_blank' );
			window.focus();
			*/
			
			var link = document.createElement('a');
			link.download = "tactile.json";
			link.href = 'data:,' + encodeURIComponent( JSON.stringify( myConfig.GetConfig(), undefined, "\t" ) );
			link.click();
			link.remove();
			
		}
	};
	
	// Return the same instance each time - singelton
	return {
		Instance : function() {
			if( !myInstance ) {
				myInstance = new EditManagerConstructor();
			}
			return myInstance;
		}
	};
})();