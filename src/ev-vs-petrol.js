"use strict";

/**
 * Calculate estimated monthly running costs for an EV and petrol car.
 */
function calculateCosts(values) {
    const roundMoney = function (number) {
        return Math.round((number + Number.EPSILON) * 100) / 100;
    };
    const evMonthly = roundMoney(values.distance / 100 *
        values.evEfficiency * values.electricityRate);
    const petrolMonthly = roundMoney(values.distance / 100 *
        values.petrolEfficiency * values.petrolPrice);
    const monthlyDifference = roundMoney(petrolMonthly - evMonthly);

    return {
        evMonthly,
        petrolMonthly,
        monthlyDifference,
        annualDifference: roundMoney(monthlyDifference * 12)
    };
}

/**
 * Every calculator field must contain a positive, finite number.
 */
function validateCalculator(values) {
    const errors = {};

    Object.entries(values).forEach(function ([name, value]) {
        const number = Number(value);

        if (value === "" || !Number.isFinite(number) || number <= 0) {
            errors[name] = "Enter a number greater than 0.";
        }
    });

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
}

function formatMoney(value) {
    return "RM " + Number(value).toFixed(2);
}

const COOKIE_NAME = "evisionVisitorName";
const LOCAL_KEY = "evisionLatestCalculation";
const SESSION_KEY = "evisionCalculatorDraft";

function setCookie(name, value, days) {
    const seconds = days * 24 * 60 * 60;
    document.cookie = name + "=" + encodeURIComponent(value) +
        "; max-age=" + seconds + "; path=/; SameSite=Lax";
}

function readCookieValue(cookieString, name) {
    const prefix = name + "=";
    const cookie = String(cookieString || "").split(";").map(function (item) {
        return item.trim();
    }).find(function (item) {
        return item.startsWith(prefix);
    });

    if (!cookie) {
        return "";
    }

    try {
        return decodeURIComponent(cookie.substring(prefix.length));
    } catch (error) {
        return "";
    }
}

function getCookie(name) {
    return readCookieValue(document.cookie, name);
}

