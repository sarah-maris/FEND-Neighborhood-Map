// Place constructor
const Place = function(yelpLocation, category) {
  const place = this;

  //Get coordinates for map placement
  place.lat = yelpLocation.coordinates.latitude;
  place.lng = yelpLocation.coordinates.longitude;

  //Get info for infoWindow
  place.name = yelpLocation.name;
  place.id = yelpLocation.id;

  place.address = yelpLocation.location.address1;
  place.rating = yelpLocation.rating || 'no rating available';
  place.city = yelpLocation.location.city || '';
  place.state = yelpLocation.location.state || '';
  place.url = yelpLocation.url || '';
  place.snippet = '';

  //If no image use placeholder
  place.imgUrl = yelpLocation.image_url
    ? yelpLocation.image_url
    : 'img/no-image.png';

  //Format phone number for display
  this.dphone = yelpLocation.display_phone;
  place.phone = yelpLocation.display_phone || '';

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
  place.marker = new google.maps.Marker({
    position: { lat: place.lat, lng: place.lng },
    map: view.map,
    icon: this.showIcon,
    title: place.title,
    id: place.id,
    animation: google.maps.Animation.DROP
  });

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

  bounds.extend(place.marker.position);
};
