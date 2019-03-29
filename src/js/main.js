//Set up global variables
let storeLocations, model, listViewModel, weatherViewModel, view, bounds, infowindow;



//****************** HANDLER ******************************************//
//	* Create custom binding to trigger accodion for ko observed items
//********************************************************************//

ko.bindingHandlers.accordion = {
  //Update tab state when clicked
  update: function(
    element,
    valueAccessor,
    allBindings,
    clickedCategory,
    bindingContext
  ) {
    //Get state of tab from observable
    var tabOpen = ko.unwrap(valueAccessor());

    listViewModel.toggleTabs(element, tabOpen, clickedCategory);

    listViewModel.showAll();
  }
};

// MODEL (locations from Yelp)
function Model() {
  this.locations = ko.observableArray();

  // push locations from Yelp query into array
  this.getLocations = (businesses, category) => {
    businesses.map(business =>
      this.locations.push(new Place(business, category))
    );

    // adjust map zoom and centering
    map.fitBounds(bounds);
  };
}

//************************** VIEW MODEL *****************************************************//
//  * Intialize locations either from Firebase storage or Yelp
//  * Push location attributes from Yelp data in locations array
//  * Set up infoWindows and map markers
//  * Set click function on list to bounce marker and open infoWindow
//  * Sort locations by category and display in sidebar
//  * Filter locations by user input (name and/or category)
//  * Set marker visibilty to show only filtered locations on map when search is active
//  * When item is favorited, add star and update Firebase data
//******************************************************************************************//

