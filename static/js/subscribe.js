document.querySelectorAll(".subscribe-form").forEach(function (form) {
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        var endpoint = form.getAttribute("data-subscribe-endpoint");
        var status = form.querySelector(".subscribe-status");
        var button = form.querySelector("button");
        var email = form.querySelector('input[name="email"]').value;
        var company = form.querySelector('input[name="company"]').value;

        button.disabled = true;
        status.textContent = "Subscribing…";

        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, company: company }),
        })
            .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
            .then(function (result) {
                if (result.ok && result.data.ok) {
                    status.textContent = "Subscribed!";
                    form.reset();
                } else {
                    status.textContent = (result.data && result.data.error) || "Something went wrong. Please try again.";
                }
            })
            .catch(function () {
                status.textContent = "Something went wrong. Please try again.";
            })
            .finally(function () {
                button.disabled = false;
            });
    });
});
