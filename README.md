##Front End Nanodegree Project 5: Neighborhood Map
###Red Bank Trip Planner
*This project uses the Knockoutjs framework to present data from Google Maps, the Yelp API and the Wunderground API.*

#####About Red Bank
Red Bank New, Jersey is known locally for its unique restaurants, hotels, shopping and entertainment venues.  Located near the Jersey Shore, Red Bank is about an hour from New York City and accessible by train (NJ Transit), car (exit 109 on the New Jersey Parkway) or car.

#####How to use this app to make your visit to Red Bank more enjoyable
The page automatically loads information from the Yelp API and loads it on a Google Map.  Clicking on each map pointer will give you address, phone, Yelp ratings and a link to the Yelp website.

In the infoWindow you can follow the link to the full Yelp review and add the establishment to your list of favorites.  When an item is "favorited", its icon changes to a star.  Favorites are saved in the Firebase database.

You can also filter by name or type of establishment.

#####Key Features
* Google Maps used to display data
* Knockoutjs library used to update data as it changes
* Firebase is used to store data
* Location data from Yelp
* Weather data from Wunderground

#####Issues
* Not all locations are included in the map.  Yelp api is limited to 20 locations per query and there more than 20 stores and restaurants in Red Bank.  Could do multiple queries but would clutter the map.
