import { school, cities } from "./data.js";
import { geo_location, geoloc } from "./carousel.js";

"use strict";

var found = false;

var tooltip = document.querySelector(".tooltip");
var icon_section = document.querySelector("#sub-section-links");
var searching_results = document.querySelector("#searching-links");
var inputField = document.querySelector(".searchText");
var user_typing = "";

var ip_location = new Array();
var city = new Array();

setTimeout(function precision() {
    if (geoloc) {
        var zip = geo_location[1];
        $.getJSON("https://ziptasticapi.com/" + zip, function(data) {
            city.push(geo_location[2] + ", " + data.state);
            geo_location.splice(4, 4, data.state);
        })

    } else {
        $.getJSON("https://api.ipify.org?format=json", function(data) {
            ip_location.push(data.ip);
            $.getJSON("https://ipapi.co/" + data.ip + "/json/", function(response) {
                city = response.city + ", " + response.region_code;
                ip_location.push(city);
            })
        })
    }

    // console.log(city);
    // console.log("GEO: ", geo_location);
    // console.log("IP: ", ip_location);
}, 7000);

/**
 * Removes placeholder text on focus state
 */
$(inputField).focus(function() {
    inputField.placeholder = '';
    if (user_typing.length > 3) {
        inputField.value = user_typing;
    } else {
        user_typing = "";
        inputField.value = city[0];
        initalSearch(city[0]);
    }

}).focusout(function() {
    inputField.value = "";
    inputField.placeholder = 'Search Cities, Addresses, Schools, School Districts, Zip Codes';
    reset();
    searching_results.classList.add("d-none");
});

/**
 * Trims "school district" from input
 */
inputField.onkeyup = function() {
    user_typing = inputField.value.toLowerCase().trim();
    if (user_typing.includes("school district")) {
        user_typing = user_typing.replace("school district", "");
        user_typing = user_typing.trim();
    } else if (user_typing.includes(",")) {
        let temp = user_typing.split(",");
        user_typing = temp[0];
        user_typing = user_typing.trim();
    }
};

// Prevents form submission for debugging purposes
var form = document.getElementById("search-form");
var submitBtn = document.querySelector(".main-button");

var data_found = [
    ["City", "School", "District"]
];

function handleForm(evt) {
    evt.preventDefault();
}
form.addEventListener("submit", handleForm);
form.addEventListener("keydown", runSearches, true);
submitBtn.addEventListener("click", runSearches, true);

function runSearches(e) {
    data_found = [
        ["City", "School", "District"]
    ];
    removeAllChildNodes(searching_results);

    if (e.which == 8 && inputField.value == city[0]) {
        reset();
        inputField.value = "";
    }

    if (user_typing.length <= 1 || found == false || icon_section.classList.contains("d-none") == false) {
        searching_results.classList.add("d-none");
    }

    tooltip.classList.remove("show");
    if (window.event) {
        if (user_typing.length <= 1) {
            searching_results.classList.add("d-none");
        } else if (user_typing.length > 0) {
            reset();

            searchCity(user_typing);
            searchSchoolData(user_typing);
            console.log(user_typing);
            console.log(inputField.value.length);
            // console.log(data_found);

            for (let i = 1; i < data_found.length; i++) {
                // User searching
                populateSearchResults(data_found[i]);
                searching_results.classList.remove("d-none");
            }
            if (e.which == 8) {
                reset();
            }

            if (e.which == 13 || e.which == 1) {
                // User submitted intentionally

                if (data_found.length > 1) {
                    for (let i = 1; i < data_found[1].length; i++) {
                        if (data_found[1][i].toLowerCase().includes(user_typing)) {
                            // need to pull info from that city for icon_section
                            searching_results.classList.add("d-none");
                            icon_section.classList.remove("d-none");
                            console.log("found");
                        }
                        found = false;
                    }
                }
            }
        }
    }
}

function reset() {
    icon_section.classList.add("d-none");
}

function initalSearch(input) {
    console.log(input);

    removeAllChildNodes(searching_results);
    searching_results.classList.add("d-none");

    searchCity(input);

    icon_section.classList.remove("d-none");
}

function searchCity(input) {
    var found_cities = [];
    for (let i = 0; i < cities.length; i++) {
        if (cities[i][0].toLowerCase().startsWith(input)) {
            found_cities.push(cities[i][0]);
            found = true;
        }
    }
    if (found == true) {
        data_found.push(uniq(found_cities));
    }
}

function searchSchoolData(input) {
    var found_districts = [];
    var found_schools = [];
    for (let i = 1; i < school.length; i++) {
        if (school[i][5].toLowerCase().startsWith(input) || school[i][6].toLowerCase().startsWith(input)) {
            found = true;
            if (school[i][6].toLowerCase().startsWith(input)) {
                found_schools.push(school[i][6]);
            } else if (school[i][5].toLowerCase().startsWith(input)) {
                found_districts.push(school[i][5]);
            }
        }
    }
    if (found == true) {
        data_found.push(uniq(found_schools));
        data_found.push(uniq(found_districts));
    }
}

/**
 * Returns an array of only unique values
 * @param {*} a 
 */
function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    });
}

/**
 * Creates the display of results
 * @param {*} data_array 
 */
function populateSearchResults(data_array) {
    let max = 5;
    let header = document.createElement("div");
    header.classList.add("search-header");
    let icon = document.createElement("i");
    let header_label = document.createElement("span");
    if (data_array == data_found[1]) {
        icon.classList.add("bi-house");
        header_label.innerHTML = "City";
    } else if (data_array == data_found[2]) {
        icon.classList.add("bi-bell");
        header_label.innerHTML = "Schools";
    } else {
        icon.classList.add("bi-building");
        header_label.innerHTML = "School Districts";
    }
    header.appendChild(icon);
    header.appendChild(header_label);
    let list = document.createElement("ul");
    list.classList.add("result");
    list.classList.add("p-1");
    list.classList.add("m-0");
    list.classList.add("text-start");
    list.classList.add("list-unstyled");

    /**
     * Limits the display to 5 per category
     */
    if (data_array.length < 5) {
        max = data_array.length;
    }

    for (let i = 0; i < max; i++) {
        let list_element = document.createElement("li");
        let link = document.createElement("a");
        link.classList.add("text-decoration-none");
        link.classList.add("text-black");
        link.innerHTML = data_array[i];
        let hyperlink = document.createAttribute("href");
        hyperlink.value = "#";
        link.setAttributeNode(hyperlink);
        list_element.appendChild(link);
        list.appendChild(list_element);
    }

    searching_results.appendChild(header);
    searching_results.appendChild(list);
}

/**
 * Prevents results from appending onto previous results
 * @param {*} parent 
 */
function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

export { ip_location };