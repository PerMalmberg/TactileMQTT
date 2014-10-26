requirejs.config({
    baseUrl: "script",
    urlArgs: "bust=" + (new Date()).getTime(),
    paths: {
    	"jquery": "//code.jquery.com/jquery-2.1.1.min",
    	"MQTTBackend": "mqtt/mqttws31",
    	"MQTTBackend": "//code.jquery.com/jquery-2.1.1.min"
    },
    waitSeconds: 3
});

// Load the main app module to start the app
requirejs(["Loader"]);

