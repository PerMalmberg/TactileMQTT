# General Design Items
* Configuration file stored on server.
  XML Format
  Describes layout of entire page, fixed positions of items.
  No autosizing - not required for how pages will be served; specific pages for specific clients/locations.
  Buidling blocks as pre-minified JavaScript/HTML.
* Generated code uses JavaScript (JQuery, maybe Bootstrap, Gridster?)
* Client backend uses Paho JavaScript MQTT Client:  http://www.eclipse.org/paho/clients/js/
* Configuration change notfications pushlished via MQTT to client, resulting in reload of configuration.
* Commands from clients must be prevented from being sent mutliple times (i.e. unintentional double-clicks); each command must be ACKd before a control can send a new command.
  Preferably a control should indicate a command is in progress instead of being completely disabled as that will give a more clear viewe of what is going on to the user.

#Server backend
* Use Bitnami Django Stack https://bitnami.com/stack/django
* Server generates complete page on request from client.
  Cache files to reduce server load.
  Output files needs to be minified.
  Serverside generator written in:
    * Current options:
      * Node.JS/ZMQ (http://zeromq.org/)
      * Python 3
