//****************** MODEL **************************//
//	* Set categories for Yelp data
//	* Get data for each category from Yelp API
//	* Build array of locations
//	* Handle errors in data retrieval
//***************************************************//

function Model() {

	var self = this;

	//Set up observable array to hold locations
	self.locations = ko.observableArray();

	//Add categories that we want to include
	self.categories = [
		{ 'name': 'Entertainment', 'yelpName':'movietheaters,musicvenues', 'cat': 'entertainment' },
		{ 'name': 'Restaurants','yelpName':'restaurants', 'cat': 'restaurant' },
		{ 'name': 'Hotels','yelpName':'hotels', 'cat': 'hotel' },
		{ 'name': 'Shopping', 'yelpName':'shopping', 'cat': 'shopping' }
	];

	//Iterate through categories to get data from Yelp
	self.getNewData = function(){

		//Set variables for counter and number of categories
		self.counter = 0;
		self.numCats = self.categories.length;

		//Start with the first category -- next is called after successful data retrieval
		self.getYelpData(self.categories[0]);

	};

	//Send API Query to Yelp
	self.getYelpData = function(category, cb) {

		var auth = {
			consumerKey: 'fCSqFxVC56k7RxD-CXhtFg',
			consumerSecret: '_phQk4XXGzIsVRJ8ZfarixIURVw',
			accessToken: 'Ar-g_-LjgtRcBcXgKbTZ9zahrH2kdNNH',
			accessTokenSecret: 'NX2X5wtTxbjKn4Q04N0FWQoH-88',
			serviceProvider: {
				signatureMethod: 'HMAC-SHA1'
			}
		};

		var near = 'Red+Bank+NJ';
		var radius = 3000;
		var sort = 1;
		var accessor = {
			consumerSecret: auth.consumerSecret,
			tokenSecret: auth.accessTokenSecret
		};
		parameters = [];
		parameters.push(['location', near]);
		parameters.push(['category_filter', category.yelpName]);
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
			async: true,
			data: parameterMap,
			cache: true,
			dataType: 'jsonp',
			jsonpCallback: 'cb'
		})
		//When sucessful send to getLocations
		.done( function( data ) {

			//Push get data from each location
			model.getLocations(data.businesses, category);

			//Increment category counter
			self.counter ++;

			//Get data for next category
			if (self.counter < self.numCats ) {
				self.getYelpData( self.categories[self.counter] );

			//When data has been received for all categories
			} else {
				//Push JSON content to firebase
				storedLocations.set(self.locations());

				//Set markers on map
				viewModel.setMarkers();
			}

		})

		//When fail show error message
		//TOD0: Make response more robust
		.fail ( function( data ){
			alert( 'fail');
			console.log('Could not get data', data);
		});

	};

	//Push locations from Yelp query into array
	self.getLocations = function(businesses, category) {
		for (var i=0; i < businesses.length; i++ ){
			self.locations.push( new viewModel.bizInfo( businesses[i], category ));
		}
	};

	//Get Yelp image
    self.pwdByYelp = 'img/Powered_By_Yelp_Black.png';

}

//************************** VIEW MODEL *****************************************//
//  * Intialize locations either from Firebase storage or Yelp
//  * Push location attributes from Yelp data in locations array
//  * Set up infoWindows and map markers
//  * Set click function on list to bounce marker and open infoWindow
//  * Filter locations by user input (name and/or category)
//  * Set marker visibilty to show only filtered locations on map
//  * When item is favorited, add star and update Firebase data
//*****************************************************************************//

