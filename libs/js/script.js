//global variables-------------------------------------------------------------------
var border;
var currentLat;
var currentLng;
var lat;
var lng;
var popup;
var currentCountry;
var country;
var airports=[];
var cities=[];


//get map layers--------------------------------------------------------------------------

var map = L.map('map').setView([51.505, -0.09], 4);

//street layer
Streets = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
	maxZoom: 16
});


//hybrid layer
Hybrid = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 18,
	ext: 'png'
});
Hybrid.addTo(map);

//sattelite layer
Sat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

//Terrain
Terrain = L.tileLayer('http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{
    maxZoom: 20,
    subdomains:['mt0','mt1','mt2','mt3']
});

//ImagreryS
Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
});

//Earth at night by NASA
NASAGIBS_ViirsEarthAtNight2012 = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 8,
	format: 'jpg',
	time: '',
	tilematrixset: 'GoogleMapsCompatible_Level'
});


//add controls 
var baseLayers = {
  //"OpenStreetMap": osm,
  "street": Streets,
  "hybrid": Hybrid,
  "Sattelite":Sat,
  "Terrain":Terrain,
  "World Imagery":Esri_WorldImagery,
  "Earth at Night (NASA)":NASAGIBS_ViirsEarthAtNight2012,
};


L.control.layers(baseLayers).addTo(map);


//get country list-------------------------------------------------------------------------------------------------------


$.ajax({

    url:"libs/php/countryBorders.php",
  
    dataType:"json",
  
    success: function(result){
  
      console.log(result);
      
  
      for (const iterator of result.data) {
        
        $("#country-dropdown").append(`<option value="${iterator.iso_a2}">${iterator.name}</option>`)
        //alphabatical order
        function alphabetizeList() {
          var sel = $('#country-dropdown');
          var selected = sel.val();
          var opts_list = sel.find('option');
          opts_list.sort(function (a, b) {
              return $(a).text() > $(b).text() ? 1 : -1;
          });
          sel.html('').append(opts_list);
          sel.val(selected); 
      }
      
      alphabetizeList('#country-dropdown');
  
      }
      
  
    },
  
    error: function(jqXHR){
  
      console.log(jqXHR);
  
    }
  
    })

//preloader---------------------------------------------------------------------------------------------------
var loader = document.querySelector(".preloader");

 window.addEventListener("load", vanish);

function vanish() {
  loader.classList.add("disppear");
};

