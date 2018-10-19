//Set colors and visibility for map features
const MAP_STYLES = [
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#444444' }]
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [{ color: '#f2f2f2' }]
  },
  {
    featureType: 'poi',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'all',
    stylers: [{ saturation: -100 }, { lightness: 55 }, { gamma: 0.47 }]
  },
  {
    featureType: 'road.highway',
    elementType: 'all',
    stylers: [{ visibility: 'simplified' }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.icon',
    stylers: [
      { hue: '#ff0033' },
      { gamma: 0.58 },
      { saturation: 26 },
      { visibility: 'on' }
    ]
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [{ color: '#1b317d' }, { lightness: 60 }, { gamma: 1.87 }]
  }
];
