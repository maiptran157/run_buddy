function displayMapOnDom() {
    $(".landing_page").addClass("hidden");
    if (typeof runningTrails[0].coordinates === "object") {
        runningTrails.unshift(currentLocation);
    }
    /* Map options */
    if ($(window).width() <= 480) {
        var options = {
            zoom: 8,
            center: runningTrails[1].coordinates,
        }
    } else {
        var options = {
            zoom: 9,
            center: runningTrails[1].coordinates,
        }
    }

    /* New map */
    map = new google.maps.Map(document.getElementById("map_area"), options);
    /* Add marker */

    for (var trailIndex = 1; trailIndex < runningTrails.length; trailIndex++) {
        let marker = new google.maps.Marker({
            position: runningTrails[trailIndex].coordinates,
            map: map,
            animation: google.maps.Animation.DROP,
            icon: "images/run_buddy_marker2.png"
        });
        let contentString = "<h3>" + runningTrails[trailIndex].name + "</h3>";
        let infoWindow = new google.maps.InfoWindow({
            content: contentString
        })

        marker["infoWindow"] = infoWindow;

        marker.addListener('mouseover', () => {
            infoWindow.open(map, marker);
            marker.setAnimation(google.maps.Animation.BOUNCE);
        })

        marker.addListener('mouseout', () => {
            infoWindow.close(map, marker);
            marker.setAnimation(null);
        })

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
            for (let i = 1; i < runningTrails.length; i++) {
                if (runningTrails[i].coordinates.lat === marker.position.lat && runningTrails[i].coordinates.lng === marker.position.lng) {
                    trailToReplaceAtIndexOne = runningTrails[i];
                    runningTrails.splice(i, 1);
                    runningTrails.splice(1, 0, trailToReplaceAtIndexOne);
                    $(".list_result").remove();
                    renderTrailInfoOnDom(true);
                }
            }
            if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
            } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function () { marker.setAnimation(null); }, 1000);
                setTimeout(function () { infoWindow.close(); }, 1000);
            }
        });
        markersOnMap.push(marker);
    }
    renderTrailInfoOnDom();
}

function renderTrailInfoOnDom(markerIsClicked = false) {
    $(".map_page, .map_area").removeClass("hidden");
    $('.map_page_logo').click(goBackToLandingPage);
    if (!$(".results_list").hasClass('zIndex')) {
        $(".results_list").addClass('zIndex')
    }
    $(".results_list").empty();
    if ($('.list_result').length > 0) {
        $(".list_result").remove();
    }
    for (let i = 1; i < runningTrails.length; i++) {
        let listResultsDiv = $('<div>').addClass('list_result').data('coordinates', runningTrails[i].coordinates);
        if (markerIsClicked && i === 1) {
            listResultsDiv.addClass('selected')
        }
        let imageOfPlace = $('<img>').attr('src', runningTrails[i].image).addClass('locationPicture');
        let locationDescriptionDiv = $('<div>').addClass('locationDescription');
        let nameOfPlace = $('<p>').text(runningTrails[i].name);
        const location = $('<div>').addClass('address').text(`${runningTrails[i].location}`);
        const rating = $('<div>').text(`${runningTrails[i].stars} out of 5 stars`);
        let moreInfoButton = $('<button>').addClass('btn btn-blue').text('Trail Info');
        moreInfoButton.on('click', () => displayTrailDescription(runningTrails[i]));
        locationDescriptionDiv.append(nameOfPlace, location, rating, moreInfoButton);
        listResultsDiv.append(imageOfPlace, locationDescriptionDiv);
        $('.results_list').append(listResultsDiv);
    }
    $('.results_list').animate({ scrollTop: 0 }, 1000);
    $('.loading').addClass('hidden');
}

