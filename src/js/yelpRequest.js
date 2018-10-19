// Retrieve data from Yelp
const getYelpData = cat => {
  const url = new URL(
    'https://cors-anywhere.herokuapp.com/https://api.yelp.com/v3/businesses/search'
  );

  Object.keys(YELP_PARAMS).forEach(key =>
    url.searchParams.append(key, YELP_PARAMS[key])
  );

  fetch(url, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`
    }
  })
    .then(res => res.json())
    .then(response => {
      console.log('got data', response.businesses);
      model.getLocations(response.businesses, 'restaurant');
    })
    .catch(error => console.error('Error:', error));
};
