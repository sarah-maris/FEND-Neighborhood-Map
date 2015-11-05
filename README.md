##Front End Nanodegree Project 5: Neighborhood Map
###Red Bank Trip Planner
*This project uses the Knockoutjs framework to present data from Google Maps, the Yelp API and the Wunderground API.*

See live here: http://sarah-maris.github.io/FEND-Neighborhood-Map/

#####About Red Bank
Red Bank New, Jersey is known locally for its unique restaurants, hotels, shopping and entertainment venues.  Located near the Jersey Shore, Red Bank is about an hour from New York City and accessible by train (NJ Transit), car (exit 109 on the New Jersey Parkway) or car.

#####How to use this app to make your visit to Red Bank more enjoyable
The page automatically loads information from the Yelp API and loads it on a Google Map.  Locations are stored in the Firebase database -- new locations are called only when database has been cleared or there is an error communicating with Firebase.

Clicking on each location's map marker will give you address, phone, Yelp ratings and a link to the Yelp website to read full reviews and more details about the location.

Favorites can be added or removed by clicking on buttons inside the Google Map infoWindows. When an item is "favorited", its icon changes to a star.  Favorites are saved in the Firebase database and persist after re-opening or refreshing the page.

A list of Favorites can be seen by clicking on the Favorites tab in the sidebar.

Locations can be filtered by name or keyword (cuisine, type of establishment etc.).  They  can also be filtered by category by clicking on the category tabs in the sidebar.

Weather data for the next four days is listed in the site header.

The app is fully responsive and works well on all screen sizes.

#####Resources and features
* Google Maps used to display data
* Knockoutjs library used to update data as it changes
* Firebase used to store data on locations and favorites
* Location data from Yelp
* Weather data from Wunderground
* Sidebar accordion using Knockoutjs custom bindings
* Simple jQuery accordion for non-observable tab
* Category icons using Fontello custom icon collection
* Bower used as package handler
* Gulp used as task runner for build process
* GitHub.io used to host site
* Flexbox used for responsive design elements

#####Ideas for future development and optimization
* **Develop more complete list of locations.**  Yelp api is limited to 20 locations per query and there more than 20 stores and restaurants in Red Bank.  Could do multiple queries but would clutter the map.

* **Include more categories or separate generic restaurant category into different cuisines and service types.**  Same thing for shopping category

* **Add location input button**  This app could be used for any location with a decent Yelp presence using an input box and geocoding to get the lat/long coordinates.