function ListViewModel() {
  var self = this;

  //Get data from model
  self.locations = ko.computed(function() {
    return model.locations();
  });

  // TODO: create WindowViewModel to update Yelp data

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
    yelpButton.innerHTML =
      '<a href="' + location.url + '" target="_blank">Read Full Review</a>';
    yelpButton.setAttribute('class', 'button');

    //Create button for Add to Favorites
    location.favButton = windowContent.appendChild(
      document.createElement('div')
    );
    location.favButton.innerHTML = 'Add to Favorites';
    location.favButton.setAttribute('class', 'button');

    //Create button for Remove from Favorites
    location.unFavButton = windowContent.appendChild(
      document.createElement('div')
    );
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
    google.maps.event.addDomListener(location.favButton, 'click', function() {
      self.makeFav(location, index);
    });

    //Add click event for Remove from Favorites button
    google.maps.event.addDomListener(location.unFavButton, 'click', function() {
      self.removeFav(location, index);
    });
    location.infoWindowContent = windowContent;
  };

  //  Sidebar operations
  //======================

  //Set location categories as an observable array
  self.sidebarCats = ko.observableArray();

  // TODO: Convert sidebar operations to filter list using ko.utils.filter or .filter()

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
      for (var j = 0; j < locations.length; j++) {
        //If category matches, add to array of matching locations
        if (locations[j].cat == categoryLocations.cat) {
          sidebarLocations.push(locations[j]);
        }
      }

      //Set sidebarLocations to observable array of matching locations
      categoryLocations.sidebarLocations = ko.observableArray(sidebarLocations);

      //Set initial state for category accordion tabs to closed
      categoryLocations.tabOpen = ko.observable(false);
      categoryLocations.toggle = function(categoryLocations, event) {
        var currentState = categoryLocations.tabOpen();
        categoryLocations.tabOpen(!currentState);
      };

      //Push each category into sidebarCats array
      self.sidebarCats.push(categoryLocations);
    }
  };

  //Set up array to hold the categories of locations that are visible
  self.visibleCategories = ko.observableArray();

  // TODO: Use a computed observable here

  //Show markers of visible locations
  self.showMarkers = function() {
    //Get list of visible location categories
    var visible = self.visibleCategories();

    //Get all locations
    var locations = self.locations();

    //Iterate through locations
    locations.forEach(function(location) {
      //Set default visibility to false
      var isVisible = false;

      //Check if "favorites" is in visible list
      if (visible.indexOf('favs') >= 0) {
        //Check if location is favorite
        if (location.fav) {
          isVisible = true;
        }
      }

      //Check if location's category is in visible list
      if (visible.indexOf(location.type) >= 0) {
        isVisible = true;
      }

      //If location is in visible list, set markers to visible
      if (isVisible) {
        //Set markers to visible
        location.marker.setVisible(true);

        //Bounce one time
        self.bounceMarker(location.marker);
      } else {
        //Close infoWindow if open
        location.infoWindow.close();

        //Set marker to not visible
        location.marker.setVisible(false);
      }
    });
  };

  self.toggleTabs = function(element, tabOpen, clickedCategory) {
    //If a tab is opened
    if (tabOpen) {
      //Empty search filter
      self.searchText('');

      //Clean out filteredLocations array
      self.filteredLocations.removeAll();

      //Add category to list of visible markers
      self.visibleCategories.push(clickedCategory.cat);

      // TODO: re-do using Knockout

      //Open tab
      $(element)
        .next()
        .slideDown('400');

      //Toggle icon
      $(element)
        .removeClass('icon-down')
        .addClass('icon-up');

      //If a tab is closed
    } else {
      //Hide markers and close tab
      self.closeTab(clickedCategory, element);
    }

    //Show the visible markers
    self.showMarkers();
  };

  self.closeTab = function(category, element) {
    //Remove category from list of visible markers
    self.visibleCategories.remove(category.cat);

    //Close tab
    $(element)
      .next()
      .slideUp('400');

    //Toggle icon
    $(element)
      .removeClass('icon-up')
      .addClass('icon-down');

    //Set tabOpen to false
    category.tabOpen(false);
  };

  //  Search operations
  //======================

  //Set filter as an observable
  self.searchText = ko.observable('');

  //Set filteredLocations as an observable array
  self.filteredLocations = ko.observableArray();

  //Filter locations based on input from 'searchText'
  self.filterLocations = function() {
    //Get search text
    var searchText = self.searchText();

    //Close open category and favorite tabs
    //Get all categories and iterate through
    var categories = self.sidebarCats();
    categories.forEach(function(category) {
      //Set variable for dom element
      var element = '.title.' + category.cat;

      //Close tab
      self.closeTab(category, element);
    });

    //Check current status of 'Favorites' tab
    favsClosed = self.favsClosed();

    //If open, toggle to closed state
    if (!favsClosed) {
      //Remove "favs" from visible category list
      self.visibleCategories.remove('favs');

      //Set open state to current open state (true)
      self.favsClosed(true);

      // TODO: re-do using Knockout and class
      //https://stackoverflow.com/questions/8860631/how-to-get-same-effect-as-jquerys-slidetoggle-using-css-3-transitions

      //Toggle the 'open' class
      $('#favoritesTab').toggleClass('icon-down icon-up');

      //Close tab
      $('#favoritesTab')
        .next()
        .slideToggle('400');
    }

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
        if (keyword.toLowerCase().indexOf(searchText) >= 0) {
          keyMatch = true;

          //Set marker visible
          location.marker.setVisible(true);

          // TODO: remove bounce - UGH!
          //Bounce one time
          self.bounceMarker(location.marker);
        }
      });

      // TODO: re-do using better filter methods

      //If there is a keyword match, add to filteredLocations
      if (keyMatch) {
        self.filteredLocations.push(location);
      }
    });

    //Put search text back in filter (removed when tabs were closed)
    self.searchText(searchText);
  };

  //When filtered item is clicked, map marker bounces and infoWindow opens
  self.showDetails = function(location) {
    google.maps.event.trigger(location.marker, 'click');
  };

  //  Favorite functions
  //======================

  // TODO: FIX ALL OF THIS!!!!

  //Set favorites sidebar list as an observable array
  self.favsSidebar = ko.observableArray();

  //Add favorites to favsSidebar
  self.showFavs = function() {
    //Clean out array
    self.favsSidebar.removeAll();

    //Iterate through each location to check for filter
    self.locations().forEach(function(location) {
      //If location is a favorite, add to favsSidebar array
      if (location.fav === true) {
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
      fav: true,
      showIcon: location.favIcon
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
      fav: false,
      showIcon: location.icon
    });

    //Bounce icon
    self.bounceMarker(location.marker);

    //Update favorites in sidebar
    self.showFavs();
  };

  //Start with "Favorites" tab closed
  self.favsClosed = ko.observable(true);

  //  Show all function
  //======================

  self.allMarkers = ko.observableArray();

  self.showAll = function() {
    //Get locations array
    var locations = self.locations();

    //Check search and tab open states
    var searchActive = self.searchText() !== '';
    var tabsOpen = self.visibleCategories().length >= 1;

    //Create temporary array to hold locations
    var tempArray = [];

    //If search is not active and all tabs are closed
    if (!searchActive && !tabsOpen) {
      //Iterate through locations
      for (var i = 0; i < locations.length; i++) {
        //Set markers to visible
        locations[i].marker.setVisible(true);

        //Bounce one time
        self.bounceMarker(locations[i].marker);

        //Add location to temporary array
        tempArray.push(locations[i]);
      }
    }

    //Set allMarkers equal to temporary array
    self.allMarkers(tempArray);
  };

  // Popluate list view with data from Yelp
  getYelpData();
}

