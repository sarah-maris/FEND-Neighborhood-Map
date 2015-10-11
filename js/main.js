//****************** MODEL **************************//
//	* Get data from Yelp API
//	* Build array of locations
//	* Handle errors in data retrieval
//***************************************************//

function Model() {
	var self = this;

	//Set up locations
	self.locations =  ko.observableArray();

	//Push locations from Yelp query into array
	self.getLocations = function(businesses) {
		for (var i=0; i < businesses.length; i++ ){
			this.locations.push( new this.bizInfo( businesses[i]));
		}
	};

    //Get Yelp image
    self.pwdByYelp = "img/Powered_By_Yelp_Black.png",

	//Get information about each business from Yelp query data
	self.bizInfo = function(bizObj) {

		//Get coordinates for map placement
		this.lat =  bizObj.location.coordinate.latitude;
		this.lng = bizObj.location.coordinate.longitude;

		//Get info for infoWindow
		this.name =  bizObj.name;
		this.imgUrl = bizObj.image_url;
		this.address = bizObj.location.address[0];
		this.rating = bizObj.rating;
		this.stars = bizObj.rating_img_url;
		this.snippet = bizObj.snippet_text;
		this.city = bizObj.location.city;
        this.state = bizObj.location.state_code;
		this.url = bizObj.url;

		//Format phone number for display
		this.phone = bizObj.phone;
		this.dphone = "(" + bizObj.phone.slice(0,3) + ") " + bizObj.phone.slice(3,6) + "-" + bizObj.phone.slice(6);

		//Create a single array of items for search function: categories and business name
		var keywords = [];
		bizObj.categories.forEach(function(catType){
			catType.forEach(function(cat){
				keywords.push(cat);
			})
		})
		keywords.push(this.name);
		this.keywords = keywords;

	};

	//Send API Query to Yelp
	self.getYelpData = function(cb) {

		var auth = {
		  consumerKey: "fCSqFxVC56k7RxD-CXhtFg",
		  consumerSecret: "_phQk4XXGzIsVRJ8ZfarixIURVw",
		  accessToken: "Ar-g_-LjgtRcBcXgKbTZ9zahrH2kdNNH",
		  accessTokenSecret: "NX2X5wtTxbjKn4Q04N0FWQoH-88",
		  serviceProvider: {
			signatureMethod: "HMAC-SHA1"
		  }
		};

		//var category = 'movietheaters,musicvenues';
		var category = 'restaurants';
		//var category = 'hotels';
		var near = 'Red+Bank+NJ';
		var radius = 5000;
		var sort = 1;
		var accessor = {
		  consumerSecret: auth.consumerSecret,
		  tokenSecret: auth.accessTokenSecret
		};
		parameters = [];
		parameters.push(['location', near]);
		parameters.push(['category_filter', category]);
		parameters.push(['radius_filter', radius]);
		parameters.push(['sort', sort]);
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
		//When sucessful send to getLocations
		.done( function( data ) {
			model.getLocations(data.businesses);
			console.log(data.businesses);
		})
	    //When fail show error message
		//TOD0: Make response more robust
		.fail ( function(){
			alert( "fail" );
			console.log("Could not get data");
		});

	}
}

//****************** VIEW **************************//
//	* Use Google Map to display locations
//**************************************************//

function GoogleMap() {
	var self = this;
	//Initialize Google Map
	self.initialize = function() {

		var mapCanvas = document.getElementById('map');
		var mapOptions = {
		  center: new google.maps.LatLng(40.34653, -74.07409),
		  zoom: 15,
		  mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		self.map = new google.maps.Map(mapCanvas, mapOptions);

		//Add markers to map
		self.setMarkers();

	};

	//Set locations for markers
//	self.setMarkers = ko.computed(function() {
	self.setMarkers = function() {
	var places = viewModel.filteredLocations();

		for (var i = 0; i < places.length; i++) {
			var place = places[i];
			var marker = new google.maps.Marker({
				position: {lat: place.lat, lng: place.lng },
				map: self.map,
				title: place.title
			});

			//Define content for info window
			var contentString = '<div class="place-name">' + place.name + '</div>';
				contentString += '<img class="place-image"src="' + place.imgUrl + '" alt="image of '+ place.name + '">';
				contentString += '<div class="place-info">' + place.address + '<br>' + place.city + ',' + place.state + '<br>';
				contentString += '<a href="tel:' + place.phone + '">' + place.dphone + '</a><br>';
				contentString += '<img class="rating-image" src="' + place.stars + '" alt="Yelp star ratung: '+ place.rating + '"></div>';
				contentString += '<div class="review"><strong>Review Snippet</strong><br><span class="place-snippet">'+ place.snippet + '</span>';
				contentString += '<a href="' + place.url + '" class="yelp"><img src="' + model.pwdByYelp + '" alt="Powered by Yelp"></a></div>';

			//Add info window
			var infoWindow = new google.maps.InfoWindow();

			//Add click function to info window
			google.maps.event.addListener(marker,'click', (function(marker,contentString,infoWindow){
				return function() {
					//Show infoWindow content on click
					infoWindow.setContent(contentString);
					infoWindow.open(self.map,marker);
				};
			})(marker,contentString,infoWindow));
		}
	} //)

	google.maps.event.addDomListener(window, 'load', this.initialize);
}

//********************** VIEW MODEL *************************//
//	* Use Knockoutjs to bind observable data to page
//  * Filter locations by user input (name and/or category)
//**********************************************************//

function ViewModel() {

    var self = this;

	//Get data from model
    self.locations = ko.computed(function(){
        return model.locations();
    });

	//Set filter as an observable
	self.filter = ko.observable('');

	//Filter locations using computed function
	self.filteredLocations = ko.computed(function() {

		//Convert filter to lower case (simplifies comparison)
		var filter = self.filter().toLowerCase();

		if (!filter){
			console.log("no filter");
			return self.locations();

		} else {
			console.log("Filtering for: ", filter);

			//set output to empty variable
			var output = null;

			//Call filter function to pull out locations that match keyword
			output = ko.utils.arrayFilter(self.locations(), keyWordfilter);

			//Return array matching locations

			return output;

			//Keyword filter function
			function keyWordfilter(location) {
				//Set match to false so location is not returned by default
				var match = false;

				//Check each item in keywords array for match
				location.keywords.forEach(function(keyword) {
					//If keyword matches filter, change match to true
					if (keyword.toLowerCase().indexOf(filter) >= 0) {
					  match = true;
					}
				});
				//return location if any match is found
				return match;
			}
		}
	});

	//Get Yelp data from API
	model.getYelpData();
}

var model = new Model();
var viewModel =  new ViewModel();
var map = new GoogleMap();
ko.applyBindings(viewModel);
