"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    matchesFaq,
    transformWeatherResponse,
    describeWeatherCode
} = require("../js/faq.js");

test("matchesFaq combines search text and category", () => {
    const item = {
        question: "How long does charging take?",
        answer: "It depends on the charger type.",
        category: "charging"
    };

    assert.equal(matchesFaq(item, "charger", "charging"), true);
    assert.equal(matchesFaq(item, "battery warranty", "charging"), false);
    assert.equal(matchesFaq(item, "charger", "cost"), false);
});

test("matchesFaq treats all and blank search as no restriction", () => {
    const item = {
        question: "Are EVs safe in rain?",
        answer: "Yes, safety systems protect the battery.",
        category: "safety"
    };

    assert.equal(matchesFaq(item, "", "all"), true);
    assert.equal(matchesFaq(item, "  RAIN  ", "all"), true);
});

test("describeWeatherCode groups common weather conditions", () => {
    assert.equal(describeWeatherCode(0), "Clear sky");
    assert.equal(describeWeatherCode(61), "Rain");
    assert.equal(describeWeatherCode(95), "Thunderstorm");
    assert.equal(describeWeatherCode(999), "Unknown conditions");
});

test("transformWeatherResponse maps current Open-Meteo data", () => {
    const result = transformWeatherResponse({
        current: {
            temperature_2m: 31,
            apparent_temperature: 35,
            precipitation: 0.2,
            weather_code: 61,
            wind_speed_10m: 8
        }
    });

    assert.deepEqual(result, {
        temperature: 31,
        apparentTemperature: 35,
        precipitation: 0.2,
        windSpeed: 8,
        condition: "Rain"
    });
});

test("transformWeatherResponse rejects incomplete current data", () => {
    assert.throws(
        () => transformWeatherResponse({ current: { temperature_2m: 31 } }),
        /Incomplete weather data/
    );
});

test("transformWeatherResponse rejects null and blank API values", () => {
    const base = {
        temperature_2m: 31,
        apparent_temperature: 35,
        precipitation: 0,
        weather_code: 2,
        wind_speed_10m: 8
    };

    assert.throws(
        () => transformWeatherResponse({ current: { ...base, precipitation: null } }),
        /Incomplete weather data/
    );
    assert.throws(
        () => transformWeatherResponse({ current: { ...base, wind_speed_10m: "" } }),
        /Incomplete weather data/
    );
});
