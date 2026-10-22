// Withdrawal function (Consumer Code art. 54-bis, Directive 2011/83/EU art. 11a).
// Receives the "Confirm withdrawal" form, checks Cloudflare Turnstile, then emails an
// acknowledgement to the consumer (durable medium) and a copy to the seller via Resend.
// Secrets (Pages > Settings > Variables and Secrets): RESEND_API_KEY, TURNSTILE_SECRET.

const SELLER_EMAIL = 'antonio.pennino.mail@gmail.com';
const FROM = 'SmartSubs Pro <withdrawal@smartsubspro.com>';
const SELLER_FOOTER = [
    'Antonio Pennino - SmartSubs Pro',
    'Via Padre Pio 86, 82100 Benevento (BN), Italy - VAT IT01896160627',
    SELLER_EMAIL,
].join('\n');
const STATEMENT = 'I hereby withdraw from my contract for the supply of the SmartSubs Pro license.';

function clean(value, max) {
    return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function reply(ok, message, extra) {
    return new Response(JSON.stringify(Object.assign({ ok: ok, message: message }, extra || {})), {
        status: ok ? 200 : 400,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
}

async function verifyTurnstile(secret, token, ip) {
    const body = new FormData();
    body.append('secret', secret);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: body });
    const data = await res.json().catch(function () { return {}; });
    return data.success === true;
}

async function sendEmail(apiKey, to, subject, text, replyTo) {
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: [to], subject: subject, text: text, reply_to: replyTo }),
    });
    return res.ok;
}

export async function onRequestPost(context) {
    const env = context.env;
    const request = context.request;
    const fallback = 'Please send your withdrawal by email to ' + SELLER_EMAIL + ' instead: it is just as valid.';

    if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET) {
        return reply(false, 'The withdrawal form is temporarily unavailable. ' + fallback);
    }

    let form;
    try { form = await request.formData(); } catch (e) { return reply(false, 'Invalid request.'); }

    const name = clean(form.get('name'), 120);
    const email = clean(form.get('email'), 254);
    const order = clean(form.get('order'), 64);
    const purchased = clean(form.get('purchased'), 10);
    const token = String(form.get('cf-turnstile-response') || '');

    if (name.length < 2) return reply(false, 'Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply(false, 'Please enter the email address you used at checkout.');
    if (!order) return reply(false, 'Please enter your order number (it is in your Lemon Squeezy receipt) or, if you cannot find it, write "not available".');
    if (purchased && !/^\d{4}-\d{2}-\d{2}$/.test(purchased)) return reply(false, 'Please enter the purchase date as YYYY-MM-DD, or leave it empty.');

    const ip = request.headers.get('CF-Connecting-IP') || '';
    if (!token || !(await verifyTurnstile(env.TURNSTILE_SECRET, token, ip))) {
        return reply(false, 'The anti-spam check did not pass. Please reload the page and try again. ' + fallback);
    }

    const now = new Date();
    const utc = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
    const rome = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Rome', dateStyle: 'long', timeStyle: 'short',
    }).format(now);
    const reference = 'W-' + utc.slice(0, 10).replace(/-/g, '') + '-' + crypto.randomUUID().slice(0, 8).toUpperCase();

    const summary = [
        'Statement: ' + STATEMENT,
        'Name: ' + name,
        'Email: ' + email,
        'Order number: ' + order,
        'Purchase date: ' + (purchased || 'not given'),
        'Submitted on: ' + rome + ' (Italian time), ' + utc,
        'Reference: ' + reference,
    ].join('\n');

    const customerText = [
        'Hello ' + name + ',',
        '',
        'we have received your withdrawal from the contract for SmartSubs Pro. This email is your acknowledgement of receipt.',
        '',
        summary,
        '',
        'What happens next: we refund the full amount you paid through Lemon Squeezy, using the same payment method, without undue delay and in any case within 14 days of the date above, at no cost to you. When the refund is issued, your license is deactivated.',
        '',
        'If any detail above is wrong, just reply to this email.',
        '',
        SELLER_FOOTER,
    ].join('\n');

    const sellerText = [
        'New withdrawal received through smartsubspro.com/withdraw.',
        'Refund it in Lemon Squeezy within 14 days. Reply to this email to write to the customer.',
        '',
        summary,
    ].join('\n');

    const sentToCustomer = await sendEmail(env.RESEND_API_KEY, email,
        'We received your withdrawal - SmartSubs Pro (' + reference + ')', customerText, SELLER_EMAIL).catch(function () { return false; });
    const sentToSeller = await sendEmail(env.RESEND_API_KEY, SELLER_EMAIL,
        'Withdrawal ' + reference + ' - ' + name, sellerText, email).catch(function () { return false; });

    if (!sentToCustomer && !sentToSeller) {
        return reply(false, 'Your withdrawal could not be recorded because of a technical problem. ' + fallback);
    }
    return reply(true, sentToCustomer
        ? 'Your withdrawal has been received. We sent the acknowledgement to ' + email + '.'
        : 'Your withdrawal has been received, but the acknowledgement could not be delivered to ' + email + '. We will contact you; please save this page.',
        { reference: reference, submitted: rome + ' (Italian time)', summary: summary });
}

export function onRequest() {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
