/*globals google*/
( function () {
  'use strict';

  function GMap( latitude, longitude, zoom ) {

    var map,
      marker;

    function createMap() {
      map = new google.maps.Map( document.getElementById( 'map' ), {
        center: new google.maps.LatLng( latitude, longitude ),
        zoom: zoom
      } );
    }

    function getPlaces( configuration ) {
      var request = {
        location: map.getCenter(),
        radius: configuration.radius,
        types: configuration.types,
        name: configuration.name
      };

      var service = new google.maps.places.PlacesService( map );
      service.nearbySearch( request, configuration.onPlacesReceived );
    }

    function placeMarker( place, content ) {
      marker = new google.maps.Marker( {
        map: map,
        position: place.geometry.location
      } );

      var infoWindow = new google.maps.InfoWindow();

      infoWindow.setOptions( {
        disableAutoPan: true
      } );
      infoWindow.setContent( content );
      infoWindow.open( map, marker );
      map.panTo( place.geometry.location );

      google.maps.event.addListener( marker, 'click', function () {
        infoWindow.open( map, marker );
      } );
    }

    function removeMarker() {
      if ( !marker ) {
        return false;
      }
      marker.setMap( null );
    }

    createMap();

    return {
      map: map,
      getPlaces: getPlaces,
      placeMarker: placeMarker,
      removeMarker: removeMarker
    };
  }


  function Category( configuration ) {
    var name,
      node,
      restaurants,
      onRestaurantClick;

    function initialize( configuration ) {
      node = configuration.node;
      name = configuration.name;
      onRestaurantClick = configuration.onRestaurantClick || function () {};
      restaurants = configuration.restaurants;
      bindCollapse();
    }

    function bindCollapse() {
      var link = node.getElementsByTagName( 'a' )[ 0 ];
      link.addEventListener( 'click', function () {
        node.classList.toggle( 'collapsed' );
      } );
    }

    function getRestaurants() {
      return restaurants;
    }

    function filter( field, value ) {
      return restaurants.filter( function ( restaurant ) {
        var regexp = new RegExp( value, 'gi' );
        return regexp.test( restaurant[ field ] );
      } );
    }

    function render( restaurants ) {
      var container = node.getElementsByTagName( 'ul' )[ 0 ];
      container.innerHTML = '';

      var restaurantNode;
      if ( restaurants.length === 0 ) {
        restaurantNode = document.createElement( 'li' );
        restaurantNode.setAttribute( 'class', 'no-results' );
        restaurantNode.innerHTML = 'No results';
        container.appendChild( restaurantNode );
      } else {
        for ( var i = 0, l = restaurants.length; i < l; i++ ) {
          restaurantNode = document.createElement( 'li' );
          restaurantNode.setAttribute( 'class', 'restaurant' );

          var restaurantLinkNode = document.createElement( 'a' );
          restaurantLinkNode.setAttribute( 'data-position', i );
          restaurantLinkNode.innerHTML = restaurants[ i ].name;
          restaurantLinkNode.addEventListener( 'click', restaurantClickHandler );

          restaurantNode.appendChild( restaurantLinkNode );
          container.appendChild( restaurantNode );
        }
      }

      return container;
    }

    var restaurantClickHandler = function () {
      var restaurant = restaurants[ this.getAttribute( 'data-position' ) ];
      onRestaurantClick( restaurant );
    };

    initialize( configuration );

    return {
      getRestaurants: getRestaurants,
      render: render,
      filter: filter
    };
  }


  function createCategory( id, name, searchKey ) {
    gMap.getPlaces( {
      radius: 5000,
      types: [ 'restaurant' ],
      name: searchKey,
      onPlacesReceived: function ( results ) {
        var category = new Category( {
          node: document.getElementById( id ),
          name: name,
          restaurants: results,
          onRestaurantClick: restaurantClickHandler
        } );
        category.render( category.getRestaurants() );
        categories.push( category );
      }
    } );
  }

  function restaurantClickHandler( restaurant ) {
    gMap.removeMarker();

    var contentNode = document.createElement( 'div' );

    if ( restaurant.photos ) {
      var photoNode = document.createElement( 'img' );
      photoNode.setAttribute( 'src', restaurant.photos[ 0 ].getUrl( {
        'maxWidth': 80,
        'maxHeight': 80
      } ) );
      photoNode.setAttribute( 'style', 'margin-right: 10px; float: left' );
      contentNode.appendChild( photoNode );
    }

    var infoNode = document.createElement( 'div' );
    infoNode.setAttribute( 'style', 'float: right;' );

    var iconNode = document.createElement( 'img' );
    iconNode.setAttribute( 'src', restaurant.icon );
    iconNode.setAttribute( 'height', '15px' );
    iconNode.setAttribute( 'style', 'float: left;' );

    var nameNode = document.createElement( 'p' );
    nameNode.setAttribute( 'style', 'margin-left: 20px; padding-bottom: 5px; font-weight: bold' );
    nameNode.innerHTML = restaurant.name;

    var addressNode = document.createElement( 'p' );
    addressNode.setAttribute( 'style', 'padding-bottom: 5px;' );
    addressNode.innerHTML = restaurant.vicinity;

    infoNode.appendChild( iconNode );
    infoNode.appendChild( nameNode );
    infoNode.appendChild( addressNode );


    if ( restaurant[ 'opening_hours' ] && restaurant[ 'opening_hours' ][ 'open_now' ] ) {
      var openNowNode = document.createElement( 'p' );
      openNowNode.setAttribute( 'style', 'font-weight: bold; color: #E20000; float: right;' );
      openNowNode.innerHTML = 'Now open!';
      infoNode.appendChild( openNowNode );
    }

    contentNode.appendChild( infoNode );
    gMap.placeMarker( restaurant, contentNode );
  }

  function bindSearchInput( searchInput ) {
    searchInput.addEventListener( 'keyup', function () {
      for ( var i = 0, l = categories.length; i < l; i++ ) {
        var filteredResults = categories[ i ].filter( 'name', this.value );
        categories[ i ].render( filteredResults );
      }
    } );
  }

  function bindEvents() {
    bindSearchInput( document.getElementById( 'search-input' ) );
  }


  var gMap,
    categories = [];

  gMap = new GMap( 34.05223, -118.24368, 12 );

  createCategory( 'japanese-restaurants', 'Japanese', 'japanese' );
  createCategory( 'korean-restaurants', 'Korean', 'korean' );
  createCategory( 'american-restaurants', 'American', 'burger' );

  bindEvents();

} )();