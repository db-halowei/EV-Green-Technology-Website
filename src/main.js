document.addEventListener("DOMContentLoaded", function () {

    let slideIndex = 1;

    // Show the first slide when the webpage loads
    showSlides(slideIndex);

    // Next/previous controls
    window.plusSlides = function (n) {
        showSlides(slideIndex += n);
    };

    // Dot controls
    window.currentSlide = function (n) {
        showSlides(slideIndex = n);
    };

    function showSlides(n) {
        let slides = document.getElementsByClassName("mySlides");
        let dots = document.getElementsByClassName("dot");

        // Go back to the first slide
        if (n > slides.length) {
            slideIndex = 1;
        }

        // Go to the last slide
        if (n < 1) {
            slideIndex = slides.length;
        }

        // Hide all slides
        for (let i = 0; i < slides.length; i++) {
            slides[i].style.display = "none";
        }

        // Remove active style from all dots
        for (let i = 0; i < dots.length; i++) {
            dots[i].className =
                dots[i].className.replace(" active", "");
        }

        // Show the selected slide
        slides[slideIndex - 1].style.display = "block";

        // Activate the selected dot
        if (dots.length > 0) {
            dots[slideIndex - 1].className += " active";
        }
    }

});