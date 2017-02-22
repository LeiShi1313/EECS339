/* jshint strict: false */
/* global $: false, google: false */
//
// Red, White, and Blue JavaScript
// for EECS 339 Project A at Northwestern University
//
// Originally by Peter Dinda
// Sanitized and improved by Ben Rothman
//
//
// Global state
//
// html    - the document itself ($. or $(document).)
// map     - the map object
// usermark- marks the user's position on the map
// markers - list of markers on the current map (not including the user position)
//
//

//
// When the document has finished loading, the browser
// will invoke the function supplied here.  This
// is an anonymous function that simply requests that the
// brower determine the current position, and when it's
// done, call the "Start" function  (which is at the end
// of this file)
//
//
$(document).ready(function() {
	var act = getUrlParameter('act');
	if (act == 'base' || act == 'near' || act == 'login') {
		navigator.geolocation.getCurrentPosition(Start);
		// listen for checkbox
		$('input:checkbox').live('change', function(){
			ViewShift();
		});
		$('#cycle').live('change', function() {
			ViewShift();
		});
	} else if (act == 'give-opinion-data') {
		$("input[name=.submit]").attr('disabled','disabled');
		GetCurrentLocationByParmOrAPI();
	}
});

// Global variables
var map, usermark, markers = [],

getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1)),
      sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
},

GetCurrentLocationByParmOrAPI = function() {
	var lat = getUrlParameter('lat'),
		 long = getUrlParameter('long');
	if (lat && long) {
		ChangeFormByLocation(lat, long);
	} else {
		navigator.geolocation.getCurrentPosition(function(location) {
			lat = location.coords.latitude,
			long = location.coords.longitude;
			ChangeFormByLocation(lat, long);
		});
	}
},
// ChangeFormByLocation change the input value by user's location
ChangeFormByLocation = function(lat, long) {
	$('input[name=lat]').val(lat);
	$('input[name=long]').val(long);
	$("input[name=.submit]").removeAttr('disabled');
	var mapUrl = "https://maps.googleapis.com/maps/api/geocode/json";
	mapUrl += "?latlng="+lat+','+long+'&sensor=true';
	$.ajax({
	  dataType: "json",
	  url: mapUrl,
	  success: function(data) {
	    console.log(data['results'][0]);
			var span_text = $("#address-info").text();
			$("#address-info").text("You are at "+data['results'][0]['formatted_address']);
			$('<label>', {id: "you-are-for", text: span_text}).insertAfter("#address-info");
			$('<br>').insertBefore("#you-are-for");
	  }
	});
},

// UpdateMapById draws markers of a given category (id)
// onto the map using the data for that id stashed within
// the document.
UpdateMapById = function(id, tag) {
// the document division that contains our data is #committees
// if id=committees, and so on..
// We previously placed the data into that division as a string where
// each line is a separate data item (e.g., a committee) and
// tabs within a line separate fields (e.g., committee name, committee id, etc)
//
// first, we slice the string into an array of strings, one per
// line / data item
//
//
// try to fix an error when there is no FEC data nearby
	if ($("#"+id).length == 0) {
		return;
	}
	var rows  = $("#"+id).html().split("\n");


// then, for each line / data item
	for (var i=0; i<rows.length; i++) {
// we slice it into tab-delimited chunks (the fields)
		var cols = rows[i].split("\t"),
// grab specific fields like lat and long
			lat = cols[0],
			long = cols[1];

// different market for different FEC data
		var icon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
		if (tag == "COMMITTEE") {
			icon = 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
		} else if (tag == "CANDIDATE") {
			icon = 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
		} else if (tag == "INDIVIDUAL") {
			icon = 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
		} else if (tag == "OPINION") {
			icon = 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
		}

// then add them to the map.   Here the "new google.maps.Marker"
// creates the marker and adds it to the map at the lat/long position
// and "markers.push" adds it to our list of markers so we can
// delete it later
		markers.push(new google.maps.Marker({
			map: map,
			position: new google.maps.LatLng(lat,long),
			title: tag+"\n"+cols.join("\n"),
			icon: icon
		}));

	}
},

//
// ClearMarkers just removes the existing data markers from
// the map and from the list of markers.
//
ClearMarkers = function() {
	// clear the markers
	while (markers.length>0) {
		markers.pop().setMap(null);
	}
},

