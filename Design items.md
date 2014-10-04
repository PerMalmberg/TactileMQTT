# First stage
* Configuration file stored on server.
  XML Format
  Describes layout of entire page, fixed positions of items.
  Will not be "responsive".
  Buidling blocks as pre-minified JavaScript.
* Server generates complete page on request from client.
  Cache files to reduce server load.
  Output files needs to be minified.
* Generator written in Python 3
* Generated code uses JavaScript (JQuery, maybe Bootstrap, Gridster?)
* Client backend using Paho JavaScript MQTT Client:  http://www.eclipse.org/paho/clients/js/
* Configuration change notofications pushlished via MQTT to client, resulting in reload of configuration.