function ViewModel() {

    var self = this;

//  Initialize and get data
//============================

	//Check for data stored in Firebase
	self.initializeLocations = function(){

		//Read data from Firebase
		storedLocations.once('value', function(snapshot) {

			//Use stored data if it exists
			if (snapshot.val()){

				//Send message to console
				console.log('Receiving data from Firebase');

				//Set locations array to storedData array
				model.locations(snapshot.val());

				//Set markers
				self.setMarkers();

				//Add favorites to menu
				self.showFavs();

			//If no stored data exists get new data from Yelp
			} else {

				//Send message to console
				console.log('No stored data -- getting new data from Yelp');

				//Get new Yelp Data
				model.getNewData();

			}
		});
	};

	//Get data from model
    self.locations = ko.computed(function(){
        return model.locations();
    });

	//Get information about each business from Yelp query data
	self.bizInfo = function(bizObj, category) {

		//Get coordinates for map placement
		this.lat =  bizObj.location.coordinate.latitude;
		this.lng = bizObj.location.coordinate.longitude;

		//Get info for infoWindow
		this.name =  bizObj.name;

		this.address = bizObj.location.address[0];
		this.rating = bizObj.rating;
		this.stars = bizObj.rating_img_url;
		this.snippet = bizObj.snippet_text;
		this.city = bizObj.location.city;
        this.state = bizObj.location.state_code;
		this.url = bizObj.url;

		//If no image use placeholder
		this.imgUrl = bizObj.image_url ? bizObj.image_url : 'img/no-image.png';

		//Format phone number for display
		this.phone = bizObj.phone;
		this.dphone = '(' + bizObj.phone.slice(0,3) + ') ' + bizObj.phone.slice(3,6) + '-' + bizObj.phone.slice(6);

		//Create a single array of items for search function: categories and business name
		var keywords = [];
		bizObj.categories.forEach(function(catType){
			catType.forEach(function(cat){
				keywords.push(cat);
			});
		});
		keywords.push(this.name);
		this.keywords = keywords;

		//Get category and icon images for map
		this.cat = category.cat;
		this.icon = 'img/' + this.cat + '.png';
		this.favIcon = 'img/fav-' + this.cat + '.png';
		this.showIcon = 'img/' + this.cat + '.png'; //this.icon;

		//Set favorite attribute to false
		this.fav = false;

		//Set infoWindow content
		this.windowHTML = '<div class="place-name">' + this.name + '</div>';
		this.windowHTML += '<img class="place-image"src="' + this.imgUrl + '" alt="image of '+ this.name + '">';
		this.windowHTML += '<div class="place-info">' + this.address + '<br>' + this.city + ',' + this.state + '<br>';
		this.windowHTML += '<a href="tel:' + this.phone + '">' + this.dphone + '</a><br>';
		this.windowHTML += '<img class="rating-image" src="' + this.stars + '" alt="Yelp star rating: '+ this.rating + '">';
		this.windowHTML += '<img class="yelp" src="' + model.pwdByYelp + '" alt="Powered by Yelp"></div>';
		this.windowHTML += '<div class="review"><strong>Review Snippet</strong><br><span class="place-snippet">'+ this.snippet + '</span></div>';

	};

	//Set content and event listener in infoWindow
	self.setInfoWindow = function(location, index) {

		//Set up div to hold infoWindow content
		var windowContent = document.createElement('div');

		//Set HTML content for infoWindow
		windowContent.innerHTML = location.windowHTML;

		//Give window content 'info-window' class
		windowContent.setAttribute('class', 'info-window');

		//Create button for Yelp link
		var yelpButton = windowContent.appendChild(document.createElement('div'));
		yelpButton.innerHTML = '<a href="' + location.url + '" target="_blank">Read Full Review</a>';
		yelpButton.setAttribute('class', 'button');

		//Create button for Add to Favorites
		var favButton = windowContent.appendChild(document.createElement('div'));
		favButton.innerHTML = 'Add to Favorites';
		favButton.setAttribute('class', 'button');

		//Add click event for Add to Favorites button
		google.maps.event.addDomListener(favButton, 'click', function () {
			self.makeFav(location, index);
		});

		location.infoWindowContent = windowContent;

	};

	//Set locations for markers
	self.setMarkers = function() {

		//Get locations
		var mapLocations = this.locations();

		//Set up marker for each location
		for (var i = 0; i < mapLocations.length; i++) {
			var location = mapLocations[i];

			//Set marker attributes
			location.marker = new google.maps.Marker({
				position: {lat: location.lat, lng: location.lng },
				map: map.map,
				title: location.title,
				icon: location.showIcon,
				animation: google.maps.Animation.DROP
			});

			//Get content for infoWindow
			self.setInfoWindow(location, i);

			//Add new infoWindow
			location.infoWindow = new google.maps.InfoWindow();

			//Add click function to marker to open infoWindow
			var marker = location.marker;
			var infoWindowContent = location.infoWindowContent;
			var infoWindow = location.infoWindow;

			google.maps.event.addListener(marker,'click', (function(marker,infoWindowContent,infoWindow){

				//Show infoWindow content on click
				return function() {
					infoWindow.setContent(infoWindowContent);
					infoWindow.open(map.map,marker);
				};

			})(marker,infoWindowContent,infoWindow));

		}
	};

//  Menu operations
//======================


//  Search operations
//======================

	//Set filter as an observable
	self.searchFilter = ko.observable('');

	//Set filteredLocations as an observable array
	self.filteredLocations = ko.observableArray();

	//If no filter, show all locations else show filtered locations
	self.visibleLocations = ko.computed(function() {
		if (!self.searchFilter()){
			return self.locations();
		} else {
			return self.filteredLocations();
		}
	});

	self.filterLocations = function() {

		//Convert filter to lower case (simplifies comparison)
		var searchFilter = self.searchFilter().toLowerCase();

		//Clean out filteredLocations array
		self.filteredLocations.removeAll();

		//Iterate through each location to check for filter
		self.locations().forEach(function(location) {

			//Close infoWindow if open
			location.infoWindow.close();

			//Set each marker visibility to false
			location.marker.setVisible(false);

			//Set keywordMatch to false
			var keyMatch = false;

			//Check each item in keywords array for match
			location.keywords.forEach(function(keyword) {

				//If keyword matches filter, change keyMatch to true and make marker visible
				if (keyword.toLowerCase().indexOf(searchFilter) >= 0) {
					keyMatch = true;
					location.marker.setVisible(true);
				}
			});

			//If there is a keyword match, add to filteredLocations
			if (keyMatch){
				self.filteredLocations.push(location);
			}

		});

	};

	//When filtered item is clicked, map marker bounces and infoWindow opens
	self.showDetails = function(location) {

		//Close infoWindow
		location.infoWindow.close();

		//Set up variables
		var marker = location.marker;
		var infoWindow = location.infoWindow;

		//Set marker animation to about one bounce
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){ marker.setAnimation(null); }, 900);

		//Show infoWindowContent when infoWindow is opened
		infoWindow.setContent(location.infoWindowContent);
		infoWindow.open(map.map,marker);

	};

