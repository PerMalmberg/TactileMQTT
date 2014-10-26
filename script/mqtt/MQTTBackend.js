var MQTTBackend = (function() {
	"use strict";

	var myInstance = null;

	function MQTTBackendConstructor()
	{
	    var myHost = null;
	    var myPort = 0;
	    var myUserName = null;
	    var myPassword = null;
	    var myTimeout = 10;
	    var client = null;
	    var reconnectTimer = null;
	    var myKeepAliveInterval = 60;
	    var myResponseMethod = null;

	    var myNotYetSubscribedTopics = [];
	    var myTotalMessageCount = 0;
	    var myIsConnected = false;

	    ///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
	    this.Start = function()
	    {
			console.log( "Starting MQTT backend" );

			var cfgReader = new ConfigurationReader();
			if( cfgReader.Read( "/conf/mqtt.json" ) ) {
				myHost = cfgReader.GetString( 'mqtt', 'host', '127.0.0.1' );
				myPort = cfgReader.GetNum( 'mqtt', 'port', 8000 );
				myUserName = cfgReader.GetString( 'mqtt', 'user', null );
				myPassword = cfgReader.GetString( 'mqtt', 'password', null );
				myTimeout = cfgReader.GetNum( 'mqtt', 'connectionTimeout', 10 );
				myKeepAliveInterval = cfgReader.GetNum( 'mqtt', 'keepAliveInterval', 5 );
				AttemptConnection();
			}
			else {
				console.log( "Failed to retrieve configuration" );
			}
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.Send = function( topic, message )
		{
			if( IsConnected() ) {
				try {
					var msg = new Paho.MQTT.Message( message );
					msg.destinationName = topic;
					client.send( msg );
				}
				catch( err ) {
					console.log( "Failed to send message" );
					Disconnect();
					SetupReconnect();
				}
			}
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		this.Subscribe = function( topic )
		{
			if( IsConnected() ) {
				try {
					var subOps = {
						qos: 2
					};

					client.subscribe( topic, subOps );
				}
				catch( err ) {
					console.log( "Failed to subscribe" );
					Disconnect();
					SetupReconnect();
					myNotYetSubscribedTopics.push( topic );
				}
			}
			else {
				myNotYetSubscribedTopics.push( topic );
			}
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var AttemptConnection = function()
		{
			clearInterval( reconnectTimer );

			if( myHost && myPort ) {
				console.log( "Attepting connection to: " + myHost + ":" + myPort );
				if( !client ) {
					client = new Paho.MQTT.Client( myHost, myPort, (new Date().getTime().toString() ) );
					client.onConnectionLost = ConnectionLost;
					client.onMessageArrived = MessageArrived;
				}

				try {
					var conOps = {
						onSuccess: Connected,
						timeout: myTimeout, 
						onFailure: ConnectionFailure,
						keepAliveInterval: myKeepAliveInterval,
						invocationContext: MQTTBackend.Instance()
					};

					if( myUserName && myPassword ) {
						console.log( "Connecting using user credentials" );
						conOps.userName = myUserName;
						conOps.password = myPassword;
					}
					else {
						console.log( "Connecting as anonymous" );
					}

					client.connect( conOps );
				}
				catch( err ) {
					console.log( "Connection attempt failed: " + err );
					SetupReconnect();
				}
			}
			else {
				console.log( "No host or port set" );
			}
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var Disconnect = function()
		{
			if( client ) {
				try {
					client.disconnect();
					clearInterval( reconnectTimer );
				}
				catch( err ) {
					console.log( "Disconnection failed: " + err );
				}
			}
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var SetupReconnect = function()
		{
			if( reconnectTimer ) {
				clearInterval( reconnectTimer );
			}
			reconnectTimer = setInterval( AttemptConnection, 3000 );
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var Connected = function( invocationContext )
		{
			console.log( "Connected" );
			myTotalMessageCount = 0;
			myIsConnected = true;
			while( myNotYetSubscribedTopics.length > 0 ) {
				client.subscribe( myNotYetSubscribedTopics.pop(), { qos: 2} );
			}
		}
		
		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ConnectionFailure = function( reason )
		{
			myIsConnected = false;
			console.log( "MQTT connection attempt failed: " + reason.errorMessage + "(" + reason.errorCode + ")" );
			SetupReconnect();
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var ConnectionLost = function( reason )
		{
			myIsConnected = false;
			console.log( "MQTT connection lost: " + reason.errorMessage + "(" + reason.errorCode + ")" );
			SetupReconnect();
		}

		///////////////////////////////////////////////////////////////////////////////////
	    //
	    //
	    ///////////////////////////////////////////////////////////////////////////////////
		var MessageArrived = function( message )
		{
			++myTotalMessageCount;
			console.log( "onMessageArrived:"+ message.payloadString );
		}

		var IsConnected = function()
		{
			return client && myIsConnected;
		}
	};

	return {
		Instance : function() {
			if( !myInstance ) {
				myInstance = new MQTTBackendConstructor();
			}
			return myInstance;
		}
	};
})();