"use strict";

function matchesFaq(item, search, category) {
    const keyword = String(search || "").trim().toLowerCase();
    const selectedCategory = String(category || "all").toLowerCase();
    const text = (item.question + " " + item.answer).toLowerCase();
    const keywordMatches = !keyword || text.includes(keyword);
    const categoryMatches = selectedCategory === "all" ||
        item.category.toLowerCase() === selectedCategory;

    return keywordMatches && categoryMatches;
}

function describeWeatherCode(code) {
    if (code === 0) {
        return "Clear sky";
    }
    if ([1, 2, 3].includes(code)) {
        return "Cloudy";
    }
    if ([45, 48].includes(code)) {
        return "Fog";
    }
    if ([51, 53, 55, 56, 57].includes(code)) {
        return "Drizzle";
    }
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return "Rain";
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "Snow";
    }
    if ([95, 96, 99].includes(code)) {
        return "Thunderstorm";
    }
    return "Unknown conditions";
}

function transformWeatherResponse(data) {
    const current = data && data.current;
    const required = [
        "temperature_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "wind_speed_10m"
    ];

    if (!current || required.some(function (key) {
        const value = current[key];
        return value === null || value === undefined ||
            (typeof value === "string" && value.trim() === "") ||
            !Number.isFinite(Number(value));
    })) {
        throw new Error("Incomplete weather data");
    }

    return {
        temperature: Number(current.temperature_2m),
        apparentTemperature: Number(current.apparent_temperature),
        precipitation: Number(current.precipitation),
        windSpeed: Number(current.wind_speed_10m),
        condition: describeWeatherCode(Number(current.weather_code))
    };
}

function initialiseFaqPage($) {
    const $items = $(".faq-item");

    if (!$items.length) {
        return;
    }

    let selectedCategory = "all";
    let weatherRequest = null;

    function filterFaqs() {
        const search = $("#faqSearch").val();
        let visibleCount = 0;

        $items.each(function () {
            const $item = $(this);
            const item = {
                question: $item.find(".accordion-button").text().trim(),
                answer: $item.find(".faq-answer").text().trim(),
                category: $item.data("category")
            };
            const visible = matchesFaq(item, search, selectedCategory);

            $item.toggle(visible);
            if (visible) {
                visibleCount += 1;
            }
        });

        $("#faqResultCount").text(visibleCount + " of " + $items.length + " questions shown");
        $("#faqEmptyState").toggleClass("d-none", visibleCount !== 0);
    }

    $("#faqSearch").on("input", filterFaqs);

    $(".category-filter").on("click", function () {
        selectedCategory = $(this).data("category");
        $(".category-filter")
            .removeClass("is-selected")
            .attr("aria-pressed", "false");
        $(this)
            .addClass("is-selected")
            .attr("aria-pressed", "true");
        filterFaqs();
    });

    function showWeatherError() {
        $("#weatherLoading, #weatherContent").addClass("d-none");
        $("#weatherError").removeClass("d-none");
        $("#weatherStatus").text("The REST API request failed. You can retry it.");
    }

    function loadWeather() {
        if (weatherRequest) {
            weatherRequest.abort();
        }

        $("#weatherContent, #weatherError").addClass("d-none");
        $("#weatherLoading").removeClass("d-none");
        $("#retryWeather").prop("disabled", true);
        $("#weatherStatus").text("Requesting current weather from Open-Meteo...");

        const request = $.ajax({
            url: "https://api.open-meteo.com/v1/forecast",
            method: "GET",
            dataType: "json",
            timeout: 10000,
            data: {
                latitude: 3.139,
                longitude: 101.6869,
                current: "temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m",
                timezone: "Asia/Kuala_Lumpur"
            }
        });
        weatherRequest = request;

        request.done(function (data) {
            try {
                const weather = transformWeatherResponse(data);

                $("#weatherCondition").text(weather.condition);
                $("#weatherTemperature").text(weather.temperature.toFixed(1) + "°C");
                $("#weatherFeelsLike").text(weather.apparentTemperature.toFixed(1) + "°C");
                $("#weatherPrecipitation").text(weather.precipitation.toFixed(1) + " mm");
                $("#weatherWind").text(weather.windSpeed.toFixed(1) + " km/h");
                $("#weatherLoading, #weatherError").addClass("d-none");
                $("#weatherContent").removeClass("d-none");
                $("#weatherStatus").text("Current Kuala Lumpur weather loaded successfully.");
            } catch (error) {
                showWeatherError();
            }
        }).fail(function (jqXHR, textStatus) {
            if (textStatus !== "abort") {
                showWeatherError();
            }
        }).always(function () {
            if (weatherRequest === request) {
                weatherRequest = null;
                $("#retryWeather").prop("disabled", false);
            }
        });
    }

    $("#retryWeather").on("click", loadWeather);
    filterFaqs();
    loadWeather();
}

if (typeof window !== "undefined" && window.jQuery) {
    window.jQuery(function () {
        initialiseFaqPage(window.jQuery);
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        matchesFaq,
        transformWeatherResponse,
        describeWeatherCode
    };
}
