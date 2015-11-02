//****************** HANDLER ******************************************//
//	* Create custom binding to trigger accodion for ko observed items
//********************************************************************//

ko.bindingHandlers.accordion = {

	//Update tab state when clicked
	update: function (element, valueAccessor, allBindings, clickedCategory, bindingContext) {

		//Get state of tab from observable
		var tabOpen = ko.unwrap(valueAccessor());

		viewModel.toggleTabs(element, tabOpen, clickedCategory)
	}
};

//****************** MODEL ********************************//
//	* Set categories for Yelp data
//	* Get data for each category from Yelp API
//	* Send data to ViewModel to build array of locations
//	* Get weather data from Wunderground
//	* Handle errors in data retrieval
//********************************************************//

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

				//Add categories and locations to sidebar
				viewModel.showCats();

				//Get weather data
				self.getWundergroundData();

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

	//Get Weather data
	self.getWundergroundData = function(){
		$.ajax({
			url : "http://api.wunderground.com/api/4d00d2a5eb37d968/forecast/q/NJ/Red_Bank.json",
			dataType : "jsonp",
			async: true
		})

		.done ( function( data ) {
			console.log(data);
			viewModel.getWeather(data);
		})
		//When fail show error message
		//TOD0: Make response more robust
		.fail ( function( data ){
			alert( 'fail');
			console.log('Could not get data', data);
		});

	};

	//Get Wunderground logo
    self.wundergroundImg = 'img/wundergroundLogo_4c_horz.png';


}

//************************** VIEW MODEL *****************************************//
//  * Intialize locations either from Firebase storage or Yelp
//  * Push location attributes from Yelp data in locations array
//  * Set up infoWindows and map markers
//  * Set click function on list to bounce marker and open infoWindow
//  * Sort locations by category and display in sidebar
//  * Filter locations by user input (name and/or category)
//  * Set marker visibilty to show only filtered locations on map
//  * When item is favorited, add star and update Firebase data
//*****************************************************************************//

function ViewModel() {

    var self = this;

//  Initialize and get location data
//====================================

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

				//Add favorites to sidebar
				self.showFavs();

				//Add categories and locations to sidebar
				self.showCats();

				//Get weather data
				model.getWundergroundData();

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
		location.favButton = windowContent.appendChild(document.createElement('div'));
		location.favButton.innerHTML = 'Add to Favorites';
		location.favButton.setAttribute('class', 'button');

		//Create button for Remove from Favorites
		location.unFavButton = windowContent.appendChild(document.createElement('div'));
		location.unFavButton.innerHTML = 'Remove from Favorites';
		location.unFavButton.setAttribute('class', 'button hide');

		//Set attributes for button based on favorite status
		if (location.fav === true) {
			location.favButton.setAttribute('class', 'button hide');
			location.unFavButton.setAttribute('class', 'button');
		} else {
			location.favButton.setAttribute('class', 'button');
			location.unFavButton.setAttribute('class', 'button hide');
		}

		//Add click event for Add to Favorites button
		google.maps.event.addDomListener(location.favButton, 'click', function () {
			self.makeFav(location, index);
		});

		//Add click event for Remove from Favorites button
		google.maps.event.addDomListener(location.unFavButton, 'click', function () {
			self.removeFav(location, index);
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
				map: view.map,
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
					infoWindow.open(view.map,marker);
					self.bounceMarker(marker);
				};

			})(marker,infoWindowContent,infoWindow));

		}
	};

	//Bounce marker one time
	self.bounceMarker = function(marker) {
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function(){ marker.setAnimation(null); }, 750);
	};

