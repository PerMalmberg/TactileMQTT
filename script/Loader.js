// Load jQuery and jQuery Mobile. See App.js
define(["jquery", "mobile"], function( $, mobile ) {
    // The plugins has loaded.

    $().ready( DomReady );

	function CZLoader() {
		CZLoader.prototype.LoadScripts = function() {
			$.getScript( "script/mqtt/MQTTBackend.js", function() {
				console.log( "MQTTBackend loaded" );
		 	} );
		};
	};   

	function DomReady()
	{

		var l = new CZLoader();
		l.LoadScripts();
	}
});





// http://web.archive.org/web/20080509080159/http://www.crockford.com/javascript/private.html
/*
Public

function Constructor(...) {
this.membername = value;
}
Constructor.prototype.membername = value;

Private

function Constructor(...) {
var that = this;
var membername = value;
function membername(...) {...}

}

Note: The function statement

function membername(...) {...}

is shorthand for

var membername = function membername(...) {...};

Privileged

function Constructor(...) {
this.membername = function (...) {...};
}
*/