function displayTrailDescription(trail) {
    history.pushState({ trail: trail.name }, "title", `?lat=${trail.longitude}?long=${trail.latitude}`);
    if (!$('.container_tabs').hasClass('zIndex')) {
        $('.container_tabs').addClass('zIndex')
    }
    $('.description_container').empty();
    $('.trails_tab').removeClass('hidden');
    $('.single_location_detail').removeClass('hidden');
    if ($('.results_list').hasClass('zIndex')) {
        $('.results_list').removeClass('zIndex')
    }
    $('.results_list').addClass('hidden');
    displayDescription();
    getDataFromWeather(parseFloat(trail.latitude), parseFloat(trail.longitude));
    const trailLat = trail.latitude;
    const trailLong = trail.longitude;
    getDataFromMeetUp(trailLat, trailLong, trail.name);
    const imageOfPlace = $('<img>').attr('src', trail.imgMedium);
    const nameOfPlace = $('<p>').addClass('trailName').text(trail.name);
    const location = $('<div>').html(`<b>Location :</b> ${trail.location}`);
    const distance = $('<div>').html(`<b>Length :</b> ${trail.distance}`);
    const rating = $('<div>').html(`<b>Rating :</b> ${trail.stars} out of 5 stars from ${trail.starVotes} reviews<br><br>`);
    const summary = $('<div>').addClass('trail_summary').html(`<b>Overview :</b> ${trail.summary}`);
    const conditionStatus = $('<div>').addClass('condition_status').html(`<b>Status :</b> ${trail.conditionStatus}`);
    const conditionDetails = $('<div>').addClass('condition_details').html(`<b>Condition :</b> ${trail.conditionDetails || 'Currently, there is no condtition information for this trail.'}`);
    const ascent = $('<div>').addClass('ascent').html(`<b>Ascent :</b> ${trail.ascent} feet`);
    const descent = $('<div>').addClass('descent').html(`<b>Descent :</b> ${trail.descent} feet<br><br>`);
    const pointBCoordinates = trail.coordinates;
    const descriptionDiv = $('<div>').addClass('description');
    const moreInfo = $('<div>').html(`<br><a target="_blank" href="${trail.url}">More info on ${trail.name}</a>`);
    descriptionDiv.append(imageOfPlace, nameOfPlace, location, rating, distance, ascent, descent, conditionStatus, conditionDetails, summary, moreInfo);
    $('.description_container').append(descriptionDiv);
    displayDirectionLineOnMap(pointBCoordinates);
    $("html, body").animate({
        scrollTop: 0
    }, "slow");
}

function displayDirectionLineOnMap(pointBCoordinates) {
    $("#map_area").text();

    var pointA = currentLocation,
        pointB = pointBCoordinates,
        myOptions = {
            zoom: 14,
            center: pointA
        },
        map = new google.maps.Map(document.getElementById('map_area'), myOptions),
        // Instantiate a directions service.
        directionsService = new google.maps.DirectionsService,
        directionsDisplay = new google.maps.DirectionsRenderer({ //find me a direction
            map: map
        })

    /* get route from A to B */
    calculateAndDisplayRoute(directionsService, directionsDisplay, pointA, pointB);
}

function calculateAndDisplayRoute(directionsService, directionsDisplay, pointA, pointB) {
    if (!pointA) {
        pointA = currentLocation;
    }
    directionsService.route({
        origin: pointA,
        destination: pointB,
        /* travelMode: google.maps.TravelMode.DRIVING */
        travelMode: 'DRIVING'
    },
        function (response, status) {
            /* success function */
            if (status == "OK") {
                directionsDisplay.setDirections(response);
                var result = document.getElementById('direction_container');
                result.innerHTML = "";
                let newTr1 = document.createElement("tr");
                newTr1.innerHTML = `<b>Distance :</b> ${response.routes[0].legs[0].distance.text}.  <b>Duration:</b> ${response.routes[0].legs[0].duration.text}.<br><br>`;

                let newTr2 = document.createElement("tr");
                newTr2.innerHTML = `<b>Start location :</b> ${response.routes[0].legs[0].start_address}<br><br>`;

                let newTr4 = document.createElement("tr");
                newTr4.innerHTML = `<b>Destination :</b> ${response.routes[0].legs[0].end_address}<br><br>`;
                result.appendChild(newTr1);
                result.appendChild(newTr2);
                result.appendChild(newTr4);
                for (var i = 0; i < response.routes[0].legs[0].steps.length; i++) {
                    let newTr3 = document.createElement("tr"); //new table row
                    let td2 = document.createElement("td");
                    td2.innerHTML = `${i + 1}. ${response.routes[0].legs[0].steps[i].instructions}`;
                    let td3 = document.createElement("td");
                    td3.innerHTML = `  ${response.routes[0].legs[0].steps[i].distance.text}`;
                    newTr3.appendChild(td2);
                    newTr3.appendChild(td3);
                    result.appendChild(newTr3);
                }
                /* Direction error function */
            } else {
                displayMapForNoAvailableDirection(pointB);
                var result = document.getElementById('direction_container');
                result.innerText = "Oops. There is no direct route to this trail from your location. Please try another trail.";
            }
        }
    );

}

function displayMapForNoAvailableDirection(pointB) {
    const options = {
        zoom: 10,
        center: pointB,
    }
    /* New map */
    map = new google.maps.Map(document.getElementById("map_area"), options);
    /* Add marker */
    let marker = new google.maps.Marker({
        position: pointB,
        map: map,
        animation: google.maps.Animation.DROP,
        icon: "images/run_buddy_marker2.png"
    });
}

