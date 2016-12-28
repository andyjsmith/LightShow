$(document).ready(function() {
	var count = 0;
	var moveCount = 0;
	var clicking = false;

	$('.color-picker').spectrum({
		color: "#fff", 
		showButtons: false,
		change: function(color) {
			changeColor(color.toRgb().r, color.toRgb().g, color.toRgb().b);
		},
		move: function(color) {
			if (count == 4) {
				changeColor(color.toRgb().r, color.toRgb().g, color.toRgb().b);
				count = 0;
			} else {
				count++;
			}
		}
	})

	$('.color-picker').on("dragstop.spectrum", function(e, color) {
		changeColor(color.toRgb().r, color.toRgb().g, color.toRgb().b);
	});

	$("#brightness-slider").on("change", function() {
		$.post("/changebrightness", {brightness: $(this).val()});
	}).on("mousedown", function() {
		clicking = true;
	}).on("mouseup", function() {
		clicking = false;
	}).on("mousemove", function(e) {
		if (clicking == true) {
			if (moveCount == 5) {
				$.post("/changebrightness", {brightness: $(this).val()});
				moveCount = 0;
			} else {
				moveCount++;
			}
		}
	});
});

function changeColor(r, g, b) {
	$.post("/setcolor", {r: r, g: g, b: b});
}

function fadeToColor(r, g, b) {
	$.post("/fadeto", {r: r, g: g, b: b});
}

function fadeColors(speed) {
	$.post("/fadecolors", {speed: speed});
}
