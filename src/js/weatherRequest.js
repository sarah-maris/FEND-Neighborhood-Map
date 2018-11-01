// TODO: Convert to OpenWeather

const getWundergroundData = function() {
  $.ajax({
    url:
      'https://api.wunderground.com/api/4d00d2a5eb37d968/forecast/q/NJ/Red_Bank.json',
    dataType: 'jsonp'
  })

    .done(function(data) {
      //Error response needed within "done" because error is returned as a successful request
      if (data.response.error) {
        //Get error code
        var errorCode = data.response.error.description;

        //Add error message to page and give details in console
        $('#forecast-box').append(
          '<p id="weather-error">No weather data available. <br> Try again later</p>'
        );
        $('#current-conditions').append('<p id="current-error">N/A</p>');
        console.log(
          'Unable to load Wunderground data. Error code:"',
          errorCode,
          '"'
        );

        //Else send weather data to viewModel for processing
      } else {
        console.log('Receiving weather data from Wunderground');
        viewModel.getWeather(data);
      }
    })

    //If fail show error message
    .fail(function(data) {
      alert('Could not get Wunderground data');
      console.log('Wunderground Error details:', data);
    });
};