function displayWeatherSuccess(responseFromServer) {
    let weather = {
        condition: responseFromServer.weather[0]['main'],
        cityName: responseFromServer.name,
        conditionDescription: responseFromServer.weather[0]['description'],
        iconId: responseFromServer.weather[0]['icon'],
        /* convert temperature in Kelvin to Fahrenheit */
        tempMinInF: (responseFromServer.main['temp_min'] * 9 / 5 - 459.67).toFixed(1),
        tempMaxInF: (responseFromServer.main['temp_max'] * 9 / 5 - 459.67).toFixed(1),
        currentTempInF: (responseFromServer.main['temp'] * 9 / 5 - 459.67).toFixed(1),
        sunriseTime: (responseFromServer.sys['sunrise']),
        sunsetTime: (responseFromServer.sys['sunset']),
        humidity: responseFromServer.main['humidity'],
        wind: responseFromServer.wind['speed'],
        clouds: responseFromServer.clouds['all'],
    };
    renderWeatherOnDom(weather);
}

function renderWeatherOnDom(weather) {
    if ($('.weather_list').length > 0) {
        $('.weather_list').remove();
    }
    let imgSrc = `http://openweathermap.org/img/w/${weather.iconId}.png`;
    let weatherImage = $('<img class="weather_icon">').attr({
        "src": imgSrc,
        "alt": weather.condition
    });
    let today = new Date();
    let dateToday = today.toDateString();
    let timeNow = today.toLocaleTimeString();
    let currentInC = ((weather.currentTempInF - 32) * 5 / 9).toFixed(1);
    let highInC = ((weather.tempMaxInF - 32) * 5 / 9).toFixed(1);
    let lowInC = ((weather.tempMinInF - 32) * 5 / 9).toFixed(1);
    let headline = $('<div>').append(`${weather.cityName}`);
    let line0 = $('<li>').append(`<i>As of ${dateToday} ${timeNow}</i>`);
    let line1 = $('<li>').append(weatherImage, (weather.conditionDescription).toUpperCase());
    let line2 = $('<li>').append(`<b>Current Temperature :</b> ${weather.currentTempInF} <b>°F</b>&nbsp; (${currentInC} <b>°C</b>) `);
    let line3 = $('<li>').append(`<b>High :</b> ${weather.tempMaxInF} <b>°F</b>&nbsp; (${highInC} <b>°C</b>)`);
    let line4 = $('<li>').append(`<b>Low :</b> ${weather.tempMinInF} <b>°F</b>&nbsp; (${lowInC} <b>°C</b>)`);
    let line5 = $('<li>').append(`<b>Humidity :</b> ${weather.humidity} <b>%</b>`);
    let line6 = $('<li>').append(`<b>Wind :</b> ${weather.wind} <b>m/s</b>`);
    let line7 = $('<li>').append(`<b>Cloudiness :</b> ${weather.clouds} <b>%</b>`);

    let weatherList = $('<ul>').addClass('weather_list');
    weatherList.append(headline, line0, line1, line2, line3, line4, line5, line6, line7);
    $('.weather_container').append(weatherList);
}

// function displayForecastSuccess(responseFromServer) {
//     let forecast = {
//         day1: responseFromServer.list[0].dt_txt,
//         day1Cond: responseFromServer.list[0].weather[0].description,
//         day1High: (responseFromServer.list[0].main.temp_max * 9 / 5 - 459.67).toFixed(1),
//         day1Low: (responseFromServer.list[0].main.temp_min * 9 / 5 - 459.67).toFixed(1),

//         day2: responseFromServer.list[10].dt_txt,
//         day2Cond: responseFromServer.list[10].weather[0].description,
//         day2High: (responseFromServer.list[10].main.temp_max * 9 / 5 - 459.67).toFixed(1),
//         day2Low: (responseFromServer.list[10].main.temp_min * 9 / 5 - 459.67).toFixed(1),

//         day3: responseFromServer.list[18].dt_txt,
//         day3Cond: responseFromServer.list[18].weather[0].description,
//         day3High: (responseFromServer.list[18].main.temp_max * 9 / 5 - 459.67).toFixed(1),
//         day3Low: (responseFromServer.list[18].main.temp_min * 9 / 5 - 459.67).toFixed(1),

//         day4: responseFromServer.list[28].dt_txt,
//         day4Cond: responseFromServer.list[28].weather[0].description,
//         day4High: (responseFromServer.list[28].main.temp_max * 9 / 5 - 459.67).toFixed(1),
//         day4Low: (responseFromServer.list[28].main.temp_min * 9 / 5 - 459.67).toFixed(1),

//         day5: responseFromServer.list[36].dt_txt,
//         day5Cond: responseFromServer.list[37].weather[0].description,
//         day5High: (responseFromServer.list[37].main.temp_max * 9 / 5 - 459.67).toFixed(1),
//         day5Low: (responseFromServer.list[37].main.temp_min * 9 / 5 - 459.67).toFixed(1),

