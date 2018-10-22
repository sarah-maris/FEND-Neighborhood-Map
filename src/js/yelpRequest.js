// Base URL for Yelp Fusion request
const baseURL =
  'https://guarded-basin-61589.herokuapp.com/https://api.yelp.com/v3/businesses/search';

// Set up URL for category
const catURL = (categories, url) => {
  const catURL = new URL(url);

  // Add default parameters
  Object.keys(YELP_PARAMS).forEach(key =>
    catURL.searchParams.append(key, YELP_PARAMS[key])
  );

  // Add category parameter
  catURL.searchParams.append('categories', categories);

  return catURL;
};

// Retrieve data from Yelp
const getYelpData = () => {
  CATEGORIES.map(cat => {
    fetchCatData(catURL(cat.yelpCat, baseURL), cat.cat);
  });
};

// Get list of locations from Yelp
const fetchCatData = (catURL, category) => {
  return fetch(catURL, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`
    }
  })
    .then(res => res.json())
    .then(response => {
      model.getLocations(response.businesses, category);
      return response.businesses;
    })
    .catch(error => console.error('Error:', error));
};

// Get location review from Yelp
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