//  Favorite functions
//======================

	//Set favorites menu list as an observable array
	self.favsMenu = ko.observableArray();

	//Add favorites to favsMenu
	self.showFavs = function() {

		//Clean out array
		self.favsMenu.removeAll();

		//Iterate through each location to check for filter
		self.locations().forEach(function(location) {

			//If location is a favorite, add to favsMenu array
			if (location.fav === true){
				self.favsMenu.push(location);
			}

		});

	};//When item is favorited
	self.makeFav = function(location, index) {
		//Change fav attribute to 'true'
		location.fav = true;

		//Close info window
		location.infoWindow.close();

		//Change 'showIcon' to 'fav' icon
		location.showIcon = location.favIcon;
		location.marker.icon = location.showIcon;

		//Update 'fav' and 'showIcon' data in Firebase storage
		storedLocations.child(index).update({
			'fav': true,
			'showIcon': location.favIcon
		});

		//Bounce icon
		location.marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){ location.marker.setAnimation(null); }, 750);

		//Update favorites in menu
		self.showFavs();

	};


self.initializeLocations();
}

//****************** VIEW **************************//
//	* Initilize Google Map to display locations
//**************************************************//

function GoogleMap() {
	var self = this;

	//Initialize Google Map
	self.initialize = function() {

		var mapCanvas = document.getElementById('map');
		var mapOptions = {
			center: new google.maps.LatLng(40.349628, -74.067073),
			zoom: 17,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		self.map = new google.maps.Map(mapCanvas, mapOptions);

	};

	google.maps.event.addDomListener(window, 'load', this.initialize);
}

//****************** INITIALIZE **************************//
//	* Link to Firebase
//  * Declare new Model, ViewModel and View
//  * Apply Knockout Bindings
//**************************************************//

var storedLocations = new Firebase('https://blistering-heat-6713.firebaseio.com/');
var model = new Model();
var viewModel =  new ViewModel();
var map = new GoogleMap();
ko.applyBindings(viewModel);

//TODO: Add remove favorite function
//TODO: Add another API -- NJ Transit, weather channel, sunrise and sunset times
//TODO: Customize map colors
//TODO: Upgrade search capacity to include autocomplete or filter by multiple items
//TODO: Make error handling more robust