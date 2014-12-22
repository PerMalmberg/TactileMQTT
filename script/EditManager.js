
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
		
			if( myEditEnabled ) {
				DisableEdit();				
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
			
			// Download the new config file
			Download();
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
		
		var ApplyNewConfig = function()
		{
			RemoveEditRepsonseFunctions();			
			// Update model data
			var target = currentEditElementConfig.properties;
			for( var key in target ) {
				var source = $( "#userSetValue" + key );
				if( source.length == 1 ) {
					target[key] = source[0].value;
				}
			}		
			
			// Update view
			// qqq UICreator.Instance().Reinitialize( currentEditElementId, target );
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