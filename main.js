$(document).ready(initializeApp);

let runningTrails = [];
let currentLocation = null;
let inputFromUser = null;
let userInput = null;
let markersOnMap = [];
let map = {};
let latt = null;
let longi = null;

function initializeApp() {
    addClickHandlersToElements();
    let query = window.location.search;
    if (query.includes('lat')) {
        getCurrentLocationForDirection();
        extractLatLongFromQuery(query)
    }
}

function addClickHandlersToElements() {
    $('#runButton, #glass_button, .search_button').click(callGoogleAPI);
    /* Alert info box showing users what to input in the field */
    $('#search_input').focus(function () {
        if (!$('#search_input').val()) {
            $('.invalid').addClass('hidden');
            $('#info_msg').removeClass('hidden');
        }
    });
    $('#search_input').keypress(function () {
        $('#info_msg').addClass('hidden');
    });
    $("#search_input").on("keyup", event => {
        if (event.keyCode === 13) {
            event.preventDefault();
            $("#runButton").click(callGoogleAPI());
        }
    });
    $("#search_field").on("keyup", event => {
        /*  if enter key is released */
        if (event.keyCode === 13) {
            event.preventDefault();
            $(".search_button").click(callGoogleAPI(event)); //runs the function attaches to click event off add button
        }
    });
    $('.results_list').on('click', '.list_result', notifyTrailClicked);
    $('.results_list').on('mouseleave', '.list_result', resetNotifyTrailClicked);
    /* displaying tabs */
    $('.trails_tab').click(displayResultAfterSearch);
    $('.description_tab').click(displayDescription);
    $('.direction_tab').click(displayDirection);
    $('.weather_tab').click(displayWeather);
    $('.meetup_tab').click(displayMeetUp);
}

function callGoogleAPI() {
    removePathName();
    $('.no-result').remove();
    inputFromUser = $("#search_input").val() || $("#search_field").val();
    userInput = $("#search_input").val();
    $("#search_input").val("");
    /* if the search bar is empty, get current location */
    if (inputFromUser.length === 0) {
        getDataFromGeolocation();
        /* if user typed in a location, make a Geocoding AJAX call */
    } else {
        getLatLongFromGeocoding(inputFromUser);
        getCurrentLocationForDirection();
    }
}

function responseFromGeolocation(response) {
    runningTrails = [];
    markersOnMap = [];
    let lat = response.location.lat;
    let lng = response.location.lng;
    let center = new google.maps.LatLng(lat, lng);
    runningTrails.push(center);
    getresponseFromTrailsList(lat, lng);
    // getDataFromWeather(lat, lng);
}

