// ─── FAQ Accordion ──────────────────────────────────────────────────────────
document.querySelectorAll('.faq-trigger').forEach(function(trigger) {
    trigger.addEventListener('click', function() {
        var answerId = this.getAttribute('aria-controls');
        var answer = document.getElementById(answerId);
        var icon = this.querySelector('.faq-icon');
        var isOpen = this.getAttribute('aria-expanded') === 'true';

        // Close all other items
        document.querySelectorAll('.faq-trigger').forEach(function(otherTrigger) {
            if (otherTrigger !== trigger) {
                var otherId = otherTrigger.getAttribute('aria-controls');
                var otherAnswer = document.getElementById(otherId);
                var otherIcon = otherTrigger.querySelector('.faq-icon');
                if (otherAnswer) otherAnswer.classList.add('hidden');
                if (otherIcon) otherIcon.classList.remove('rotate-180');
                otherTrigger.setAttribute('aria-expanded', 'false');
            }
        });

        // Toggle current item
        if (isOpen) {
            answer.classList.add('hidden');
            icon.classList.remove('rotate-180');
            this.setAttribute('aria-expanded', 'false');
        } else {
            answer.classList.remove('hidden');
            icon.classList.add('rotate-180');
            this.setAttribute('aria-expanded', 'true');
        }
    });
});

// ─── Mobile Hamburger Menu ───────────────────────────────────────────────────
var mobileBtn = document.getElementById('mobile-menu-btn');
var mobileMenu = document.getElementById('mobile-menu');

if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', function() {
        var isOpen = mobileMenu.classList.contains('flex');

        if (isOpen) {
            mobileMenu.classList.remove('flex');
            mobileMenu.classList.add('hidden');
            mobileBtn.setAttribute('aria-expanded', 'false');
            mobileBtn.classList.remove('open');
            document.body.style.overflow = '';
        } else {
            mobileMenu.classList.remove('hidden');
            mobileMenu.classList.add('flex');
            mobileBtn.setAttribute('aria-expanded', 'true');
            mobileBtn.classList.add('open');
            document.body.style.overflow = 'hidden'; // prevent scroll behind menu
        }
    });

    // Close mobile menu when any nav link is clicked
    mobileMenu.querySelectorAll('.mobile-nav-link, a').forEach(function(link) {
        link.addEventListener('click', function() {
            mobileMenu.classList.remove('flex');
            mobileMenu.classList.add('hidden');
            mobileBtn.setAttribute('aria-expanded', 'false');
            mobileBtn.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}