function WeatherViewModel() {
  var self = this;
  //  Get weather data
  //======================

  self.currentConditions = ko.observable();

  self.forecast = ko.observableArray();

  self.getWeather = function(data) {
    var weather = data.forecast.simpleforecast.forecastday;
    var rightNow = data.forecast.txt_forecast.forecastday[0].fcttext;

    for (var i = 0; i < weather.length; i++) {
      //Set up temp object
      var day = {};

      //Get data properties
      day.shortday = weather[i].date.weekday_short;
      day.highTemp = weather[i].high.fahrenheit + '°';
      day.lowTemp = weather[i].low.fahrenheit + '°';

      //Change default icon to preferred
      day.iconURL = weather[i].icon_url.replace('k', 'i');
      day.iconAlt = weather[i].icon;

      //Add day object to array
      self.forecast.push(day);
    }

    //Get current weather conditions
    self.currentConditions(rightNow);
  };

  //  Get Weather data from Wunderground
  getWundergroundData();
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
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: MAP_STYLES
    };

    bounds = new google.maps.LatLngBounds();

    //Create map
    self.map = new google.maps.Map(mapCanvas, mapOptions);
    map = self.map;
    infowindow = new google.maps.InfoWindow();
  };

  google.maps.event.addDomListener(window, 'load', this.initializeMap);

  // TODO: re-do using Knockout

  //Add jquery accordion for favorites tab
  $(document).ready(function($) {
    $('#favoritesTab').click(function() {
      //Get previous open state
      favsClosed = listViewModel.favsClosed();

      //Toggle the 'open' class (triggers change in arrow icon)
      $('#favoritesTab').toggleClass('icon-down icon-up');

      //Open or close tab
      $('#favoritesTab')
        .next()
        .slideToggle('400');

      //If closed, toggle to open state
      if (favsClosed) {
        //Empty search filter amd filteredLocations array
        listViewModel.searchText('');
        listViewModel.filteredLocations.removeAll();

        //Add "favs" from visible category list
        listViewModel.visibleCategories.push('favs');

        //Set open state to current open state (false)
        listViewModel.favsClosed(false);

        //Else toggle to closed state
      } else {
        //Remove "favs" from visible category list
        listViewModel.visibleCategories.remove('favs');

        //Set open state to current open state (true)
        listViewModel.favsClosed(true);
      }
    });
  });
}

//****************** INITIALIZE **************************//
//	* Link to Firebase
//  * Declare new Model, ListViewModel and View
//  * Apply Knockout Bindings
//**************************************************//

//Initialize app function -- runs after Google Maps has successfully loaded
var initializeApp = function() {
  model = new Model();
  listViewModel = new ListViewModel();
  weatherViewModel = new WeatherViewModel();
  view = new View();
    ko.applyBindings(listViewModel, document.getElementById('sidebar'));
    ko.applyBindings(weatherViewModel, document.getElementById('weather-box'));
};

//Get data from Google Maps API and launch app
$.getScript(`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAP_KEY}`)

  //When done initialize app and send message to console.
  .done(function() {
    initializeApp();
    console.log('Receiving data from Google Maps');
  })
  .fail(function(jqxhr, settings, exception) {
    //Add error message to page and give details in console

    // TODO:  Re-do using Knockout
    $('#map').append(
      '<p id="locations-error">Google Map not available. <br> Try again later</p>'
    );
    console.log('Unable to load Google Maps', exception);
  });
