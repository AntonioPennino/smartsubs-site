// Lemon Squeezy webhook (order_created): sends the customer a welcome email with getting-started
// links via Resend, with Trustpilot's Automatic Feedback Service address in BCC so Trustpilot can
// send one review invitation (Privacy Policy, Section 6).
// Secrets (Pages > Settings > Variables and Secrets): LEMON_WEBHOOK_SECRET, RESEND_API_KEY,
// TRUSTPILOT_AFS_BCC (optional: without it the welcome email goes out with no review invitation).

const SELLER_EMAIL = 'antonio.pennino.mail@gmail.com';
const FROM = 'SmartSubs Pro <hello@smartsubspro.com>';

function hex(buffer) {
    return Array.from(new Uint8Array(buffer)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function sameString(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

async function validSignature(secret, body, signature) {
    if (!secret || !signature) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const digest = hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
    return sameString(digest, signature.trim().toLowerCase());
}

function clean(value, max) {
    return String(value || '').replace(/[\u0000-\u001f\u007f"<>\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export async function onRequestPost(context) {
    const env = context.env;
    const request = context.request;
    const body = await request.text();

    if (!(await validSignature(env.LEMON_WEBHOOK_SECRET, body, request.headers.get('X-Signature') || ''))) {
        return new Response('Invalid signature', { status: 401 });
    }

    let event;
    try { event = JSON.parse(body); } catch (e) { return new Response('Invalid JSON', { status: 400 }); }

    const name = event && event.meta && event.meta.event_name;
    const order = event && event.data && event.data.attributes;
    if (name !== 'order_created' || !order || order.status !== 'paid') {
        return new Response('Ignored', { status: 200 });
    }

    const email = clean(order.user_email, 254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response('Ignored: no email', { status: 200 });
    if (!env.RESEND_API_KEY) return new Response('Email not configured', { status: 500 });

    const customer = clean(order.user_name, 100);
    const orderNumber = clean(order.order_number || (event.data && event.data.id), 40);
    const firstName = customer.split(' ')[0] || 'there';
    const sendToTrustpilot = Boolean(env.TRUSTPILOT_AFS_BCC) && order.test_mode !== true;

    const text = [
        'Hello ' + firstName + ',',
        '',
        'thank you for buying SmartSubs Pro (order #' + orderNumber + '). Your download link and your license key are in the Lemon Squeezy receipt you have just received.',
        '',
        'Getting started:',
        '- Install and activate: https://smartsubspro.com/guide/install-smartsubs-pro-davinci-resolve/',
        '- Your first captions: https://smartsubspro.com/guide/auto-subtitles-davinci-resolve/',
        '- All guides: https://smartsubspro.com/guide/',
        '',
        'Need help? Just reply to this email: I answer personally.',
        '',
        'In a few days Trustpilot may send you one invitation to review SmartSubs Pro. If you would rather not receive it, reply "no review" and I will cancel it.',
        '',
        'You can withdraw from your purchase within 14 days, without giving a reason: https://smartsubspro.com/withdraw',
        '',
        'Antonio Pennino - SmartSubs Pro',
        'Via Padre Pio 86, 82100 Benevento (BN), Italy - VAT IT01896160627',
    ].join('\n');

    const message = {
        from: FROM,
        to: [customer ? '"' + customer + '" <' + email + '>' : email],
        subject: 'Welcome to SmartSubs Pro - getting started (order #' + orderNumber + ')',
        text: text,
        reply_to: SELLER_EMAIL,
    };
    if (sendToTrustpilot) message.bcc = [env.TRUSTPILOT_AFS_BCC];

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + env.RESEND_API_KEY,
            'Content-Type': 'application/json',
            // Lemon Squeezy retries failed deliveries: the same order never sends two emails.
            'Idempotency-Key': 'welcome-order-' + orderNumber,
        },
        body: JSON.stringify(message),
    }).catch(function () { return null; });

    if (!res || !res.ok) return new Response('Email failed', { status: 502 });
    return new Response('Welcome email sent', { status: 200 });
}

export function onRequest() {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