//  Sidebar operations
//======================

	//Set location categories as an observable array
	self.sidebarCats = ko.observableArray();

	//Add locations to sidebar by category
	self.showCats = function(category) {

		//Get categories from Model
		var categories = model.categories;

		//Iterate through categories
		for (var i = 0; i < categories.length; i++) {

			//Add temp object to hold properties of each location category
			var categoryLocations = {};

			//Add category and name to temp object
			categoryLocations.cat = categories[i].cat;
			categoryLocations.name = categories[i].name;

			//Add temp array to hold list of matching locations for the category
			var sidebarLocations = [];

			//Get locations
			var locations = self.locations();

			//Iterate through locations
			for (var j=0; j<  locations.length; j++){

				//If category matches, add to array of matching locations
				if (locations[j].cat == categoryLocations.cat){
					sidebarLocations.push(locations[j]);
				}
			}

		//Set sidebarLocations to observable array of matching locations
		categoryLocations.sidebarLocations = ko.observableArray(sidebarLocations);

		//Set initial state for category accordion tabs to closed
		categoryLocations.tabOpen = ko.observable(true);
		categoryLocations.toggle = function (categoryLocations, event) {
            var currentState = categoryLocations.tabOpen();
			categoryLocations.tabOpen(!currentState);
		};

		//Push each category into sidebarCats array
		self.sidebarCats.push(categoryLocations);

		}

	};

	//Set up array to hold the categories of locations that are visible
	self.visibleCategories = ko.observableArray();

	//Show markers of visible locations
	self.showMarkers = function(){

		//Get list of visible location categories
		var visible = self.visibleCategories();

		//Get all locations
		var locations = self.locations();

		//Iterate through locations
		locations.forEach(function(location) {

			//Set default visibility to false
			var isVisible = false;

			//Check if "favorites" is in visible list
			if (visible.indexOf("favs")>= 0) {

				//Check if location is favorite
				if (location.fav){
					isVisible = true;
				}
			}

			//Check if location's category is in visible list
			if (visible.indexOf( location.cat) >= 0) {
				isVisible = true;
			}

			//If location is in visible list, set markers to visible
			if ( isVisible ){

				//Set markers to visible
				location.marker.setVisible(true);

				//Bounce one time
				self.bounceMarker(location.marker);

			} else {

				//Set marker to not visible
				location.marker.setVisible(false);
			}
		});
	};

	self.toggleTabs = function(element, tabOpen, clickedCategory){
			//If a tab is opened
		if (tabOpen) {

			//Add category to list of visible markers
			self.visibleCategories.push(clickedCategory.cat);

			//Open tab
			$(element).next().slideDown('400');

			//Toggle icon
			$(element).removeClass("icon-down").addClass("icon-up");

		//If a tab is closed
		} else {

		//Remove category from list of visible markers
		self.visibleCategories.remove(clickedCategory.cat);

			//Close tab
			$(element).next().slideUp('400');

			//Toggle icon
			$(element).removeClass("icon-up").addClass("icon-down");
		}

		//Show the visible markers
		self.showMarkers();

	}

//  Search operations
//======================

	//Set filter as an observable
	self.searchFilter = ko.observable('');

	//Set filteredLocations as an observable array
	self.filteredLocations = ko.observableArray();

	//Filter locations based on input from 'searchFilter'
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

					//Set marker visible
					location.marker.setVisible(true);

					//Bounce one time
					self.bounceMarker(location.marker);
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
		self.bounceMarker(location.marker);

		//Show infoWindowContent when infoWindow is isOpen
		infoWindow.setContent(location.infoWindowContent);
		infoWindow.open(view.map,marker);

	};

