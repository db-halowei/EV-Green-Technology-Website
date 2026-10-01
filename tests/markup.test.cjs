"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const projectRoot = path.resolve(__dirname, "..");

function readProjectFile(name) {
    const file = path.join(projectRoot, name);
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

test("EV page exposes the calculator and assignment demonstrations", () => {
    const html = readProjectFile("ev-vs-petrol.html");

    assert.match(html, /bootstrap@5\.3/);
    assert.match(html, /id="comparisonForm"/);
    assert.match(html, /id="visitorName"/);
    assert.match(html, /id="calculationResult"/);
    assert.match(html, /id="calculatorStatus"[^>]*aria-live="polite"/);
    for (const field of ["distance", "evEfficiency", "electricityRate", "petrolEfficiency", "petrolPrice"]) {
        assert.match(html, new RegExp(`id="${field}"[^>]*aria-describedby="${field}Feedback"`));
        assert.match(html, new RegExp(`id="${field}Feedback"`));
    }
    assert.match(html, /href="faq\.html"/);
    assert.match(html, /src="js\/ev-vs-petrol\.js"/);
});

test("EV page provides accessible shared navigation", () => {
    const html = readProjectFile("ev-vs-petrol.html");

    assert.match(html, /<nav[^>]*aria-label="Main navigation"/);
    assert.match(html, /EV Brands/);
    for (const [file, brand] of [
        ["blog.html", "Tesla"],
        ["team.html", "Proton"],
        ["testimonial.html", "Honda"],
        ["404.html", "BYD"]
    ]) {
        assert.match(html, new RegExp(`href="${file.replace(".", "\\.")}"[^>]*>${brand}<`));
    }
    assert.match(html, /href="ev-vs-petrol\.html"[^>]*aria-current="page"/);
    assert.match(html, /href="faq\.html"/);
});

test("FAQ page exposes search, categories and ten accordion questions", () => {
    const html = readProjectFile("faq.html");

    assert.match(html, /bootstrap@5\.3/);
    assert.match(html, /id="faqSearch"/);
    assert.equal((html.match(/class="accordion-item faq-item"/g) || []).length, 10);
    for (const category of ["general", "charging", "battery", "cost", "safety"]) {
        assert.match(html, new RegExp(`data-category="${category}"`));
    }
    assert.match(html, /id="faqResultCount"[^>]*aria-live="polite"/);
    assert.match(html, /id="faqEmptyState"/);
    assert.match(html, /role="group" aria-label="FAQ categories"/);
});

test("FAQ page loads jQuery before its API script", () => {
    const html = readProjectFile("faq.html");
    const jqueryPosition = html.indexOf("jquery-3.7.1.min.js");
    const faqScriptPosition = html.indexOf('src="js/faq.js"');

    assert.ok(jqueryPosition >= 0);
    assert.ok(faqScriptPosition > jqueryPosition);
    assert.match(html, /id="weatherStatus"[^>]*aria-live="polite"/);
    assert.match(html, /id="retryWeather"/);
    assert.match(html, /href="ev-vs-petrol\.html"/);
});

test("existing teammate navbars link to both assigned pages", () => {
    for (const file of ["index.html", "about.html"]) {
        const html = readProjectFile(file);
        const evLinks = html.match(/href="ev-vs-petrol\.html"/g) || [];
        const faqLinks = html.match(/href="faq\.html"/g) || [];

        assert.equal(evLinks.length, 1, file + " has one EV vs Petrol navbar link");
        assert.equal(faqLinks.length, 1, file + " has one FAQ navbar link");

        for (const brandFile of ["blog.html", "team.html", "testimonial.html", "404.html"]) {
            assert.match(html, new RegExp(`href="${brandFile.replace(".", "\\.")}"`));
        }
    }
});

test("assigned pages use professional visual presentation instead of technical demo labels", () => {
    const evHtml = readProjectFile("ev-vs-petrol.html");
    const faqHtml = readProjectFile("faq.html");
    const evScript = readProjectFile("js/ev-vs-petrol.js");
    const faqScript = readProjectFile("js/faq.js");
    const pageStyles = readProjectFile("css/ev-pages.css");

    for (const label of [
        "COOKIE DEMO",
        "SESSION STORAGE",
        "LOCAL STORAGE",
        "JAVASCRIPT CALCULATOR",
        "Assignment Features",
        "Educational project",
        "Educational estimate"
    ]) {
        assert.doesNotMatch(evHtml, new RegExp(label, "i"));
    }
    assert.match(evHtml, /class="[^"]*comparison-summary/);
    assert.match(evHtml, /class="[^"]*estimator-shell/);
    assert.match(evHtml, /class="[^"]*savings-dashboard/);

    for (const label of [
        "JQUERY AJAX",
        "REST API",
        "Assignment Features",
        "Educational project"
    ]) {
        assert.doesNotMatch(faqHtml, new RegExp(label, "i"));
    }
    assert.match(faqHtml, /class="[^"]*faq-command-card/);
    assert.match(faqHtml, /class="[^"]*weather-dashboard/);

    assert.doesNotMatch(evScript, /textContent\s*=\s*"[^"]*(?:cookie|Local Storage|Session Storage)/i);
    assert.doesNotMatch(faqScript, /\.text\("[^"]*REST API/i);
    assert.match(pageStyles, /--ev-nav:\s*#07563d/i);
    assert.doesNotMatch(pageStyles, /#evComparisonPage,\s*#faqPage\s*\{[^}]*overflow-x:\s*hidden/is);
});
