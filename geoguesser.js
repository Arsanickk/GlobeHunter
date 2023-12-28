'use strict';



    // const lats = [33.7825194];
    // const lons = [-117.22864779999999];


var map;
var resultmap;
var markers = [];
var guess_coordinates = [];
var true_location = [];
var score = 0;
var curscore = 0
var current_name = '';
var distance_from_guess = [];
var check_count = 0;
var lat_lng = [[]]


//parsing json file


async function initialize() {

  try {


    check_count = 0;
    disableButton('guess');
    disableButton('next');
    if(score == 0){
      document.getElementById("totaldistance").innerHTML = 'Score: 0'; 
    }
    document.getElementById("location").innerHTML = ' ';
    document.getElementById("distance").innerHTML = ' '; 


    // var randlat_lng = randomLoc(lat_lng);
    // console.log(randlat_lng);
    // console.log(lat_lng.length);
    //console.log(nearestSV(randlat_lng[0], randlat_lng[1]));
    executeRound();
    const coords = await getLand();
    var SVcoords = await nearestSV(coords[0], coords[1]);
    console.log(SVcoords);
    var number = await Promise.all([getData(`https://corsproxy.io/?http://api.openweathermap.org/geo/1.0/reverse?lat=${SVcoords[0]}&lon=${SVcoords[1]}&limit=1&appid=afd29982d6c42c0574df26c5e99d12d0`)]);
    true_location = [SVcoords[0], SVcoords[1]];
    console.log(true_location);
    current_name = (number[0][0].name + ", " + number[0][0].state);

 
        
    
   var mapCenter = {lat: 37.98617112182952, lng: 23.728172621208437}; // Center of world
   //var mapCenter = {lat: 37.01617112182952, lng: -95.728172621208437}; // center of US

    var map = new google.maps.Map(document.getElementById('map'), {
      center: mapCenter,
      zoom: 1,
      streetViewControl: false,
    });

    var rmap = new google.maps.Map(document.getElementById('result'), {
        center: mapCenter,
        zoom: 2,
        streetViewControl: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER
        },
    });

      
      google.maps.event.addListener(map, 'click', function(event) {
          placeMarker(event.latLng);
          if (check_count == 0){
            enableButton('guess');
            check_count += 1;
          }
      });
      
      function placeMarker(location) {
          deleteMarkers();
          guess_coordinates = [];
          var marker = new google.maps.Marker({
              position: location, 
              map: map,
          });
          markers.push(marker);
          guess_coordinates.push(marker.getPosition().lat(),marker.getPosition().lng());
          }

      
      var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano'), {
            position: {lat: SVcoords[0], lng: SVcoords[1]},
            pov: {
              heading: 34,
              pitch: 10
            },
            addressControl: false
          });
      map.setStreetView(panorama);

    } catch (error) {
      console.error('Error:', error);
    }

}


 




async function getData(url) {
  return fetch(url)
      .then(response => response.json())
      .catch(error => console.log(error));
}


  function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }

  function clearMarkers() {
    setMapOnAll(null);
  }

  function showMarkers() {
    setMapOnAll(map);
  }

  function deleteMarkers() {
    clearMarkers();
    markers = [];
  }

async function getLand() {
    try {
        const url = 'https://corsproxy.io/?' + encodeURIComponent('https://api.3geonames.org/randomland.json')
  
        const response = await fetch(url);

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response to JSON
        const data = await response.json();

        // Extract the latitude and longitude
        const landcoord = [data.nearest.latt, data.nearest.longt];
        
        console.log('Nearest Land Coordinates: ', landcoord);

        return landcoord;
    } catch (error) {
        console.log('Error:', error);
    }
}

