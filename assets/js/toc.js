// Highlights the table-of-contents link of the section in view (legal pages).
(function () {
    var tocLinks = document.querySelectorAll('.toc-link');
    if (!tocLinks.length || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var link = document.querySelector('.toc-link[href="#' + entry.target.id + '"]');
            if (!link) return;
            tocLinks.forEach(function (l) { l.classList.remove('active'); });
            link.classList.add('active');
        });
    }, { rootMargin: '-20% 0px -70% 0px' });
    document.querySelectorAll('.terms-section[id]').forEach(function (s) { observer.observe(s); });
})();
