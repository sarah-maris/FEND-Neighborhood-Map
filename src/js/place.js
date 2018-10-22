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
  place.phone = yelpLocation.display_phone || '';

  //Create a single array of items for search function: categories and business name
  place.keywords = yelpLocation.categories
    .map(category => category.alias)
    .concat(place.name);

  //Get category and icon images for map
  place.type = category;
  place.icon = `img/${category}.png`;
  place.favIcon = `img/fav-${category}.png`;
  place.showIcon = `img/${category}.png`;

  //Set favorite attribute to false
  // TODO: Check storage for favs and set to true as needed
  place.fav = place.name.includes('B') ? true : false;

  //Set marker attributes
  place.marker = new google.maps.Marker({
    position: { lat: place.lat, lng: place.lng },
    map: view.map,
    title: place.title,
    icon: place.fav ? place.favIcon : place.icon,
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
