// FAQ Accordion
document.querySelectorAll('.faq-trigger').forEach(function(trigger) {
    trigger.addEventListener('click', function() {
        var item = this.closest('.faq-item');
        var answer = item.querySelector('.faq-answer');
        var icon = item.querySelector('.faq-icon');
        var isOpen = !answer.classList.contains('hidden');

        // Close all others
        document.querySelectorAll('.faq-item').forEach(function(el) {
            el.querySelector('.faq-answer').classList.add('hidden');
            el.querySelector('.faq-icon').classList.remove('rotate-180');
        });

        // Toggle current
        if (!isOpen) {
            answer.classList.remove('hidden');
            icon.classList.add('rotate-180');
        }
    });
});
