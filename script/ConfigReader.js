// A configuration reader
// Uses JQuery to retrieve JSON data from the server and provides easy methods for reading values, with default values where the data is not present.
function ConfigurationReader() {
	"use strict";

	var myCfg = null;
	var myIsValid = false;

	this.Read = function( url )
	{
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
}