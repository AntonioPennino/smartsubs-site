// Withdrawal form: sends the statement to /api/withdraw and shows the acknowledgement.
(function () {
    var form = document.getElementById('withdraw-form');
    if (!form) return;
    var button = document.getElementById('withdraw-submit');
    var status = document.getElementById('withdraw-status');
    var done = document.getElementById('withdraw-done');

    function show(msg, isError) {
        status.textContent = msg;
        status.className = 'form-status ' + (isError ? 'is-error' : 'is-info');
        status.hidden = false;
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.reportValidity()) return;
        button.disabled = true;
        show('Sending your withdrawal…', false);
        fetch('/api/withdraw', { method: 'POST', body: new FormData(form) })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (!data.ok) {
                    show(data.message, true);
                    button.disabled = false;
                    if (window.turnstile) { try { window.turnstile.reset(); } catch (err) {} }
                    return;
                }
                form.hidden = true;
                status.hidden = true;
                document.getElementById('withdraw-done-message').textContent = data.message;
                document.getElementById('withdraw-done-summary').textContent = data.summary;
                done.hidden = false;
                done.focus();
            })
            .catch(function () {
                show('Connection problem: your withdrawal was not sent. Please try again, or send it by email to antonio.pennino.mail@gmail.com.', true);
                button.disabled = false;
            });
    });
})();
