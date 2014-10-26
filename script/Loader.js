// Load jQuery and jQuery Mobile. See App.js
require(["jquery", "MQTTBackend"], function( $, mqtt ) {
    // The plugins has loaded.

    $().ready( DomReady );

	function DomReady()
	{
		console.log( "DOM has loaded" );
		
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