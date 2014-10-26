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

https://gist.github.com/jonnyreeves/2474026
http://stackoverflow.com/questions/944273/how-to-declare-a-global-variable-in-a-js-file

*/

