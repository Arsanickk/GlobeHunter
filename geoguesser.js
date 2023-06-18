
'use strict';



    // const lats = [33.7825194];
    // const lons = [-117.22864779999999];


var map;
var resultmap;
var markers = [];
var guess_coordinates = [];
var true_location = [];
var accumulated_distance = 0;
var current_name = '';
var distance_from_guess = [];
var check_count = 0;
var lat_lon = [[]]


//parsing json file


async function initialize() {
  const filePath = './cool_files/uscities1k.json';

  try {
    const response = await fetch(filePath);
    const jsonData = await response.json();
    const lat_lon = jsonData.map(city => [city.lat, city.lon]);
    // Call a function or execute code that relies on latLonArray here

    check_count = 0;
    disableButton('check');
    disableButton('next');
    if(accumulated_distance == 0){
      document.getElementById("totaldistance").innerHTML = 'Round Score: 0 Miles'; 
    }
    document.getElementById("location").innerHTML = ' ';
    document.getElementById("distance").innerHTML = ' '; 


    var randlat_lon = randomLoc(lat_lon);
    console.log(randlat_lon);
    console.log(lat_lon.length);

    var number = await Promise.all([getData(`http://api.openweathermap.org/geo/1.0/reverse?lat=${randlat_lon[0]}&lon=${randlat_lon[1]}&limit=1&appid=APIKEY`)]);
    console.log(number);
    true_location = [];
    true_location.push(randlat_lon[0],randlat_lon[1]);
    current_name = (number[0][0].name + ", " + number[0][0].state);
    console.log(current_name);  
        
    
    // var mapCenter = {lat: 37.98617112182952, lng: 23.728172621208437}; // Center of world
    var mapCenter = {lat: 37.01617112182952, lng: -95.728172621208437}; // center of US

    var map = new google.maps.Map(document.getElementById('map'), {
      center: mapCenter,
      zoom: 3,
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
            enableButton('check');
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
            position: {lat: randlat_lon[0], lng: randlat_lon[1]},
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

  // Rest of your code here...
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

function check(){

    enableButton('next');
    distance_from_guess = [];
    var guess_error = (distance(guess_coordinates[0],guess_coordinates[1],true_location[0], true_location[1],'K'));
    accumulated_distance += parseFloat(guess_error);
    distance_from_guess = guess_error;

    
    console.log("Guessed Location: " + guess_coordinates);
    console.log("Actual Location: " + true_location);
    console.log("current guess error: " + guess_error);
    console.log("total guess error: " + accumulated_distance);
   
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
  disableButton('check');
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
function randomLoc(lat_lon){
    //Generating random lat and long

    const rand_num = Math.floor(Math.random() * 1000); 
    
    index += 1
    if (index > 5){
        index = 0
        document.getElementById("totaldistance").innerHTML = 'Round Score: 0 Miles'; 
        swal({
            title: "Thanks For playing!",
            icon: "success",
            text: "Your Guessing was only off by " + accumulated_distance.toFixed(1) + " Miles This Round!"
        });
        accumulated_distance = 0;
        document.getElementById('round').innerHTML = "Round:  1/" + 5
        document.getElementById("next").innerHTML= "Next Location";
        return lat_lon[rand_num]

    }else if(index == 5){
        document.getElementById("next").innerHTML= "Finish Round";
        document.getElementById('round').innerHTML = "Round: " + (index) + "/" + 5
        return lat_lon[rand_num]
    }else{
        document.getElementById("next").innerHTML= "Next Location";
        document.getElementById('round').innerHTML = "Round: " + (index) + "/" + 5
        return lat_lon[rand_num]
    }
   
}

function display_location(){
    document.getElementById("location").innerHTML = "Correct Location: " + current_name;
    document.getElementById("distance").innerHTML = "Your Guess was " + distance_from_guess + " Miles away";
   document.getElementById("totaldistance").innerHTML = "Round Score: " + accumulated_distance.toFixed(1) + " Miles";
}

function disableButton(id){
  document.getElementById(id).disabled = true;
}

function enableButton(id){
  document.getElementById(id).disabled = false;
}


