"use strict";

function MQTTBackend()
{
	// Constructor code - private members
	if (!(this instanceof MQTTBackend)) {
        throw new TypeError("MQTTBackend constructor cannot be called as a function.");
    }

    var myHost = null;
    var myPort = 0;
    var myUserName = null;
    var myPassword = null;
    var myTimeout = 10;
    var client = null;
    var reconnectTimer = null;
    var myResponseMethod = messageRecevied;

    // Privileged function
    this.Start = function()
    {
		console.log( "Starting MQTT backend" );

		var jqxhr = $.getJSON( "/conf/mqtt.json", function( data ) {
			console.log( "Got configuration, reading...")
			myHost = data['mqtt'].host;
			myPort = Number( data['mqtt'].port );
			myUserName = data['mqtt'].user;
			myPassword = data['mqtt'].password;
			myTimeout = Number( data['mqtt'].timeout );
		}).fail(function() {
		    console.log( "error" );
		}).always( function() {
			client = new Paho.MQTT.Client( myHost, myPort, (new Date().getTime().toString() ) );
			client.onConnectionLost = ConnectionLost;
			client.onMessageArrived = MessageArrived;
			AttemptConnection();
		});		
	} // END Start

	var AttemptConnection = function()
	{
		console.log( "Attepting connection to: " + myHost + ":" + myPort );
		if( reconnectTimer ) {
			clearInterval( reconnectTimer );
		}

		if( myHost && myPort ) {
			if( myUserName && myPassword ) {
				console.log( "Connecting using user credentials" );
				client.connect( { onSuccess: Connected, timeout: myTimeout, userName: myUserName, password: myPassword } );
			}
			else {
				console.log( "Connecting as anonymous" );
				client.connect( { onSuccess: Connected, timeout: myTimeout } );	
			}
		}
		else {
			console.log( "No host or port set" );
		}
	}

	var Connected = function()
	{
		console.log( "Connected" );
	}

	var ConnectionLost = function( responseObject )
	{
		console.log( "Connection lost" );
		setInterval( AttemptConnection, 3000 );
	}

	var MessageArrived = function( message )
	{
		console.log( "onMessageArrived:"+ message.payloadString );
	}

}

