var MQTTBinder = (function() {
	"use strict";

	var myInstance = null;
	var mySubscriptions = {};
	var myElementCallback = {};

	function MQTTBinderConstructor()
	{
	    ///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
	    this.Bind = function( mqttBackend )
	    {
			// Find all elements with a class of mqttSubscriber
			var subs = $( ".mqttSubscriber" );
			
			subs.each( function() {
				// Get the topic
				var topic = $( this ).attr( "mqttTopic" );
				// Get the id of this element for use as lookup
				var id = $( this ).attr( "id" );
						
				// Get the type of the property
				var propType = $( this ).attr( "tactilePropType" ) || "string";
				
				if( topic && id && propType ) {
					if( !mySubscriptions.hasOwnProperty( topic ) ) {
						// New topic, create holder for ids.
						mySubscriptions[topic] = [];
					}
								
					mySubscriptions[topic].push( 
						{
							id : "#" + id,
							type : propType
						}
					);
					
					// Subscribe to the topic
					mqttBackend.Subscribe( topic );
				}
				else{
					console.log( "Missing topic, id or propType" );
				}
			});
		}

		
	    ///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.HandleMessage = function( topic, message )
		{
			try {
				// Any subscriptions for this topic?
				if( mySubscriptions[topic] ) {
					// Update all values
					for( var ix in mySubscriptions[topic] ) {
						var subInfo = mySubscriptions[topic][ix];
						var value;
						
						// Handle boolean values
						if( subInfo.type === "boolean" ) {
							value = message == "true" || message == "1";
						}
						else {
							value = message;
						}
																	
						var tactileElementType = $( subInfo.id ).attr( "tactileElementType" );
						try {				
							// Call refresh function
							if( myElementCallback[tactileElementType] ) {
								myElementCallback[tactileElementType]['updateVal']( subInfo.id, value );
							}
						}
						catch( err ) {
							console.log( "Error calling element callbacks: " + err.message );
						}
					}
				}
			}
			catch( err ) {
				console.log( "Error handling message: " + err.message );
			}
		}	
				
	    ///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.RegisterElementCallbacks = function( elementType, updateVal )
		{
			myElementCallback[elementType] = { updateVal: updateVal };
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