//  Favorite functions
//======================

	//Set favorites sidebar list as an observable array
	self.favsSidebar = ko.observableArray();

	//Add favorites to favsSidebar
	self.showFavs = function() {

		//Clean out array
		self.favsSidebar.removeAll();

		//Iterate through each location to check for filter
		self.locations().forEach(function(location) {

			//If location is a favorite, add to favsSidebar array
			if (location.fav === true){
				self.favsSidebar.push(location);
			}

		});

	};

	//Add location to favorites
	self.makeFav = function(location, index) {
		//Change fav attribute to 'true'
		location.fav = true;

		//Close info window
		location.infoWindow.close();

		//Change 'showIcon' to 'fav' icon
		location.showIcon = location.favIcon;
		location.marker.icon = location.showIcon;

		//Update infoWindow buttons
		location.favButton.setAttribute('class', 'button hide');
		location.unFavButton.setAttribute('class', 'button');

		//Update 'fav' and 'showIcon' data in Firebase storage
		storedLocations.child(index).update({
			'fav': true,
			'showIcon': location.favIcon
		});

		//Bounce icon
		self.bounceMarker(location.marker);

		//Update favorites in sidebar
		self.showFavs();

	};

	//Remove location from favorites
	self.removeFav = function(location, index) {
		//Change fav attribute to 'false'
		location.fav = false;

		//Close info window
		location.infoWindow.close();

		//Change 'showIcon' to 'fav' icon
		location.showIcon = location.icon;
		location.marker.icon = location.showIcon;

		//Update infoWindow buttons
		location.favButton.setAttribute('class', 'button hide');
		location.unFavButton.setAttribute('class', 'button');

		//Update 'fav' and 'showIcon' data in Firebase storage
		storedLocations.child(index).update({
			'fav': false,
			'showIcon': location.icon
		});

		//Bounce icon
		self.bounceMarker(location.marker);

		//Update favorites in sidebar
		self.showFavs();

	};

	//Start with "Favorites" tab closed
	self.favsClosed = ko.observable(true);


//  Get weather data
//======================

	self.getWeather = function(data){

		var weather = data.forecast.simpleforecast.forecastday;
		var rightNow = data.forecast.txt_forecast.forecastday[0];
		console.log(weather, rightNow);
//TODO: Create today object with data from weather[0] and rightNow
//TODO: Remove unnecessary data from forecast
//TODO: Display weather data on page
		self.forecast = ko.observableArray();

		for (var i = 0; i < weather.length; i++ ){
			var day = {};
			day.shortday = weather[i].date.weekday_short;
			day.fullday = weather[i].date.weekday;
			day.month = weather[i].date.monthname;
			day.date = weather[i].date.day;
			day.highTemp = weather[i].high.fahrenheit;
			day.lowTemp = weather[i].low.fahrenheit;
			day.icon = weather[i].icon;
			day.iconURL = weather[i].icon_url;
			day.precip = weather[i].pop;
			self.forecast.push(day);
		}
		console.log(self.forecast());
	};

//  Run data request
//======================

	self.initializeLocations();

}

//****************** VIEW **************************//
//	* Initilize Google Map to display locations
//**************************************************//

function View() {
	var self = this;

	//Initialize Google Map
	self.initializeMap = function() {

		var mapCanvas = document.getElementById('map');
		var mapOptions = {
			center: new google.maps.LatLng(40.351724, -74.067342),
			zoom: 16,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		self.map = new google.maps.Map(mapCanvas, mapOptions);

	};

	google.maps.event.addDomListener(window, 'load', this.initializeMap);

	//Add jquery accordion for favorites tab
	$(document).ready(function($) {

		$('#favoritesTab').click(function(){

			//Get previous open state
			favsClosed = viewModel.favsClosed();

			//Toggle the 'open' class (triggers change in arrow icon)
			$('#favoritesTab').toggleClass("icon-down icon-up");

			//Open or close tab
			$('#favoritesTab').next().slideToggle('400');

			//If closed, toggle to open state
			if (favsClosed){

				//Add "favs" from visible category list
				viewModel.visibleCategories.push("favs");

				//Set open state to current open state (false)
				viewModel.favsClosed(false);

			//Else toggle to closed state
			} else {

				//Remove "favs" from visible category list
				viewModel.visibleCategories.remove("favs");

				//Set open state to current open state (true)
				viewModel.favsClosed(true);
			}

		});

  });
}

//****************** INITIALIZE **************************//
//	* Link to Firebase
//  * Declare new Model, ViewModel and View
//  * Apply Knockout Bindings
//**************************************************//

var storedLocations = new Firebase('https://blistering-heat-6713.firebaseio.com/');
var model = new Model();
var viewModel =  new ViewModel();
var view = new View();
ko.applyBindings(viewModel);

//TODO: Move more of tab functions to VM - move entire jquery function to view???
//TODO: Add weather (see above) -- put in top bar
//TODO: Fix search -- better styling and remove default
//TODO: Customize map colors
//TODO: Make error handling more robust
//TODO: Close info windows when market goes invisible
//TODO: Empty search input when tab open
//TODO: Search in category