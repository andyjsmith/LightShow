var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var Color = require('color');

var Gpio = require('pigpio').Gpio,
        red = new Gpio(17, {mode: Gpio.OUTPUT}),
        green = new Gpio(24, {mode: Gpio.OUTPUT}),
        blue = new Gpio(22, {mode: Gpio.OUTPUT}),
        dutyCycle = 0;
        
var redVal = 0;
var greenVal = 0;
var blueVal = 0;

var currentTimeout,
    currentInterval,
    delayTimeout,
    pauseCurrentInterval = false,
    brightness = 1;

app.use(bodyParser.urlencoded({
	extended: true
}));

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

app.use('/', express.static('public'));

app.listen(80, function() {
	console.log('Listening on port 80');
});

app.post('/setcolor', function(req, res) {
	console.log("R=" + req.body.r + "\tG=" + req.body.g + "\tB=" + req.body.b);
	clearCurrentInterval();
	set(req.body.r, req.body.g, req.body.b, req.body.timeout);
	res.send("Set color");
});

app.post('/fadecolor', function(req, res) {
	console.log("R=" + req.body.r + "\tG=" + req.body.g + "\tB=" + req.body.b + "\tFade");
	fade(req.body.r, req.body.g, req.body.b);
	res.send("Fade color");
});

app.post('/fadecolors', function(req, res) {
	console.log("Fade colors @ " + req.body.speed + " speed");
	clearCurrentInterval();
	fadeColors(req.body.speed);
	res.send("Fading colors");
});

app.post('/changebrightness', function(req, res) {
	console.log("Brightness " + req.body.brightness);
	brightness = req.body.brightness / 100;
	set(redVal, greenVal, blueVal);
	res.send("Changed brightness");
});

app.post('/fadeto', function(req, res) {
	console.log("Fade to color");
	fadeTo(req.body.r, req.body.g, req.body.b);
	res.send("Faded to color");
});

// Clear all timers and intervals
function clearCurrentInterval() {
        if (currentInterval) {
                clearInterval(currentInterval);
        }
}

// Set color based on rgb values with an optional timeout that resets colors after x milliseconds
function set(r, g, b, timeout) {
	var redOld = redVal, greenOld = greenVal, blueOld = blueVal;

	clearTimeout(delayTimeout);

	setRed(parseInt(r));
	setGreen(parseInt(g));
	setBlue(parseInt(b));

	if (timeout) {
		delayTimeout = setTimeout(function() {
			set(0, 0, 0);
		}, parseInt(timeout));
	}
}

// Fade in and out a color for notifications
function fade(r, g, b) {
	var fadeColor = Color.rgb(parseInt(r), parseInt(g), parseInt(b));
	var fadeVal = 1;
	var step = 5;
	var savedColor = Color.rgb(redVal, greenVal, blueVal);

	pauseCurrentInterval = true;

	var interval = setInterval(function() {
		if (fadeVal >= fadeColor.hsl().array()[2]) {
			step = -step;
		}
		
		if (fadeVal <= 0) {
			set(savedColor.red(), savedColor.green(), savedColor.blue());
			pauseCurrentInterval = false;
			clearInterval(interval);
		} else {
			fadeVal += step;
			var tempFadeColor = Color.hsl(fadeColor.hsl().array()[0], fadeColor.hsl().array()[1], fadeVal);
			set(tempFadeColor.rgb().array()[0], tempFadeColor.rgb().array()[1], tempFadeColor.rgb().array()[2]);
		}
	}, 10);
}

// Fade to a color from the current
function fadeTo(r, g, b) {
	clearCurrentInterval();
	
	var totalTime = 100;
	var currentTime = 0;
	var colorFrom = Color.rgb(redVal, greenVal, blueVal);
	var colorTo = Color.rgb(parseInt(r), parseInt(g), parseInt(b));
	
	currentInterval = setInterval(function() {
		if (currentTime > totalTime) clearCurrentInterval();
		
		var percent = currentTime / totalTime;

		if (percent > 1) percent = 1;

		var redDifference = colorTo.red() - colorFrom.red(),
		    greenDifference = colorTo.green() - colorFrom.green(),
		    blueDifference = colorTo.blue() - colorFrom.blue();

		var red = parseInt(redDifference * percent + colorFrom.red()),
		    green = parseInt(greenDifference * percent + colorFrom.green()),
		    blue = parseInt(blueDifference * percent + colorFrom.blue());

		console.log("Fading, current:  " + red + "," + green + "," + blue);
		
		set(red, green, blue);
				
		currentTime += 15;
	}, 15);
}

// Cycle through hues of colors
function fadeColors(speed) {
	var currentColor = Color.hsv(0, 255, 255);
	clearInterval(currentInterval);
	
	var step = 1
	if (speed == 1) {
		step = 5;
	}
	
	
	currentInterval = setInterval(function() {
		if (!pauseCurrentInterval) {
			if (currentColor.hue() >= 359) {
				currentColor = Color.hsv(0, 255, 255);
			} else {
				currentColor = Color.hsv(currentColor.hue() + step, 255, 255);
			}
			set(currentColor.red(), currentColor.green(), currentColor.blue());
		}
	}, speed);	
}

function setRed(output) {
	redVal = output;
	red.pwmWrite(parseInt(output * brightness));
}

function setGreen(output) {
	greenVal = output;
	green.pwmWrite(parseInt(output * brightness));
}

function setBlue(output) {
	blueVal = output;
	blue.pwmWrite(parseInt(output * brightness));
}

function random() {
	return Math.floor(Math.random() * 256);
}