//get current location-----------------------------------------------------------------------------------------------
const successCallback = (position) => {
    $.ajax({
        url: "libs/php/getCurrentloc.php",
        type: 'GET',
        dataType: 'json',
        data: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
        },
  
        success: function(result) {
            console.log(result);
            currentLat = result.data[0].geometry.lat;
            currentLng = result.data[0].geometry.lng;
              
         
            $("selOpt select").val(result.data[0].components["ISO_3166-1_alpha-2"]);
            
            let currentCountry = result.data[0].components["ISO_3166-1_alpha-2"];
            $("#country-dropdown").val(currentCountry).change();
          
        
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
        }
    }); 
    
  }
 const errorCallback = (error) => {
            console.error(error);
  }
  navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  
  
  
  //on changing select value...............................................................................
  $('#country-dropdown').on('change', function() {
    let countryiso = $('#country-dropdown').val();
    let countryname= $('#country-dropdown').find('option:selected').text();
   
    $.ajax({
      url: "libs/php/getGeoJson.php",
      type: 'POST',
      dataType: 'json',
      success: function(result) {
  
          console.log(result);
  
          if (map.hasLayer(border)) {
              map.removeLayer(border);
          }
            
          let isoArray = [];
          let OptionsArray = [];
      
          for (let i = 0; i < result.data.border.features.length; i++) {
              if (result.data.border.features[i].properties.iso_a2 === countryiso) {
                  isoArray.push(result.data.border.features[i]);
              }
          };
          for (let i = 0; i < result.data.border.features.length; i++) {
              if (result.data.border.features[i].properties.name === countryname) {
                  OptionsArray.push(result.data.border.features[i]);
              }
          };
       
          border = L.geoJSON(OptionsArray[0], {
                                                          color: 'red',
                                                          opacity: 0.75,
                                                          }).addTo(map);
          let bounds = border.getBounds();
              map.flyToBounds(bounds, {
              padding: [35, 35], 
              duration: 2,
              }); 
           },
      
      error: function(jqXHR, textStatus, errorThrown) {
        // your error code
        console.log(textStatus, errorThrown);
      }
    }); 
    //get api data.......................................................................
    function numberWithCommas(x) {
      if (!x) {
        return null;
      }
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    $.ajax({
      url: "libs/php/gwtCountryInfo.php",
      type: 'POST',
      dataType: 'json',
      data: {
        country: $('#country-dropdown').val(),
        lang:'en',
        },
      success: function(result) {
      
       
        console.log(JSON.stringify(result));
         
        
  
        if (result.status.name == "ok") {
          q=result['data'][0]['capital'];
          area=(result['data'][0]['areaInSqKm'])
          population=(result['data'][0]['population'])
          $('#txtContinent').html(result['data'][0]['continent']);
         $('#txtCapital').html(result['data'][0]['capital']);
        $('#txtLanguages').html(result['data'][0]['languages']);
        $('#txtPopulation').html(numberWithCommas(population));
      $('#txtArea').html(numberWithCommas(area)+'km<sup>2</sup>');
        $('#txtCurrency').html(result['data'][0]['currencyCode']);
       
        $.ajax({
          url: "libs/php/wikipedia.php",
          type: 'POST',
          dataType: 'json',
          data: {
          q: q,
          
          
          
          },
          success: function(result) {
          
          console.log(JSON.stringify(result));
          
          if (result.status.name == "ok") {
            lat= result['data'][0]['lat'];
            lng=result['data'][0]['lng'];
          
            $('#txtlatitude2').html(result['data'][0]['lat']);
            $('#txtlongitude2').html(result['data'][0]['lng']);
            $('#txtwikipediaurl').html(result['data'][0]['wikipediaUrl']);
            $('#txtelevation').html(result['data'][0]['elevation']);
            $('#txtlang').html(result['data'][0]['lang']);
            $('#txttitle').html(result['data'][0]['title']);
            $('#txtfeature').html(result['data'][0]['feature']);
            $('#txtrank').html(result['data'][0]['rank']);
            $('#txtsummary').html(result['data'][0]['summary']);
            $('#txtcountrycode').html(result['data'][0]['countryCode']);
           /* $.ajax({
              url: "libs/php/weather.php",
              type: 'POST',
              dataType: 'json',
              data:{
                lat: lat,
               lng:lng,
                
              },
              success: function(result) {
              
            
                console.log(JSON.stringify(result));
            
                if (result.status.name == "ok") {
                  
            
                 $('#txtclouds').html(result['data']['clouds']);
                $('#txttemperature').html(result['data']['temperature']);
                  $('#txthumidity').html(result['data']['humidity']);
                  $('#txtwindspeed').html(result['data']['windSpeed']);
                  $('#txtdewpoint').html(result['data']['dewPoint']);
                  $('#txtstationname').html(result['data']['stationName']);
                  $('#txtwinddirection').html(result['data']['windDirection']);
                  $('#txtdatetime').html(result['data']['datetime']);
                  $('#txtweathercondition').html(result['data']['weatherCondition']);
                  $('#txtcountrycode').html(result['data']['countryCode']);
                  $('#txticao').html(result['data']['ICAO']);
                  $('#txtcloudscode').html(result['data']['cloudsCode']);
                  
            
                }
              
              },
              error: function(jqXHR, textStatus, errorThrown) {
                console.log("Data not available")
              }
            }); */
           }
          
       },
          error: function(jqXHR, textStatus, errorThrown) {
          console.log("data not available ")
       }
      }); 
  }
},
error: function(jqXHR, textStatus, errorThrown) {
  console.log("data not available ")
}
});
    
    

//news data
$(document).ready(function() {
  $('#article1Link').click(function() {
   
  });
});
$.ajax({
  url: "libs/php/news.php",
  type: 'GET',
  dataType: 'json',
  data: {
      newsCountry:$('#country-dropdown').val(), 
  },
  success: function(result) {
      console.log('News Data', result);
      if (result.status == "No matches for your search.") {
          $('#article1Link').hide();
          $('#article1Img').hide();
         
      }
      else if (result.status == "ok") {
          $('#article1Link').html("");
          for (var i=0; i<result.articles.length; i++) {
            $("#article1Link").append('<li style="margin-bottom: 1rem;display:flex;list-style:none;"> <a href='+ result.articles[i].link + ' target ="_blank"  style="font-size:12px;" ><img src='+result.articles[i].media +'  style="width:60px;height:60px;margin:4px;"> '+ result.articles[i].title + '</a></li>');
            $("#txtcountry").html(result.articles[i].country);
            
              
      }                
  }},
  error: function(jqXHR, textStatus, errorThrown) {
      console.log(textStatus, errorThrown);
  }
}); 


//map markers-------------------------------------------------------------------------------------------------------------
//Capital city............
$.ajax({
  url: "libs/php/markerCapital.php",
  type: 'GET',
  dataType: 'json',
  data: {
      country:$('#country-dropdown').val(), 
  },
  success: function(result) {
    
      if (result.status.name == "ok") {                
        capital = [result['data']['geonames']['0']['name'],
        result['data']['geonames']['0']['population'],
        lat=result['data']['geonames']['0']['lat'],
        lng=result['data']['geonames']['0']['lng']];
        $.ajax({
          url: "libs/php/weather.php",
          type: 'POST',
          dataType: 'json',
          data:{
            lat: lat,
           lng:lng,
            
          },
          success: function(result) {
          
        
            console.log(JSON.stringify(result));
        
            if (result.status.name == "ok") {
              datetime=result['data']['datetime'];
        
             $('#txtclouds').html(result['data']['clouds']);
            $('#txttemperature').html(result['data']['temperature']);
              $('#txthumidity').html(result['data']['humidity']);
              $('#txtwindspeed').html(result['data']['windSpeed']);
              $('#txtdewpoint').html(result['data']['dewPoint']);
              $('#txtstationname').html(result['data']['stationName']);
              $('#txtwinddirection').html(result['data']['windDirection']);
              $('#txtdatetime').html(Date.parse(datetime));
              $('#txtweathercondition').html(result['data']['weatherCondition']);
              $('#txtcountrycode').html(result['data']['countryCode']);
              $('#txticao').html(result['data']['ICAO']);
              $('#txtcloudscode').html(result['data']['cloudsCode']);
              $.ajax({
                url: "libs/php/timezone.php",
                type: 'POST',
                dataType: 'json',
                data:{
                  lat: lat,
                 lng:lng,
                  
                },
                success: function(result) {
                
              
                  console.log(result);
              
                  if (result.status.name == "ok") {
                    sunrise=result.data.sunrise;
                    sunset=result.data.sunset;
                    time=result.data.time ;
                  
                  $('#txtid').html(result.data.timezoneId);
                    $('#txttime').html(Date.parse(time)   );
                    $('#txtrise').html(Date.parse(sunrise));
                    $('#txtset').html(Date.parse(sunset));
                   
                  }
          
                },
                error: function(jqXHR, textStatus, errorThrown) {
                  console.log("Data not available")
                }
              });
              
        
            }
          
          },
          error: function(jqXHR, textStatus, errorThrown) {
            console.log("Data not available")
          }
        }); 
      }
  },
  error: function(jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
  }
}); 
//Cities nearby Markers....................
$.ajax({
  url: "libs/php/cityMarkers.php",
  type: 'GET',
  dataType: 'json',

  data: {
      country:$('#country-dropdown').val() ,
  },
  success: function(result) {
    
      if (result.status.name == "ok") {  
      
              
          for(let i=0; i < result['data']['geonames'].length; i++){
          
           cities.push([result['data']['geonames'][i]['name'],
           result['data']['geonames'][i]['population'],
           result['data']['geonames'][i]['lat'],
           result['data']['geonames'][i]['lng']]);
          }
      }
  },

  error: function(jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
  }
}); 
//airports
$.ajax({
  url: "libs/php/airports.php",
  type: 'GET',
  dataType: 'json',
  data: {
      country: $('#country-dropdown').val(),
  },
  success: function(result) {
    
      if (result.status.name == "ok") {                
        
          for(let i=0; i < result['data']['geonames'].length; i++){
          
              airports.push([result['data']['geonames'][i]['name'],
              result['data']['geonames'][i]['lat'],
              result['data']['geonames'][i]['lng']]);
          }
      }
  },

  error: function(jqXHR, textStatus, errorThrown) {
      console.log(JSON.stringify(jqXHR));
      console.log(JSON.stringify(textStatus));
      console.log(JSON.stringify(errorThrown));
  }
}); 
});
 // on click event on map 
  map.on('click', function(e) {        
    var popuploc = e.latlng;
    $.ajax({
      url: "libs/php/getCurrentloc.php",
      type: 'GET',
      dataType: 'json',
      data: {
          lat: popuploc.lat,
          lng: popuploc.lng,
      },
  
      success: function(result) {
  
          if (result.data[0].components["ISO_3166-1_alpha-2"]) {
              console.log(result);
              currentLat = result.data[0].geometry.lat;
              currentLng = result.data[0].geometry.lng;
  
            $("selopt select").val(result.data[0].components["ISO_3166-1_alpha-2"]);
              
              let currentCountry = result.data[0].components["ISO_3166-1_alpha-2"];
              $("#country-dropdown").val(currentCountry).change();
          }
          else {
             
              console.log(result);
  
              currentLat = result.data[0].geometry.lat;
              currentLng = result.data[0].geometry.lng;
  
              
  
              L.popup()
                  .setLatLng([currentLat, currentLng])
                  .setContent("<div><strong>" + result.data[0].formatted + "</strong></div>")
                  .openOn(map);
          }
          
       
      },
      
      error: function(jqXHR, textStatus, errorThrown) {
          console.log(textStatus, errorThrown);
          console.log(jqXHR, errorThrown)
         
      }
    }); 
  });
    
    
 
 
 
  
//easybuttons
L.easyButton('<i class="fas fa-info-circle fa-lg"style="color:blue"></i>',function(){
  
    $('#mymodal2').modal("show");
 },'Country Information').addTo(map );
L.easyButton('<i class="fa-solid fa-sun" style="color:orange"></i>',function(){
  $('#weatherModal').modal("show");
},'Weather').addTo(map);
L.easyButton('<i class="fa-solid fa-clock" style="color:brown"></i>',function(){
  $('#mymodal8').modal("show");
  
  
},'timezone').addTo(map);

L.easyButton('<i class=" fa-solid fa-newspaper" style="color:green"></i>',function(){
  $('#mymodal3').modal("show");
  
},'News').addTo(map);


L.easyButton('<i class="fab fa-wikipedia-w" style="color:red"></i>',function(){
    
  $('#mymodal4').modal("show");
},'Wikipedia Information').addTo(map );

var markerClusters = L.markerClusterGroup();

var MapIcon = L.Icon.extend({
  options: {
      iconSize:     [30, 30],
      popupAnchor:  [0, -20]
  }
});


//Capital City  Easy Button----------------------------------------------------



function capDisable(){
  capBtn.disable();
}

var capBtn = L.easyButton({
  position: 'topright',
  id: 'capital',
  states: [{
      icon: '<i class="fa-solid fa-earth-europe" style="color:darkblue"></i>',
      stateName: 'unchecked',
      title: 'Show Capital City',
      onClick: function(btn,map) {            

         
          var capitalIcon = new MapIcon({iconUrl: 'img/capital1.png'});

          var mark = L.marker(new L.LatLng(capital[2], capital[3]), {icon: capitalIcon}).bindPopup(`
          <b>Capital City: </b> ${capital[0]} <br>
          <b>Population: </b> ${(capital[1] / 1000000).toFixed(1)} M
          `);
          markerClusters.addLayer( mark );
      
          map.addLayer(markerClusters);

          capDisable();

      }
  }, ]
}).addTo(map);
//cities easy button------------------------------------------------
function cityDisable(){
  cityBtn.disable();
}

var cityBtn = L.easyButton({
  position: 'topright',
  id: 'cities',
  states: [{
      icon: '<i class="fa-solid fa-city" style="color:purple"></i>',
      stateName: 'unchecked',
      title: 'Show  Cities',
      onClick: function(btn,map) {
       
  

          var cityIcon = new MapIcon({iconUrl: 'img/cities2.png'});

              for(i=0;i<cities.length;i++){
                  
                  var mark = L.marker(new L.LatLng(cities[i][2], cities[i][3]), {icon: cityIcon}).bindPopup(`
                      <b>City:</b> ${cities[i][0]} <br> 
                      <b>Population: </b> ${cities[i][1].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} 
                  `);
                  markerClusters.addLayer( mark );
                  
              }

          map.addLayer(markerClusters);

          cityDisable();
      }
  }, ]
}).addTo(map);

//airport markers-----------------------------------------------------------------
function airportsDisable(){
  airportsBtn.disable();
}

var airportsBtn = L.easyButton({
  position: 'topright',
  id: 'airports',
  states: [{
      icon: '<i class="fa-solid fa-plane-departure" style="color:red"></i>',
      stateName: 'unchecked',
      title: 'Show Airports',
      onClick: function(btn,map) {

          var airportIcon = new MapIcon({iconUrl: 'img/airplane.png'});

          for(i=0;i<airports.length;i++){
              
              var m = L.marker(new L.LatLng(airports[i][1], airports[i][2]), {icon: airportIcon}).bindPopup(`${airports[i][0]}`);
              markerClusters.addLayer( m );
              
          }
      
          map.addLayer(markerClusters);
          
          airportsDisable();

      }
  }, ]
}).addTo(map);



//getting weather card on map click-----------------------------------------------------------------------
popup = L.popup();

//popup function
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString()) // immediately replaced by weatherpopup...
        .openOn(map);