function nearestSV(lat, lng) {
  return new Promise((resolve, reject) => {
    // Initialize the Google Street View Service
    var streetViewService = new google.maps.StreetViewService();
    var STREETVIEW_MAX_DISTANCE = 5000000; // Max distance in Meters

    // Create a new LatLng using the provided lat and lng
    var myLocation = new google.maps.LatLng(lat, lng);

    // Get the nearest street view image within the defined search radius
    streetViewService.getPanoramaByLocation(myLocation, STREETVIEW_MAX_DISTANCE, function(streetViewPanoramaData, status) {
        if (status === google.maps.StreetViewStatus.OK) {
            // If a street view image was found, return the location
            var location = streetViewPanoramaData.location.latLng;
            console.log('Street View Land Location: ', location.toString());
            resolve([location.lat(), location.lng()]);
        } else {
            // No street view image was found within the given radius
            console.log('No Street View image found within ' + STREETVIEW_MAX_DISTANCE/1000 + ' km of this location');
            reject('No Street View image found');
        }
    });
  });
}




function check(){

    enableButton('next');
    distance_from_guess = [];
    var guess_error = (distance(guess_coordinates[0],guess_coordinates[1],true_location[0], true_location[1],'K'));
    curscore = calculateScore(parseFloat(guess_error));
    score += curscore;
    distance_from_guess = guess_error;

    
    console.log("Guessed Location: " + guess_coordinates);
    console.log("Actual Location: " + true_location);
    console.log("current guess error: " + guess_error);
    console.log("total guess error: " + score);
   
    //console.log(true_location);
    var true_coords = {lat: true_location[0], lng: true_location[1]};
    var guess_coords = {lat: guess_coordinates[0], lng: guess_coordinates[1]};
    var result_map = new google.maps.Map(document.getElementById('result'), {
    zoom: 2,
    center: true_coords
  });

  var true_marker = new google.maps.Marker({
    position: true_coords, 
    map: result_map,
    title: 'True Location',
    icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
      }
  });
    var infoWindow = new google.maps.InfoWindow({
        content: current_name
    })

    true_marker.addListener('click', function(){
        infoWindow.open(result_map, true_marker);
    });

  var guess_marker = new google.maps.Marker({
    position: guess_coords,
    map: result_map,
    title: 'Guessing Location',
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
    }
  });

  var flightPlanCoordinates = [
    true_coords, guess_coords,
    
  ];
  var lineSymbol = {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    scale: 2
  };

  var flightPath = new google.maps.Polyline({
    path: flightPlanCoordinates,
    strokeOpacity: 0,
    icons: [{
        icon: lineSymbol,
        offset: '1',
        repeat: '15px'
      }],
  });

  flightPath.setMap(result_map);
  display_location();
  disableButton('guess');
  disableButton('mapButton');
}

function distance(lat1, lon1, lat2, lon2, unit) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}


var index = 0;
function executeRound(lat_lng){



    enableButton('mapButton');
    index += 1
    if (index > 5){
        index = 0
        document.getElementById("totaldistance").innerHTML = 'Round Score: 0'; 
        swal({
            title: "Congratulations!",
            icon: "success",
            text: "You Scored a Total of " + score.toFixed(1) + " Points!"
        });
        score = 0;
        document.getElementById('round').innerHTML = "Round:  1/" + 5
        document.getElementById("next").innerHTML= "Next Location";


    }else if(index == 5){
        document.getElementById("next").innerHTML= "Finish Game";
        document.getElementById('round').innerHTML = "Round: " + (index) + "/" + 5

    }else{
        document.getElementById("next").innerHTML= "Next Location";
        document.getElementById('round').innerHTML = "Round: " + (index) + "/" + 5

    }
   
}

function display_location(){
    document.getElementById("location").innerHTML = "Correct Location: " + current_name;
    document.getElementById("distance").innerHTML = "Your Guess was " + distance_from_guess.toFixed(1) + " Miles away";
    document.getElementById("totaldistance").innerHTML = "Score: " + score.toFixed(0);
    document.getElementById("score").innerHTML = "You scored: " + curscore.toFixed(0) + " Points";
}

function disableButton(id){
  document.getElementById(id).disabled = true;
}

function enableButton(id){
  document.getElementById(id).disabled = false;
}

function calculateScore(x) {
  return 5000 * Math.exp(-x / 2000);
}