function alertMsgAndRefresh() {
    $('.invalid').removeClass('hidden');
    (function () {
        var modal = document.getElementById('invalid-modal')
        var span = document.getElementsByClassName("close")[0];
        /* display modal */
        modal.style.display = "block";
        /* exit modal when click on x */
        span.onclick = function () {
            modal.style.display = "none";
        }
        /* exit modal when click anywhere outside of modal */
        window.onclick = function (event) {
            $("#search_input").val("");
            $("#search_field").val("");
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
    }())
}

/* use the lat and long from this function to call trail API */
function geocodingResponse(response) {
    if (response.status === "ZERO_RESULTS") {
        alertMsgAndRefresh();
        return;
    }
    runningTrails = [];
    markersOnMap = [];
    const latLong = response.results[0].geometry.location;
    const lat = latLong.lat.toFixed(4);
    const lng = latLong.lng.toFixed(4);
    let center = new google.maps.LatLng(lat, lng);
    runningTrails.push(center);
    getDataFromTrailsList(lat, lng);
    // getDataFromWeather(lat, lng);
}

function responseFromTrailsList(response) {
    if (response.trails.length === 0) {
        $(".results_list").empty();
        $(".map_page").removeClass("hidden");
        $(".landing_page, .map_area, .loading, .detail_container").addClass('hidden');
        let noResult = $('<div>').addClass('no-result').text(`Your search did not match any trail results. Please try a different location.`)
        $('.list_and_details').append(noResult);
        return;
    }
    const { trails } = response;
    trails.map((trail) => {
        const { latitude, longitude } = trail;
        let coordinates = new google.maps.LatLng(latitude, longitude);
        /* only include results with an image since not all results have one */
        if (trail.imgSqSmall) {
            runningTrails.push({
                image: trail.imgMedium,
                distance: `${trail.length} miles`,
                ...trail,
                coordinates: coordinates
            });
        }
    });
    let query = window.location.search;
    if (query.includes('lat')) {
        findTrailfromLatandLong(latt, longi);
        $(".loading").addClass('hidden');
        $(".map_page").removeClass('hidden');
        $(".map_area").removeClass('hidden');
        $('.nav_tabs').removeClass('hidden');
        // return;
    } else {
        displayResultAfterSearch();
        $('.nav_tabs').addClass('hidden');
    }
    $(".detail_container").removeClass('hidden');
}

function displayError(error) {
    console.log(`Error: ${error}`);
}

function displayResultAfterSearch() {
    removePathName();
    displayMapOnDom();
    if ($('.container_tabs').hasClass('zIndex')) {
        $('.container_tabs').removeClass('zIndex')
    }
    if (!$('.results_list').hasClass('zIndex')) {
        $('.results_list').addClass('zIndex')
    }
    $('.detail_container').addClass('hidden');
    $('.results_list').removeClass('hidden');
    $('.trails_tab').addClass('currentTab');
    $('#map_area').text();
    if ($('.weather_tab').hasClass('currentTab') || $('.meetup_tab').hasClass('currentTab')) {
        $('.weather_tab, .meetup_tab').removeClass('currentTab');
        return;
    }
    $('.weather_tab, .meetup_tab').removeClass('currentTab');
}

function displayResult() {
    removePathName();
    displayMapOnDom();
    if ($('.container_tabs').hasClass('zIndex')) {
        $('.container_tabs').removeClass('zIndex')
    }
    if (!$('.results_list').hasClass('zIndex')) {
        $('.results_list').addClass('zIndex')
    }
    $('.detail_container').addClass('hidden');
    $('.results_list').removeClass('hidden');
    $('.trails_tab').addClass('currentTab');
    $('#map_area').text();
    if ($('.weather_tab').hasClass('currentTab') || $('.meetup_tab').hasClass('currentTab')) {
        $('.weather_tab, .meetup_tab').removeClass('currentTab');
        return;
    }
    $('.weather_tab, .meetup_tab').removeClass('currentTab');
}

function displayDescription() {
    $('.detail_container').removeClass('hidden');
    $('#direction_container, .events, .weather_container, .meetup_container').addClass('hidden');
    $('.nav_tabs, .description').removeClass('hidden');
    $('.weather_tab, .meetup_tab, .direction_tab, .trails_tab').removeClass('currentTab');
    $('.description_tab').addClass('currentTab');
    $(".container_tabs").animate({
        scrollTop: 0
    }, "slow");
}

function displayDirection() {
    $('.description, .results_list, .weather_container, .events, .meetup_container').addClass('hidden');
    $('#direction_container').removeClass('hidden');
    $('.description_tab, .meetup_tab, .weather_tab, .trails_tab').removeClass('currentTab');
    $('.direction_tab').addClass('currentTab');
    $(".container_tabs").animate({
        scrollTop: 0
    }, "slow");
}

function displayWeather() {
    // if ($('.description_tab').hasClass('currentTab') || $('#direction_container').hasClass('currentTab')) {
    //     displayMapOnDom()
    // }
    $('#direction_container, .results_list, .events, .description, .meetup_container').addClass('hidden');
    $('.weather_container').removeClass('hidden');
    $('.description_tab, .meetup_tab, .direction_tab, .trails_tab').removeClass('currentTab');
    $('.weather_tab').addClass('currentTab');
    $(".container_tabs").animate({
        scrollTop: 0
    }, "slow");
}

function displayMeetUp() {
    // if ($('.description_tab').hasClass('currentTab') || $('#direction_container').hasClass('currentTab')) {
    //     displayMapOnDom()
    // }
    $('.events, .meetup_container').removeClass('hidden');
    $('.description, .results_list, .weather_container, #direction_container').addClass('hidden');
    $('.description_tab, .weather_tab, .direction_tab, .trails_tab').removeClass('currentTab');
    $('.meetup_tab').addClass('currentTab');
    $(".container_tabs").animate({
        scrollTop: 0
    }, "slow");
}

function notifyTrailClicked(event) {
    const data = $(event.currentTarget).data('coordinates');
    for (let i = 0; i < markersOnMap.length; i++) {
        if (markersOnMap[i].position.lat === data.lat && markersOnMap[i].position.lng === data.lng) {
            markersOnMap[i].infoWindow.open(map, markersOnMap[i]);
            markersOnMap[i].setAnimation(google.maps.Animation.BOUNCE);
        }
    }
}

function resetNotifyTrailClicked(event) {
    const data = $(event.currentTarget).data('coordinates');
    for (let i = 0; i < markersOnMap.length; i++) {
        if (markersOnMap[i].position.lat === data.lat && markersOnMap[i].position.lng === data.lng) {
            markersOnMap[i].infoWindow.close(map, markersOnMap[i]);
            markersOnMap[i].setAnimation(null);
        }
    }
}

function goBackToLandingPage() {
    $(".map_page, .map_area").addClass("hidden");
    $(".landing_page").removeClass("hidden");
    $('.meetup_container').empty();
    runningTrails = [];
    currentLocation = null;
    inputFromUser = null;
    userInput = null;
    markersOnMap = [];
    map = {};
    latt = null;
    longi = null;
}

function extractLatLongFromQuery(query) {
    let latAndLong = query.split("?lat=")[1].split("?long=");
    latAndLong = latAndLong.map(x => parseFloat(x));
    latt = latAndLong[0];
    longi = latAndLong[1];
    getDataFromTrailsList(longi, latt);
}

function findTrailfromLatandLong(long, lat) {
    for (i = 0; i < runningTrails.length; i++) {
        if (runningTrails[i].latitude === lat && runningTrails[i].longitude === long) {
            return displayTrailDescription(runningTrails[i]);
        }
    }
}

function removePathName() {
    var pathName = document.location.pathname;;
    window.history.pushState({}, document.title, pathName);
}