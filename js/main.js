var model =  {
	
	//Set up locations
	locations: ko.observableArray(),
	
	//Push locations from Yelp query into array
	getLocations: function(businesses) {
		for (var i=0; i < businesses.length; i++ ){
			this.locations.push( new this.bizInfo( businesses[i]));
		}
	},
	
	//Get information about each business from Yelp query data
	bizInfo: function(bizObj) {
		this.name = bizObj.name;
		this.phone = bizObj.phone;
		this.imgUrl = bizObj.image_url;
		this.lat = bizObj.location.coordinate.latitude;
		this.long = bizObj.location.coordinate.longitude;
	},
	
	getPlaces: function(cb) {
		
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
		//parameters.push(['term', terms]);		
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

		$.ajax({
			  url: message.action,
			  data: parameterMap,
			  cache: true,
			  dataType: 'jsonp',
			  jsonpCallback: 'cb'
		})
		.done( function( data ) {
			model.getLocations(data.businesses);
			console.log(data.businesses);
		})
	   
		.fail ( function(){
			alert( "fail" );
			console.log("Could not get data");
		});
		
	}	
}

var ViewModel =  function() {

    var self = this;

	this.locations = model.locations();
	
	this.initialize = function() {

		var mapCanvas = document.getElementById('map');
		var mapOptions = {
		  center: new google.maps.LatLng(40.34653, -74.07409),
		  zoom: 15,
		  mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		var map = new google.maps.Map(mapCanvas, mapOptions);

		self.setMarkers(map);
	
	};

	this.setMarkers = function(map) {
		places = this.locations;
		  for (var i = 0; i < places.length; i++) {
			var place = places[i];
			var marker = new google.maps.Marker({
			  position: {lat: place.lat, lng: place.long },
			  map: map,
			  title: place.title
			});
	}
}
	model.getPlaces();
	google.maps.event.addDomListener(window, 'load', self.initialize);
}

ko.applyBindings( new ViewModel() );