//
// UpdateMap takes data sitting in the hidden data division of
// the document and it draws it appropriately on the map
//
UpdateMap = function() {
// We're consuming the data, so we'll reset the "color"
// division to white and to indicate that we are updating
	var color = $("#color");
	color.css("background-color", "white")
		.html("<b><blink>Updating Display...</blink></b>");

// Remove any existing data markers from the map
	ClearMarkers();

// Then we'll draw any new markers onto the map, by category
// Note that there additional categories here that are
// commented out...  Those might help with the project...
//
	UpdateMapById("committee_data","COMMITTEE");
	UpdateMapById("candidate_data","CANDIDATE");
	UpdateMapById("individual_data", "INDIVIDUAL");
	UpdateMapById("opinion_data","OPINION");


// When we're done with the map update, we mark the color division as
// Ready.
	color.html("Ready");

	var $committe_transaction_data_table = $("#committe_transaction_data");
	if ($committe_transaction_data_table) {
		$committe_transaction_data_table.remove();
	}
	var $individual_transaction_data_table = $("#individual_transaction_data");
	if ($individual_transaction_data_table) {
		$individual_transaction_data_table.remove();
	}
	var $opinion_analysis_data_table = $("#opinion_analysis_data");
	if ($opinion_analysis_data_table) {
		$opinion_analysis_data_table.remove();
	}
	if ($("#committe_transaction")) {
		$committe_transaction_data_table = $("#committe_transaction").clone().attr('id', 'committe_transaction_data');
		$("#data").before($committe_transaction_data_table);
		$("#committe_transaction_data").prepend('<thead><tr><td colspan=\"2\"><h3>Committe Transaction Data</h3></td></tr></thead>');
	}
	if ($("#individual_transaction")) {
		$individual_transaction_data_table = $("#individual_transaction").clone().attr('id', 'individual_transaction_data');
		$("#data").before($individual_transaction_data_table);
		$("#individual_transaction_data").prepend('<thead><tr><td colspan=\"2\"><h3>Individual Transaction Data</h3></td></tr></thead>');
	}
	if ($("#opinion_analysis")) {
		$opinion_analysis_data_table = $("#opinion_analysis").clone().attr('id', 'opinion_analysis_data');
		$("#data").before($opinion_analysis_data_table);
		$("#opinion_analysis_data").prepend('<thead><tr><td colspan=\"3\"><h3>Opinion Analysis</h3></td></tr></thead>')
	}
	// $("#committe_transaction").appendTo("#color");
// The hand-out code doesn't actually set the color according to the data
// (that's the student's job), so we'll just assign it a random color for now
	var firstRow = $("#committe_transaction tr:eq(1) td:eq(0)").text();
	if (firstRow == 'DEM') {
		color.css("background-color", "blue");
		$("#committe_transaction_data").css("background-color", "blue");
	} else if (firstRow == 'REP') {
		color.css("background-color", "red");
		$("#committe_transaction_data").css("background-color", "red");
	} else {
		color.css("background-color", "white");
		$("#committe_transaction_data").css("background-color", "white");
	}

	var firstRow = $("#individual_transaction tr:eq(1) td:eq(0)").text();
	if (firstRow == 'DEM') {
		$("#individual_transaction_data").css("background-color", "blue");
	} else if (firstRow == 'REP') {
		$("#individual_transaction_data").css("background-color", "red");
	} else {
		$("#individual_transaction_data").css("background-color", "white");
	}

	var avgColor = parseFloat($("#opinion_analysis tr:eq(1) td:eq(1)").text());
	if (avgColor > 0) {
		$("#opinion_analysis_data").css("background-color", 'blue');
	} else if (avgColor < 0) {
		$("#opinion_analysis_data").css("background-color", 'red');
	} else {
		$("#opinion_analysis_data").css("background-color", 'white');
	}
},

//
// NewData is called by the browser after any request
// for data we have initiated completes
//
NewData = function(data) {
// All it does is copy the data that came back from the server
// into the data division of the document.   This is a hidden
// division we use to cache it locally
	$("#data").html(data);
// Now that the new data is in the document, we use it to
// update the map
	UpdateMap();
},