//     };
//     renderForecastOnDom(forecast);
// }

// function renderForecastOnDom(forecast) {
//     let monthList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

//     let monStr1 = monthList[((forecast.day1).slice(5, 7)) - 1];
//     let dayStr1 = ((forecast.day1).slice(8, 10));

//     let monStr2 = monthList[((forecast.day2).slice(5, 7)) - 1];
//     let dayStr2 = ((forecast.day2).slice(8, 10));

//     let monStr3 = monthList[((forecast.day3).slice(5, 7)) - 1];
//     let dayStr3 = ((forecast.day3).slice(8, 10));

//     let monStr4 = monthList[((forecast.day4).slice(5, 7)) - 1];
//     let dayStr4 = ((forecast.day4).slice(8, 10));

//     let monStr5 = monthList[((forecast.day5).slice(5, 7)) - 1];
//     let dayStr5 = ((forecast.day5).slice(8, 10));

//     let headline = `<b>5 Days Forecast :</b>`;
//     let forecastTable1 = $('<tr>').append(`<td>${monStr1} ${dayStr1} : ${forecast.day1Cond} 
//         with High ${forecast.day1High} <b>°F</b> | Low ${forecast.day1Low} <b>°F</b></td>`);

//     let forecastTable2 = $('<tr>').append(`<td>${monStr2} ${dayStr2} : ${forecast.day2Cond}
//         with High ${forecast.day2High} <b>°F</b> | Low ${forecast.day2Low} <b>°F</b></td>`);

//     let forecastTable3 = $('<tr>').append(`<td>${monStr3} ${dayStr3} : ${forecast.day3Cond}        
//         with High ${forecast.day3High} <b>°F</b> | Low ${forecast.day3Low} <b>°F</b></td>`);

//     let forecastTable4 = $('<tr>').append(`<td>${monStr4} ${dayStr4} : ${forecast.day4Cond}
//         with High ${forecast.day4High} <b>°F</b> | Low ${forecast.day4Low} <b>°F</b></td>`);

//     let forecastTable5 = $('<tr>').append(`<td>${monStr5} ${dayStr5} : ${forecast.day5Cond}
//         with High ${forecast.day5High} <b>°F</b> | Low ${forecast.day5Low} <b>°F</b></td>`);

//     let forecastList = $('<table>').addClass('weather_list');
//     // forecastList.append(headline, forecastTable1, forecastTable2, forecastTable3, forecastTable4, forecastTable5);
//     // $('.weather_container').append(forecastList);
// }


function displayMeetUpSuccess(response, trailName) {
    $('.meetup_container').empty();
    if ($('.events').length > 0) {
        $(".events").remove();
    }
    if (response.code === "blocked" || response.meta.count === 0) {
        const meetupDiv = $('<div>', {
            class: `events hidden`,
            html: '<h2>Currently, there are no upcoming meetups near this location.'
        });
        $('.meetup_container').append(meetupDiv);
        return;
    }
    const meetUpResponse = response.results;
    const filteredMeetUpResults = [];
    let message = null;
    if ($('.meetup_result_message').length) {
        $('.meetup_result_message').remove()
    }
    message = $('<div>').addClass('meetup_result_message').text(`Events near ${trailName}:`)
    const message_container = $('<div>').addClass('message_container');
    message_container.append(message)
    $('.meetup_container').append(message_container);
    for (let m = 0; m < meetUpResponse.length; m++) {
        let { description, name, event_url, time, group, yes_rsvp_count } = meetUpResponse[m];
        const formattedInfo = { description, eventName: name, link: event_url, time, group, yes_rsvp_count }
        formattedInfo.time = Date(parseInt(formattedInfo.time))
        filteredMeetUpResults.push(formattedInfo);
    }
    renderMeetUpOnDom(filteredMeetUpResults)
}

function renderMeetUpOnDom(meetup) {
    for (let m = 0; m < meetup.length; m++) {
        const groupName = $('<p>', {
            class: 'groupName',
            text: meetup[m].group.name.toUpperCase()
        })
        const members = $('<div>', {
            class: 'rsvp',
            text: `${meetup[m].yes_rsvp_count} ${meetup[m].group.who} going`
        })
        const eventName = $('<a>', {
            class: 'rsvp',
            text: meetup[m].eventName,
            href: meetup[m].link,
            title: 'Meetup.com Link',
            target: '_blank'
        })
        const meetUp = $('.meetup_container');
        let meetupDiv = $('<div>').addClass(`meetUp events hidden`);
        meetupDiv = $(meetupDiv).append(groupName, eventName, members)
        $(meetUp).append(meetupDiv);
    }
}
