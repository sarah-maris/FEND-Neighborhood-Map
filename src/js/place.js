// Place constructor
const Place = function(yelpLocation, category) {
  const place = this;

  //Get coordinates for map placement
  this.lat = yelpLocation.coordinates.latitude;
  this.lng = yelpLocation.coordinates.longitude;

  //Get info for infoWindow
  this.name = yelpLocation.name;
  this.id = yelpLocation.id;

  this.address = yelpLocation.location.address1;
  this.rating = yelpLocation.rating;
  this.stars = ''; //yelpLocation.rating_img_url;
  this.snippet = ''; //yelpLocation.snippet_text;
  this.city = yelpLocation.location.city;
  this.state = yelpLocation.location.state;
  this.url = yelpLocation.url;

  //If no image use placeholder
  this.imgUrl = yelpLocation.image_url
    ? yelpLocation.image_url
    : 'img/no-image.png';

  //Format phone number for display
  this.phone = yelpLocation.display_phone;
  this.dphone = yelpLocation.display_phone;

  //Create a single array of items for search function: categories and business name
  var keywords = [];
  yelpLocation.categories.forEach(function(catType) {
    //  catType.forEach(function(cat) {
    keywords.push(catType.alias);
    //    });
  });
  keywords.push(this.name);
  this.keywords = keywords;

  //Get category and icon images for map
  this.cat = category;
  this.icon = 'img/' + this.cat + '.png';
  this.favIcon = 'img/fav-' + this.cat + '.png';
  this.showIcon = 'img/' + this.cat + '.png';

  //Set favorite attribute to false
  this.fav = false;

  //Set marker attributes
  this.marker = new google.maps.Marker({
    position: { lat: this.lat, lng: this.lng },
    map: view.map,
    title: this.title,
    icon: this.showIcon,
    animation: google.maps.Animation.DROP
  });

  bounds.extend(this.marker.position);
  place.marker.addListener('click', function() {
    place.showYelpDetails();
  });

  place.showYelpDetails = function() {
    if (!place.snippet) {
      getYelpDetails(place.id).then(review => {
        place.snippet = review;
        infowindow.setContent(place.snippet);
        infowindow.open(map, place.marker);
      });
    } else {
      infowindow.setContent(place.snippet);
      infowindow.open(map, place.marker);
    }
  };

};
