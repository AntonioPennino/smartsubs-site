// compare table and FAQ content are static in index.html (crawlable without JS);
// this just wires up the FAQ accordion toggle behavior.
document.querySelectorAll('.qa button').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('open')));

// mobile menu
const burger = document.getElementById('burger');
const mmenu = document.getElementById('mmenu');
if (burger && mmenu) {
  burger.addEventListener('click', () => { const open = mmenu.classList.toggle('open'); burger.setAttribute('aria-expanded', open); });
}

// smooth scroll + close menu
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const targetId = a.getAttribute('href');
  if (targetId && targetId !== '#') {
    const t = document.querySelector(targetId);
    if (t) {
      e.preventDefault();
      window.scrollTo({ top: t.offsetTop - 78, behavior: 'smooth' });
    }
  }
  if (mmenu && burger) {
    mmenu.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
  }
}));

// caption reveal animation
document.querySelectorAll('.capdemo').forEach(demo => {
  const spans = [...demo.children];
  spans.forEach(s => s.classList.remove('on'));
  let a = spans.length - 1;
  setInterval(() => {
    a = (a + 1) % (spans.length + 2);
    spans.forEach((s,i) => {
      s.classList.toggle('on', i <= a);
      s.classList.toggle('active', i === a);
    });
  }, 620);
});

// language wheel pulse
const wheel = document.querySelector('.langwheel');
if (wheel) {
  const chips = [...wheel.children];
  let h = 1;
  setInterval(() => {
    chips.forEach((c,i) => c.classList.toggle('hot', i === h % chips.length || i === (h + 4) % chips.length));
    h++;
  }, 950);
}

// preset chips rotation animation
const presetChips = document.querySelectorAll('.preset-chip');
if (presetChips.length > 0) {
  let activeIndex = 0;
  setInterval(() => {
    presetChips.forEach(chip => chip.classList.remove('active'));
    activeIndex = (activeIndex + 1) % presetChips.length;
    presetChips[activeIndex].classList.add('active');
  }, 1500);
}
