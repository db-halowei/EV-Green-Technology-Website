"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    calculateCosts,
    validateCalculator,
    formatMoney,
    readCookieValue
} = require("../js/ev-vs-petrol.js");

test("calculateCosts returns monthly and annual RM differences", () => {
    const result = calculateCosts({
        distance: 1500,
        evEfficiency: 15,
        electricityRate: 0.57,
        petrolEfficiency: 7,
        petrolPrice: 2.05
    });

    assert.equal(result.evMonthly, 128.25);
    assert.equal(result.petrolMonthly, 215.25);
    assert.equal(result.monthlyDifference, 87);
    assert.equal(result.annualDifference, 1044);
});

test("calculateCosts preserves a negative difference", () => {
    const result = calculateCosts({
        distance: 1000,
        evEfficiency: 25,
        electricityRate: 1,
        petrolEfficiency: 5,
        petrolPrice: 2
    });

    assert.equal(result.monthlyDifference, -150);
    assert.equal(result.annualDifference, -1800);
});

test("validateCalculator rejects missing and invalid values", () => {
    const result = validateCalculator({
        distance: "",
        evEfficiency: 0,
        electricityRate: -1,
        petrolEfficiency: "abc",
        petrolPrice: 2.05
    });

    assert.equal(result.valid, false);
    assert.deepEqual(Object.keys(result.errors).sort(), [
        "distance",
        "electricityRate",
        "evEfficiency",
        "petrolEfficiency"
    ]);
});

test("validateCalculator accepts every positive finite value", () => {
    const result = validateCalculator({
        distance: "1",
        evEfficiency: "0.1",
        electricityRate: "0.01",
        petrolEfficiency: "0.1",
        petrolPrice: "0.01"
    });

    assert.deepEqual(result, { valid: true, errors: {} });
});

test("formatMoney returns Malaysian Ringgit with two decimals", () => {
    assert.equal(formatMoney(87), "RM 87.00");
});

test("readCookieValue ignores malformed encoded cookie values", () => {
    assert.equal(readCookieValue("evisionVisitorName=%E0%A4%A", "evisionVisitorName"), "");
    assert.equal(readCookieValue("other=1; evisionVisitorName=Aina%20Lee", "evisionVisitorName"), "Aina Lee");
});
