requirejs.config({
    "baseUrl": "script",
    "paths": {
      "app": "../script",
      "jquery": "//code.jquery.com/jquery-2.1.1.min",
      "mobile": "//code.jquery.com/mobile/1.4.4/jquery.mobile-1.4.4.min"
    },
});

// Load the main app module to start the app
requirejs(["app/Loader"]);

