var DragManager = (function() {
	"use strict";

	var myInstance = null;
	var myDragEnabled = false;

	function DragManagerConstructor()
	{
	    this.ToggleDrag = function()
		{
			if( myDragEnabled ) {
				var positions = $( "[id^='Tactile'][id$='-position']" );
				positions.draggable( { disabled: true } );
				console.log( "Disabled dragging" );
			}
			else {
				// Find the position elements
				var positions = $( "[id^='Tactile'][id$='-position']" );
				positions.draggable( { 
					disabled: false,
					cursor: "move",
					grid: [ 10, 10 ],
					start: function( event, ui ) {
						var positionElement = ui[0];
					},
					stop: function() {
					
					}
				} );
					
				console.log( "Enabled dragging" );
			}
			
			myDragEnabled = !myDragEnabled;
		}
		
		this.Init = function()
		{
			$( window ).on( 'dblclick', function() {
				if( !myDragEnabled ) {
					if( confirm( "Enable edit mode?" ) ) {
						DragManager.Instance().ToggleDrag();
					}
				}
				else if( confirm( "Disable edit mode?" ) ) {
					DragManager.Instance().ToggleDrag();
				}
			});
		}
		
	};

	// Return the same instance each time - singelton
	return {
		Instance : function() {
			if( !myInstance ) {
				myInstance = new DragManagerConstructor();
			}
			return myInstance;
		}
	};
})();