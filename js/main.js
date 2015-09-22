var ViewModel =  function() {

    var self = this;

    this.places = ko.observableArray( [] );

	this.initialize = function() {
		var mapCanvas = document.getElementById('map');
		var mapOptions = {
		  center: new google.maps.LatLng(40.34653, -74.07409),
		  zoom: 15,
		  mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		var map = new google.maps.Map(mapCanvas, mapOptions);

	//setMarkers(map);
	}
	
	google.maps.event.addDomListener(window, 'load', self.initialize);

}

ko.applyBindings( new ViewModel() );

/*


function setMarkers(map) {

  for (var i = 0; i < beaches.length; i++) {
    var place = places[i];
    var marker = new google.maps.Marker({
      position: {lat: place.lat, lng: place.lng },
      map: map,
      title: place.title
    });
  }
}

*/

var auth = {
  consumerKey: "fCSqFxVC56k7RxD-CXhtFg",
  consumerSecret: "_phQk4XXGzIsVRJ8ZfarixIURVw",
  accessToken: "Ar-g_-LjgtRcBcXgKbTZ9zahrH2kdNNH",
  accessTokenSecret: "NX2X5wtTxbjKn4Q04N0FWQoH-88",
  serviceProvider: {
    signatureMethod: "HMAC-SHA1"
  }
};

//var terms = 'food';
var near = 'Red+Bank+NJ';
var accessor = {
  consumerSecret: auth.consumerSecret,
  tokenSecret: auth.accessTokenSecret
};
parameters = [];
parameters.push(['location', near]);
parameters.push(['callback', 'cb']);
parameters.push(['oauth_consumer_key', auth.consumerKey]);
parameters.push(['oauth_consumer_secret', auth.consumerSecret]);
parameters.push(['oauth_token', auth.accessToken]);
parameters.push(['oauth_signature_method', 'HMAC-SHA1']);

var message = {
  'action': 'http://api.yelp.com/v2/search',
  'method': 'GET',
  'parameters': parameters
};
OAuth.setTimestampAndNonce(message);
OAuth.SignatureMethod.sign(message, accessor);
var parameterMap = OAuth.getParameterMap(message.parameters);
parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);

function getPlaces(cb) {
	var self= this;
	self.results = ko.observableArray([]);
	 $.ajax({
	  url: message.action,
	  data: parameterMap,
	  cache: true,
	  dataType: 'jsonp',
	  jsonpCallback: 'cb',
      success:function(data) {
		  console.log(data.businesses);
 for (var i = 0; i < data.businesses.length; i++) {
	 results.push(data.businesses[i]);
	 
 }
		   console.log("resu;t", results);
   return this.results; 		  
      }
   });


//	  })

//
	//.done(cb)
	};

/*  .fail ( function(){
	alert( "fail" );
	console.log("Could not get data");
  });
}

*/