function safeRead(storage, key) {
    try {
        const value = storage.getItem(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        return null;
    }
}

function safeWrite(storage, key, value) {
    try {
        storage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        return false;
    }
}

function safeRemove(storage, key) {
    try {
        storage.removeItem(key);
    } catch (error) {
        // Storage can be blocked by browser privacy settings.
    }
}

function initialiseComparisonPage() {
    const form = document.getElementById("comparisonForm");

    if (!form) {
        return;
    }

    const fieldNames = [
        "distance",
        "evEfficiency",
        "electricityRate",
        "petrolEfficiency",
        "petrolPrice"
    ];
    const resultPanel = document.getElementById("calculationResult");
    const calculatorStatus = document.getElementById("calculatorStatus");
    const draftStatus = document.getElementById("draftStatus");
    const storageStatus = document.getElementById("storageStatus");

    function getRawValues() {
        const values = {};
        fieldNames.forEach(function (name) {
            values[name] = document.getElementById(name).value;
        });
        return values;
    }

    function fillValues(values) {
        fieldNames.forEach(function (name) {
            if (values && Object.prototype.hasOwnProperty.call(values, name)) {
                document.getElementById(name).value = values[name];
            }
        });
    }

    function clearValidation() {
        fieldNames.forEach(function (name) {
            const field = document.getElementById(name);
            field.classList.remove("is-invalid");
            field.removeAttribute("aria-invalid");
        });
        calculatorStatus.textContent = "";
    }

    function showValidation(errors) {
        clearValidation();
        Object.keys(errors).forEach(function (name) {
            const field = document.getElementById(name);
            field.classList.add("is-invalid");
            field.setAttribute("aria-invalid", "true");
        });
        calculatorStatus.textContent = "Please correct the highlighted fields.";
    }

    function renderResult(result) {
        const saving = result.monthlyDifference >= 0;
        document.getElementById("evMonthlyResult").textContent = formatMoney(result.evMonthly);
        document.getElementById("petrolMonthlyResult").textContent = formatMoney(result.petrolMonthly);
        document.getElementById("monthlyDifferenceLabel").textContent = saving ?
            "Monthly savings" : "EV costs more monthly";
        document.getElementById("annualDifferenceLabel").textContent = saving ?
            "Annual savings" : "EV costs more annually";
        document.getElementById("monthlyDifferenceResult").textContent =
            formatMoney(Math.abs(result.monthlyDifference));
        document.getElementById("annualDifferenceResult").textContent =
            formatMoney(Math.abs(result.annualDifference));
        resultPanel.classList.remove("d-none");
    }

    function restoreSavedState() {
        const latest = safeRead(localStorage, LOCAL_KEY);
        const draft = safeRead(sessionStorage, SESSION_KEY);

        if (latest && latest.values) {
            const validation = validateCalculator(latest.values);
            if (validation.valid) {
                fillValues(latest.values);
                renderResult(calculateCosts(latest.values));
                storageStatus.textContent = "Latest saved calculation restored from Local Storage.";
            }
        }

        if (draft) {
            fillValues(draft);
            resultPanel.classList.add("d-none");
            draftStatus.textContent = "Unfinished inputs restored from Session Storage.";
        }
    }

    fieldNames.forEach(function (name) {
        document.getElementById(name).addEventListener("input", function () {
            safeWrite(sessionStorage, SESSION_KEY, getRawValues());
            draftStatus.textContent = "Draft saved for this browser session.";
            resultPanel.classList.add("d-none");
            this.classList.remove("is-invalid");
            this.removeAttribute("aria-invalid");
        });
    });

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const rawValues = getRawValues();
        const validation = validateCalculator(rawValues);

        if (!validation.valid) {
            showValidation(validation.errors);
            return;
        }

        clearValidation();
        const values = {};
        fieldNames.forEach(function (name) {
            values[name] = Number(rawValues[name]);
        });
        const result = calculateCosts(values);

        renderResult(result);
        safeWrite(localStorage, LOCAL_KEY, {
            values,
            savedAt: new Date().toISOString()
        });
        safeRemove(sessionStorage, SESSION_KEY);
        draftStatus.textContent = "Completed calculation saved in Local Storage.";
        storageStatus.textContent = "This result will be restored after you refresh or reopen the page.";
    });

    document.getElementById("resetCalculator").addEventListener("click", function () {
        form.reset();
        clearValidation();
        resultPanel.classList.add("d-none");
        safeRemove(localStorage, LOCAL_KEY);
        safeRemove(sessionStorage, SESSION_KEY);
        draftStatus.textContent = "Calculator and saved calculation cleared.";
    });

    const visitorMessage = document.getElementById("visitorMessage");
    const visitorInput = document.getElementById("visitorName");
    const cookieStatus = document.getElementById("cookieStatus");
    const savedName = getCookie(COOKIE_NAME);

    if (savedName) {
        visitorMessage.textContent = "Welcome back, " + savedName + "!";
        visitorInput.value = savedName;
        cookieStatus.textContent = "Your name was read from the EVision cookie.";
    }

    document.getElementById("saveVisitorName").addEventListener("click", function () {
        const name = visitorInput.value.trim();

        if (!name) {
            cookieStatus.textContent = "Enter your name before saving.";
            visitorInput.focus();
            return;
        }

        setCookie(COOKIE_NAME, name, 30);
        visitorMessage.textContent = "Welcome back, " + name + "!";
        cookieStatus.textContent = "Name saved in a cookie for 30 days.";
    });

    document.getElementById("forgetVisitorName").addEventListener("click", function () {
        setCookie(COOKIE_NAME, "", -1);
        visitorInput.value = "";
        visitorMessage.textContent = "Enter your name and EVision will remember you for 30 days.";
        cookieStatus.textContent = "Visitor cookie removed.";
    });

    restoreSavedState();
}

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", initialiseComparisonPage);
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        calculateCosts,
        validateCalculator,
        formatMoney,
        readCookieValue,
        safeRead,
        safeWrite
    };
}
