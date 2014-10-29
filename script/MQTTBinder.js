var MQTTBinder = (function() {
	"use strict";

	var myInstance = null;
	var mySubscriptions = {};
	var myRefreshFunc = {};

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
				
				// Get which property to change when a matching topic is received.
				var prop = $( this ).attr( "mqttValue" );
				
				// Get the type of the property
				var propType = $( this ).attr( "mqttPropType" );
				
				if( !mySubscriptions.hasOwnProperty( topic ) ) {
					// New topic, create holder for ids.
					mySubscriptions[topic] = [];
				}
								
				mySubscriptions[topic].push( 
					{
						id : "#" + id,
						prop : prop,
						type : propType
					}
				)
				
				// Subscribe to the topic
				mqttBackend.Subscribe( topic );
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
				if( mySubscriptions.hasOwnProperty( topic ) ) {
					// Update all values
					for( var ix in mySubscriptions[topic] ) {
						var subInfo = mySubscriptions[topic][ix];
						var value;
						
						// Handle boolean values
						if( subInfo.type === "boolean" ) {
							value = message == "true" || message == "1";
						}
						
						console.log( "Before change:" + $( subInfo.id ).prop( subInfo.prop ) );
												
						$( subInfo.id ).prop( subInfo.prop, value );
						
						var tactileElementType = $( subInfo.id ).attr( "mqttElementType" );
						
						// Call refresh function
						if( myRefreshFunc[tactileElementType] ) {
							myRefreshFunc[tactileElementType]( subInfo.id );
						}
						
						//$( subInfo.id ).flipswitch( 'refresh' );
						
						console.log( "After change:" + $( subInfo.id ).prop( subInfo.prop ) );
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
		this.RegisterRefresh = function( elementType, func )
		{
			myRefreshFunc[elementType] = func;
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