//getting json function

$(document).ready(function(){
  $.ajax({
    url: "https://api.openweathermap.org/data/2.5/weather?lat=" + e.latlng.lat + '&lon=' + e.latlng.lng + "&appid=605009afa2f3c9d399252cf80559babe",
    dataType: 'json',
    ContentType: 'application/json; charset=UTF-8',

    success: function(data) {
      // storing json data in variables
      weather_country=data.sys.country;
      weatherlocation_lon = data.coord.lon; // lon WGS84
      weatherlocation_lat = data.coord.lat; // lat WGS84
      weathertime = data.dt // Time of weatherdata (UTC)
      temperature = data.main.temp; // Kelvin
      airpressure = data.main.pressure; // hPa
      airhumidity = data.main.humidity; // 
      cityname=data.name;
     
      windspeed = data.wind.speed; // Meter per second
     
      cloudcoverage = data.clouds.all; // Cloudcoverage in %
      weatherconditionid = data.weather[0].id // ID
      weatherconditionstring = data.weather[0].main // Weatheartype
      weatherconditiondescription = data.weather[0].description // Weatherdescription
      weatherconditionicon = data.weather[0].icon // ID of weathericon

    // Converting Unix UTC Time
    var utctimecalc = new Date(weathertime * 1000);
    var months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    var year = utctimecalc.getFullYear();
    var month = months[utctimecalc.getMonth()];
    var date = utctimecalc.getDate();
    var hour = utctimecalc.getHours();
    var min = utctimecalc.getMinutes();
    var sec = utctimecalc.getSeconds();
    var time = date + '.' + month + '.' + year + ' ' + hour + ':' + min + ' Uhr';

    // recalculating
    var weathercondtioniconhtml = "http://openweathermap.org/img/w/" + weatherconditionicon + ".png";
    var weathertimenormal = time; // reallocate time var....
    var temperaturecelsius = Math.round(temperature - 273.15);  // Converting Kelvin to Celsius
    var windspeedknots = Math.round((windspeed * 1.94) * 100) / 100; // Windspeed from m/s in Knots; Round to 2 decimals
    var windspeedkmh = Math.round((windspeed * 3.6) * 100) / 100; // Windspeed from m/s in km/h; Round to 2 decimals
    

//Popup with content
    var fontsizesmall = 1;
    popup.setContent("<b>Weatherdata</b>:<br>" + "<img src=" + weathercondtioniconhtml + "><br>" + weatherconditionstring + "<br><b>Weather Condition:</b>" + weatherconditiondescription + "<br><b>city:</b>" + cityname+"<br><b>Temperature:</b> " + temperaturecelsius + "°C<br><b>Country:</b>" +weather_country+ " <br><b>Humidity: </b>" + airhumidity + "%" + "<br><b>Cloudcoverage:</b> " + cloudcoverage + "%<br><b>Windspeed:</b> " + windspeedkmh + " km/h<br><br><br><font size=" + fontsizesmall );           


    },
    error: function() {
      alert("error receiving wind data from openweathermap");
    }
  });        
});
}

//popup
map.on('click',onMapClick);
