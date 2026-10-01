// ================================================
// EVISION AUTHENTICATION PROTOTYPE
// ================================================


// Convert a password into a SHA-256 hash
async function hashPassword(password) {

    const encoder = new TextEncoder();

    const data = encoder.encode(password);

    const hashBuffer =
        await crypto.subtle.digest("SHA-256", data);

    const hashArray =
        Array.from(new Uint8Array(hashBuffer));

    return hashArray
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}


// ================================================
// MESSAGE FUNCTION
// ================================================

function showMessage(element, message, type) {

    element.textContent = message;

    element.className =
        "auth-message " + type;
}


// ================================================
// SHOW / HIDE PASSWORD
// ================================================

document
    .querySelectorAll(".password-toggle")
    .forEach(function (button) {

        button.addEventListener("click", function () {

            const targetId =
                button.getAttribute("data-target");

            const passwordInput =
                document.getElementById(targetId);

            const icon =
                button.querySelector("i");


            if (passwordInput.type === "password") {

                passwordInput.type = "text";

                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");

            } else {

                passwordInput.type = "password";

                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }

        });

    });


// ================================================
// SIGNUP
// ================================================

const signupForm =
    document.getElementById("signupForm");


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const username =
                document
                    .getElementById("signupUsername")
                    .value
                    .trim();

            const email =
                document
                    .getElementById("signupEmail")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .getElementById("signupPassword")
                    .value;

            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;

            const agreeTerms =
                document
                    .getElementById("agreeTerms")
                    .checked;

            const message =
                document
                    .getElementById("signupMessage");


            // Username validation
            if (username.length < 3) {

                showMessage(
                    message,
                    "Username must contain at least 3 characters.",
                    "error"
                );

                return;
            }


            // Password validation
            if (password.length < 8) {

                showMessage(
                    message,
                    "Password must contain at least 8 characters.",
                    "error"
                );

                return;
            }


            // Confirm password
            if (password !== confirmPassword) {

                showMessage(
                    message,
                    "The passwords do not match.",
                    "error"
                );

                return;
            }


            // Terms
            if (!agreeTerms) {

                showMessage(
                    message,
                    "Please accept the Terms and Conditions.",
                    "error"
                );

                return;
            }


            // Retrieve registered users
            let users =
                JSON.parse(
                    localStorage.getItem("evisionUsers")
                ) || [];


            // Check duplicate email
            const emailExists =
                users.some(function (user) {

                    return user.email === email;

                });


            if (emailExists) {

                showMessage(
                    message,
                    "An account with this email already exists.",
                    "error"
                );

                return;
            }


            // Check duplicate username
            const usernameExists =
                users.some(function (user) {

                    return (
                        user.username.toLowerCase() ===
                        username.toLowerCase()
                    );

                });


            if (usernameExists) {

                showMessage(
                    message,
                    "This username has already been taken.",
                    "error"
                );

                return;
            }


            // Hash password
            const passwordHash =
                await hashPassword(password);


            // Create user
            const newUser = {

                username: username,

                email: email,

                passwordHash: passwordHash,

                createdAt:
                    new Date().toISOString()

            };


            // Add user
            users.push(newUser);


            // Save users
            localStorage.setItem(
                "evisionUsers",
                JSON.stringify(users)
            );


            showMessage(
                message,
                "Account created successfully! Redirecting to login...",
                "success"
            );


            signupForm.reset();


            // Go to login
            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 1500);

        });

}


// ================================================
// LOGIN
// ================================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    // Load remembered email
    const rememberedEmail =
        localStorage.getItem(
            "evisionRememberedEmail"
        );


    if (rememberedEmail) {

        document
            .getElementById("loginEmail")
            .value = rememberedEmail;

        document
            .getElementById("rememberMe")
            .checked = true;
    }


    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document
                    .getElementById("loginPassword")
                    .value;

            const rememberMe =
                document
                    .getElementById("rememberMe")
                    .checked;

            const message =
                document
                    .getElementById("loginMessage");


            // Retrieve users
            const users =
                JSON.parse(
                    localStorage.getItem("evisionUsers")
                ) || [];


            // Find user
            const user =
                users.find(function (user) {

                    return user.email === email;

                });


            if (!user) {

                showMessage(
                    message,
                    "No account was found with this email.",
                    "error"
                );

                return;
            }


            // Hash entered password
            const passwordHash =
                await hashPassword(password);


            // Check password
            if (user.passwordHash !== passwordHash) {

                showMessage(
                    message,
                    "Incorrect password. Please try again.",
                    "error"
                );

                return;
            }


            // =================================
            // LOGIN SUCCESSFUL
            // =================================

            sessionStorage.setItem(
                "evisionLoggedIn",
                "true"
            );

            sessionStorage.setItem(
                "evisionUsername",
                user.username
            );

            sessionStorage.setItem(
                "evisionEmail",
                user.email
            );


            // Remember email only
            if (rememberMe) {

                localStorage.setItem(
                    "evisionRememberedEmail",
                    email
                );

            } else {

                localStorage.removeItem(
                    "evisionRememberedEmail"
                );

            }


            showMessage(
                message,
                "Login successful! Welcome, " +
                user.username +
                "!",
                "success"
            );


            // Go home
            setTimeout(function () {

                window.location.href =
                    "index.html";

            }, 1000);

        });

}
document.addEventListener("DOMContentLoaded", function () {

    const loggedIn =
        sessionStorage.getItem("evisionLoggedIn");

    const username =
        sessionStorage.getItem("evisionUsername");


    const loginLink =
        document.getElementById("loginLink");

    const signupLink =
        document.getElementById("signupLink");

    const welcomeUser =
        document.getElementById("welcomeUser");

    const logoutLink =
        document.getElementById("logoutLink");


    // User is logged in
    if (loggedIn === "true" && username) {

        loginLink.style.display = "none";

        signupLink.style.display = "none";

        welcomeUser.style.display = "flex";

        logoutLink.style.display = "block";


        welcomeUser.textContent =
            "Welcome, " + username + "!";

    }


    // Logout
    logoutLink.addEventListener(
        "click",
        function (event) {

            event.preventDefault();


            sessionStorage.removeItem(
                "evisionLoggedIn"
            );

            sessionStorage.removeItem(
                "evisionUsername"
            );

            sessionStorage.removeItem(
                "evisionEmail"
            );


            window.location.href =
                "index.html";

        }
    );

});