ViewShiftWithTimeout = function() {
	var timer;
	return function() {
		clearTimeout(timer);
		timer = setTimeout(function() {
			ViewShift();
		}, 500);
	}
},

//
// The Google Map calls us back at ViewShift when some aspect
// of the map changes (for example its bounds, zoom, etc)
//
ViewShift = function() {
// We determine the new bounds of the map
	var bounds = map.getBounds(),
		ne = bounds.getNorthEast(),
		sw = bounds.getSouthWest();
	var committe = '';
	var candidate = '';
	var individual = '';
	var opinion = '';

// Now we need to update our data based on those bounds
// first step is to mark the color division as white and to say "Querying"
	$("#color").css("background-color","white")
		.html("<b><blink>Querying...("+ne.lat()+","+ne.lng()+") to ("+sw.lat()+","+sw.lng()+")</blink></b>");

// Now we make a web request.   Here we are invoking rwb.pl on the
// server, passing it the act, latne, etc, parameters for the current
// map info, requested data, etc.
// the browser will also automatically send back the cookie so we keep
// any authentication state
//
// This *initiates* the request back to the server.  When it is done,
// the browser will call us back at the function NewData (given above)
	if(document.getElementById('isCommitte').checked) {
		committe = 'committees';
	}
	if(document.getElementById('isCandidate').checked) {
		candidate = 'candidates';
	}
	if(document.getElementById('isIndividual').checked) {
		individual = 'individuals';
	}
	if ($("#isOpinion").length) {
		if(document.getElementById('isOpinion').checked) {
			opinion = 'opinions';
		}
	}

	$.get("rwb.pl",
		{
			act:	"near",
			latne:	ne.lat(),
			longne:	ne.lng(),
			latsw:	sw.lat(),
			longsw:	sw.lng(),
			cycle: $('#cycle').val(),
			format:	"raw",
			what:	$.grep([committe,candidate,individual,opinion], Boolean).join(",")
		}, NewData);
},


//
// If the browser determines the current location has changed, it
// will call us back via this function, giving us the new location
//
Reposition = function(pos) {
// We parse the new location into latitude and longitude
	var lat = pos.coords.latitude,
		long = pos.coords.longitude;

// ... and scroll the map to be centered at that position
// this should trigger the map to call us back at ViewShift()
	map.setCenter(new google.maps.LatLng(lat,long));
// ... and set our user's marker on the map to the new position
	usermark.setPosition(new google.maps.LatLng(lat,long));
},


//
// The start function is called back once the document has
// been loaded and the browser has determined the current location
//
Start = function(location) {
// Parse the current location into latitude and longitude
	var lat = location.coords.latitude,
	    long = location.coords.longitude,
	    acc = location.coords.accuracy,

// Get a pointer to the "map" division of the document
// We will put a google map into that division
	    mapc = $("#map");

	if (lat && long) {
		var a_href = $("#give-opinion-data").attr('href');
		if (a_href) {
			$("#give-opinion-data").attr('href', a_href+"&lat="+lat+"&long="+long);
		}
	}
// Create a new google map centered at the current location
// and place it into the map division of the document
	map = new google.maps.Map(mapc[0],
		{
			zoom: 16,
			center: new google.maps.LatLng(lat,long),
			mapTypeId: google.maps.MapTypeId.HYBRID
		});

// create a marker for the user's location and place it on the map
	usermark = new google.maps.Marker({ map:map,
		position: new google.maps.LatLng(lat,long),
		title: "You are here"});

// clear list of markers we added to map (none yet)
// these markers are committees, candidates, etc
	markers = [];

// set the color for "color" division of the document to white
// And change it to read "waiting for first position"
	$("#color").css("background-color", "white")
		.html("<b><blink>Waiting for first position</blink></b>");

//
// These lines register callbacks.   If the user scrolls the map,
// zooms the map, etc, then our function "ViewShift" (defined above
// will be called after the map is redrawn
//
	google.maps.event.addListener(map,"bounds_changed",ViewShiftWithTimeout());
	google.maps.event.addListener(map,"center_changed",ViewShiftWithTimeout());
	google.maps.event.addListener(map,"zoom_changed",ViewShiftWithTimeout());

//
// Finally, tell the browser that if the current location changes, it
// should call back to our "Reposition" function (defined above)
//
	navigator.geolocation.watchPosition(Reposition);
};
