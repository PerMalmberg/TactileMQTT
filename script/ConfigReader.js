// A configuration reader
// Uses JQuery to retrieve JSON data from the server and provides easy methods for reading values, with default values where the data is not present.
function ConfigurationReader() {
	"use strict";

	var myCfg = null;
	var myIsValid = false;
	var timer = null;
	var myUrl = null;
	var loadTime = new Date().getTime();

	this.Read = function( url, doAutomaticPageReloads )
	{
		myUrl = url;

		var jqxhr = $.ajax(
			{
				cache: false,
				dataType: "json",
				url: url,
				async: false,
				error: OnError,
				success: OnSuccess
			}
		 );

		if( typeof doAutomaticPageReloads !== 'undefined' && doAutomaticPageReloads ) {
			timer = setInterval( CheckConfig, this.GetNum( "configurationCheck", "interval", 300 ) * 1000 ); // Interval is specified in seconds.
		}

		return myIsValid;
	}

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	this.GetString = function( objectName, parameterName, defaultValue )
	{
		var res = defaultValue;

		if( myCfg ) {
			if( myCfg.hasOwnProperty( objectName ) ) {
				var obj = myCfg[objectName];
				if( obj.hasOwnProperty( parameterName ) ) {
					res = myCfg[objectName][parameterName];
				}
				else {
					console.log( "Paramter name " + parameterName + " does not exist in object " + objectName );
				}
			}
			else {
				console.log( "Object " + objectName + " does not exist in data" );
			}
		}
		
		return res;
	}

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	this.GetNum = function( objectName, parameterName, defaultValue )
	{
		var res = this.GetString( objectName, parameterName, "" );

		var returnVal = defaultValue;

		// Compare with conversion of types
		if( res != "" ) {
			returnVal = Number( res );
		}

		return returnVal;
	}

	///////////////////////////////////////////////////////////////////////////////////
	//
	// Gets an JSON object from the specified path.
	// If provided, reads data from the json object, otherwise from the
	// Read()'d configuration file.
	//
	///////////////////////////////////////////////////////////////////////////////////
	this.GetPath = function( path, json )
	{
		var obj = null;

		if( json ) {
			// Read from the provided JSON object
			obj = json
		}
		else {
			// Read from our own config
			obj = myCfg;
		}

		var parts = path.split('.');
		
		if( parts && obj ) {
			for( var i = 0; obj != null && i < parts.length; ++i ) {
	  			obj = obj[parts[i]];
			}
		}
		else {
			console.log( "Invalid arguments" );
		}
		
    	return obj;
	}

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	var OnError = function( jqXHR, textStatus, errorThrown )
	{
		console.log( "Failed to retrieve configuration: " + errorThrown );
	}

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	var OnSuccess = function( data, textStatus, jqXHR )
	{
		myCfg = data;
		myIsValid = true;
	}

	///////////////////////////////////////////////////////////////////////////////////
	//
	//
	///////////////////////////////////////////////////////////////////////////////////
	var CheckConfig = function()
	{
		 $.ajax( myUrl,
		 	{
        		type : 'HEAD',
        		success : function( response, status, xhr) {
	            	var lastModified = new Date(xhr.getResponseHeader('Last-Modified')).getTime();
            		if( lastModified > loadTime ) {
            			console.log( "Configuration updated, reloading page." );
						window.location.reload( true );
            		}
            		else {
            			console.log( "not changed");
            		}
        		}
    		}
    	);
	}
}