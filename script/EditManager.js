
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
	var currentEditElementConfig = null;
	var currentEditElementId = 0;
	var currentEditTemplate = null;
	var myElementIndex = null;
	
	
	var myEditableElements = [];
	var editMenuPos = {};

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	function EditManagerConstructor()
	{
		myElementIndex = new ConfigurationReader();
		myElementIndex.Read( "elements/element-index.json" );
	
	    this.ToggleEdit = function()
		{
			// Find the position elements
		
			if( myEditEnabled ) {
				DisableEdit();
				// Download the new config file
				Download();
			}
			else {		
				EnableEdit();
			}
			
			myEditEnabled = !myEditEnabled;
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		this.IsEditing = function()
		{
			return myEditEnabled;
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
			
			BindEditTrigger();
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		this.Init = function( configurationReader )
		{
			myConfig = configurationReader;
			BindEditTrigger();
			
			// Custom menu based on StackOverflow answer: http://stackoverflow.com/questions/4495626/making-custom-right-click-context-menus-for-my-web-app 
			$( document ).bind( "contextmenu", function( event ) {
				
				// Avoid the real one
				event.preventDefault();
				
				if( EditManager.Instance().IsEditing() ) {				
					// Show contextmenu
					BuildAddElementMenu();
					
					editMenuPos.X = event.pageX;
					editMenuPos.Y = event.pageY;
					
					$( ".editManager-menu" ).finish().toggle( 100 ).css(
						// In the right position (the mouse)
						{
							top: event.pageY + "px",
							left: event.pageX + "px"
						}
					);
				}
			});
			
			// If the document is clicked somewhere
			$( document ).bind( "mousedown", function( e ) {
				// If the clicked element is not the menu
				if( $( e.target ).parents( ".editManager-menu" ).length == 0) {					
					// Hide it
					$(".editManager-menu").hide( 100 );
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
		var BindEditTrigger = function()
		{
			// Use event namespacing to be able to remove only this handler.
			$( 'body' ).on( 'taphold.editManager', function() {
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
		var BuildAddElementMenu = function()
		{
			var menu = $( ".editManager-menu" );
			menu.empty();
			
			if( myElementIndex.IsValid() ) {						
				var elements = myElementIndex.GetPath( "elements" );
				for( var item in elements ) {
					AddElementMenu( elements[item].elementName, elements[item].description );
				}
			}
			else {
				AddElementMenu( "NoType", "Could not read element types, see debug output" );
			}
			
			// Setup event for clicks on menu items.
			$(".editManager-menu li").click( function() {
				// Hide menu
				$(".editManager-menu").hide( 0 );
				
				// This is the triggered action name
				AddElement( $(this).attr( "data-action" ) );				
			} );
			
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var AddElementMenu = function( typeName, title )
		{
			var menu = $( ".editManager-menu" );
			menu.append( "<li data-action='" + typeName + "'>" + title + "</li>" );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var AddElement = function( elementType ) 
		{
			// Add an instance of the provided element type to the current page.
			UICreator.Instance().AddNewElement( elementType, editMenuPos.X, editMenuPos.Y );
			DisableEdit();
			EnableEdit();
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var UnbindEditTrigger = function()
		{
			$( 'body' ).off( 'taphold.editManager' );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var DisableEdit = function( positionElements )
		{
			$( ".tactileDragHandle" ).css( 'visibility', 'hidden' );
			$( ".tactileEditHandle" ).css( 'visibility', 'hidden' );			
			
			GetPositionElements().draggable( { disabled: true } );
				
			// Call EndEdit() on all registered elements
			for( var key in myEditableElements ) {
				var element = myEditableElements[key];
				element.EndEdit( element.Id );
			}
			
			console.log( "Disabled edit mode" );
			
			// Unbind edit property handler
			$( '.tactileEditHandle' ).off( 'click.editProperties' );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var EnableEdit = function()
		{
			$( ".tactileDragHandle" ).css( 'visibility', 'visible' );
			$( ".tactileEditHandle" ).css( 'visibility', 'visible' );
		
			var positionElements = GetPositionElements();
		
			positionElements.draggable( { 
				disabled: false,
				cursor: "move",
				handle: ".tactileDragHandle",
				grid: [ 1, 1 ],
				start: function( event, ui ) {
					var positionElement = ui[0];
					UnbindEditTrigger();
				},
				stop: EndDrag
			} );
				
			// Call StartEdit() on all registered elements
			for( var key in myEditableElements ) {
				var element = myEditableElements[key];
				element.StartEdit( element.Id );
			}
			
			// Bind edit property handler
			$( '.tactileEditHandle' ).on( 'click.editProperties', function( ev ) {
				OpenPropertyEditor( ev.target );
			});
						
			console.log( "Enabled edit mode" );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var GetPositionElements = function()
		{
			return $( "[id^='Tactile'][id$='-position']" );
		}	
			
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var OpenPropertyEditor = function( editHandle )
		{
			currentEditElementId = $( editHandle ).attr( "elementIdToEdit" );
			var element = $( "#" + currentEditElementId );
			var elementType = element.attr( "tactileElementType" );
					
			// Create a SpahQL database
			var config = SpahQL.db( myConfig.GetConfig() );
			
			// Find the element by the id
			var foundConfig = config.select( "//elements/*[/properties/id == " + currentEditElementId + " ]" );
			
			
			if( foundConfig.length == 1 ) {
				currentEditElementConfig = foundConfig[0].value;
				// We have found our element in the current configuration.
				// Now read the configuration template for the element type
				var templatePath = "elements/" + elementType + ".json";
				var templateReader = new ConfigurationReader();		
				if( templateReader.Read( templatePath ) ) {				
					// Template data read, create the dialog
					OpenEditDialog( templateReader.GetPath( elementType ), currentEditElementConfig );
				}
				else {
					console.log( "Could not read template data for element of type: '" + elementType + "'" );
				}
				
			}
			else {
				currentEditElementConfig = null;
				console.log( "Could not find element with id '" + currentEditElementId + "'" );
			}
			
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var OpenEditDialog = function( templateData, currentConfig )
		{
			// Find dialog element we will update with new input fields.
			var table = $( "#editDialog" ).find( "#fields" );
			// Build the input fields.
			BuildPropertyEditor( templateData, table, currentConfig );	
			// Open dialog
			$( "#lnkDialog" ).click();
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var BuildPropertyEditor = function( templateData, table, currentConfig )
		{
			// Clear any old fields
			var prev = $( "#editDialog" ).find( "#editDialogRow" );
			while( prev.length > 0 ) {
				prev.remove();
				prev = $( "#editDialog" ).find( "#editDialogRow" );
			}
			$( "#editDialog" ).find( "#editorButtons" ).remove();
		
			currentEditTemplate = templateData;
		
			// Build the edit labels and fields for the current element.
			var htmlReader = new HTMLReader( "text" );
			htmlReader.Read( "script/ElementEditorTemplateRow.html" );
			var rowTmpl = $.parseHTML( htmlReader.Get() );
			htmlReader.Read( "script/ElementEditorTemplatePropertyField.html" );
			var fieldTmpl = $.parseHTML( htmlReader.Get(), false );
			htmlReader.Read( "script/ElementEditorTemplateButtons.html" );
			var buttonTmpl = $.parseHTML( htmlReader.Get(), false );
			
			for( var prop in templateData["properties"] ) {
				var curr = templateData["properties"][prop];
				// Add row and cells
				var row = rowTmpl[0].cloneNode( true );
				var fields = fieldTmpl[0].cloneNode( true ).innerHTML;
				row.innerHTML = fields;
				table.append( row );
				// Update cell label
				$( row ).find( "#label" ).text( curr.desc );
				// Update property value
				var currValue = currentConfig.properties[prop];
				var editBox = $( row ).find( "#value" );
				editBox.attr( "id", "userSetValue" + prop );
				if( typeof currValue == "undefined" || currValue == curr.default ) {
					// Display default value
					editBox.attr( "value", curr.default );
				}
				else {
					// Display current value
					editBox.attr( "value", currValue );					
				}
			}
			
			table.append( buttonTmpl );
			// Bind response methods to buttons
			$( table ).find( "#editDialogOk" ).on( "click", ApplyNewConfig );
			$( table ).find( "#editDialogCancel" ).on( "click", RemoveEditRepsonseFunctions );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var ApplyNewConfig = function()
		{
			RemoveEditRepsonseFunctions();			
			// Update model data
			var target = currentEditElementConfig.properties;
			for( var key in currentEditTemplate.properties ) {
				var source = $( "#userSetValue" + key );
				if( source.length == 1 ) {
					target[key] = source[0].value;
				}
			}		
			
			// Update view
			UICreator.Instance().Reinitialize( currentEditElementId, currentEditElementConfig, currentEditTemplate );
			
			// Rebind MQTT events
			MQTTBinder.Instance().Rebind();
		}
		
		var RemoveEditRepsonseFunctions = function()
		{
			$( "#editDialog" ).find( "#editDialogOk" ).off( "click" );
			$( "#editDialog" ).find( "#editDialogCancel" ).off( "click" );
		}
		
		///////////////////////////////////////////////////////////////////////////////////
		//
		//
		///////////////////////////////////////////////////////////////////////////////////
		var Download = function()
		{	
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