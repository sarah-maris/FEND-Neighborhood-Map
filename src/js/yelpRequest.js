// Retrieve data from Yelp
const getYelpData = cat => {
  const url = new URL(
    'https://guarded-basin-61589.herokuapp.com/https://api.yelp.com/v3/businesses/search'
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
      model.getLocations(response.businesses, 'restaurant');
    })
    .catch(error => console.error('Error:', error));
};

// Retrieve data from Yelp
const getYelpDetails = id => {
  const url = `https://guarded-basin-61589.herokuapp.com/https://api.yelp.com/v3/businesses/${id}/reviews`;
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`
    }
  })
    .then(res => res.json())
    .then(response => {
      return response.reviews ? response.reviews[0].text : 'no review';
    })
    .catch(error => {
      console.error('Error:', error);
      return 'no review';
    });
};
