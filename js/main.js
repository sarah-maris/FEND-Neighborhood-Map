function initialize() {
var mapCanvas = document.getElementById('map');
var mapOptions = {
  center: new google.maps.LatLng(40.34653, -74.07409),
  zoom: 15,
  mapTypeId: google.maps.MapTypeId.ROADMAP
};
var map = new google.maps.Map(mapCanvas, mapOptions);
}
google.maps.event.addDomListener(window, 'load', initialize);


var auth = {
  consumerKey: "fCSqFxVC56k7RxD-CXhtFg",
  consumerSecret: "_phQk4XXGzIsVRJ8ZfarixIURVw",
  accessToken: "Ar-g_-LjgtRcBcXgKbTZ9zahrH2kdNNH",
  accessTokenSecret: "NX2X5wtTxbjKn4Q04N0FWQoH-88",
  serviceProvider: {
    signatureMethod: "HMAC-SHA1"
  }
};

//var terms = 'food';
var near = 'Red+Bank+NJ';
var accessor = {
  consumerSecret: auth.consumerSecret,
  tokenSecret: auth.accessTokenSecret
};
parameters = [];
//parameters.push(['term', terms]);
parameters.push(['location', near]);
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
//parameterMap.oauth_signature = OAuth.percentEncode(parameterMap.oauth_signature);
//console.log(parameterMap);
$.ajax({
  url: message.action,
  data: parameterMap,
  cache: true,
  dataType: 'jsonp',
  jsonpCallback: 'cb' })

  .done(function(data) {
    console.log(data);
	alert( "success" );
  })

  .fail ( function(){
	alert( "fail" );
	console.log("Could not get data");
  });