
'use strict';


//Parsing csv file
// const fileInput = document.getElementById('us-cities-top-1k.csv');

// fileInput.addEventListener('change', handleFileSelect, false);

// function handleFileSelect(event) {
//   const file = event.target.files[0];
//   const reader = new FileReader();

//   reader.onload = function (event) {
//     const csvData = event.target.result;
//     const lines = csvData.trim().split('\n');
//     const lats = [];
//     const lons = [];

//     for (let i = 1; i < lines.length; i++) {
//       const values = lines[i].split(',');

//       const lat = parseFloat(values[3]);
//       const lon = parseFloat(values[4]);

//       lats.push(lat);
//       lons.push(lon);
//     }
//   };

//   reader.readAsText(file);  
// }

    const lats = [33.7825194];
    const lons = [-117.22864779999999];


var map;
var resultmap;
var markers = [];
var guess_coordinates = [];
var true_location = [];
var accumulated_distance = 0;
var current_name = '';
var distance_from_guess = [];
var check_count = 0;


async function getData(url) {
  return fetch(url)
      .then(response => response.json())
      .catch(error => console.log(error));
}

async function initialize() {
  check_count = 0;
  disableButton('check');
  disableButton('next');
  if(accumulated_distance == 0){
    document.getElementById("totaldistance").innerHTML = 'Round Score: 0 Miles'; 
  }
  document.getElementById("location").innerHTML = ' ';
  document.getElementById("distance").innerHTML = ' '; 


  var randomLat = randomLoc()[0]
  var randomLon = randomLoc()[1]
  var number = await Promise.all([getData(`http://api.openweathermap.org/geo/1.0/reverse?lat=${randomLat}&lon=${randomLon}&limit=1&appid=afd29982d6c42c0574df26c5e99d12d0`)]);
  console.log(number);
  true_location = [];
  true_location.push(randomLat,randomLon);
  current_name = (number[0][0].name + ", " + number[0][0].state);
  console.log(current_name);  
      
  
  var mapCenter = {lat: 37.98617112182952, lng: 23.728172621208437};

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
          position: {lat: randomLat, lng: randomLon},
          pov: {
            heading: 34,
            pitch: 10
          },
          addressControl: false
        });
    map.setStreetView(panorama);
  
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
function randomLoc(){
    //Generating random lat and long
    const ran_lat = Math.floor(Math.random() * lats.length);
    const ran_lon = Math.floor(Math.random() * lons.length);
    index += 1
    if (index > 5){
        index = 0
        //console.log(index)
        document.getElementById("totaldistance").innerHTML = 'Round Score: 0 Miles'; 
        swal({
            title: "Thanks For playing!",
            icon: "success",
            text: "Your Guessing was only off by " + accumulated_distance.toFixed(1) + " Miles This Round!"
        });
        accumulated_distance = 0;
        document.getElementById('round').innerHTML = "Round:  1/" + 5
        document.getElementById("next").innerHTML= "Next Location";
        return[lats[ran_lat], lons[ran_lon]]

    }else if(index == 5){
        document.getElementById("next").innerHTML= "Finish Round";
        document.getElementById('round').innerHTML = "Round: " + (index + 1) + "/" + 5
        return[lats[ran_lat], lons[ran_lon]]
    }else{
        document.getElementById("next").innerHTML= "Next Location";
        document.getElementById('round').innerHTML = "Round: " + (index + 1) + "/" + 5
        return[lats[ran_lat], lons[ran_lon]]
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


