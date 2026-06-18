// icons
const CHECK = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';
const CROSS = '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12"/></svg>';

// compare table
const ROWS = [
  ['Works inside DaVinci Resolve','y','n','y'],
  ['Word-by-word animation','y','y','n'],
  ['Custom Fusion templates','y','n','Limited'],
  ['AI hook word emphasis','y','n','n'],
  ['100% offline privacy','y','n','y'],
  ['Windows & macOS (Apple Silicon + Intel) support','y','y','y'],
  ['No monthly fee','y','Free*','y'],
];
const cell = v => v === 'y' ? '<span class="yes">' + CHECK + '</span>' : v === 'n' ? '<span class="no">' + CROSS + '</span>' : '<span class="lim">' + v + '</span>';

const ctbody = document.getElementById('ctbody');
if (ctbody) {
  ctbody.innerHTML = ROWS.map(r => '<tr><td>' + r[0] + '</td><td class="us-col">' + cell(r[1]) + '</td><td>' + cell(r[2]) + '</td><td>' + cell(r[3]) + '</td></tr>').join('');
}

// faq
const QA = [
  ['Does this work on the Free version of DaVinci Resolve?','Yes — Free and Studio (v16 to v19+). SmartSubs uses standard Fusion Text+ nodes that are available to everyone, not the Studio-only subtitle track.'],
  ['Are there any hidden API or cloud fees?','No monthly fees, ever. Whisper runs fully offline. If you enable Gemini Hook Detection you only need a Google AI key, which has a very generous free tier.'],
  ['Can I use my own fonts and Fusion animations?','Absolutely. Point SmartSubs at any Text+ node you set as your template — any font, color, scale animation or Fusion effect — and it animates it word-by-word.'],
  ['Does it work on Mac?','Yes! SmartSubs Pro fully supports macOS (both Apple Silicon M1/M2/M3 chips and Intel processors) with pre-compiled wheels, as well as Windows 10/11.'],
  ['How does the Gemini Hook Detection work?','Unlike simple text-based tools that predict emphasis from static lists, SmartSubs Pro exports your audio and uses Gemini multimodally to listen to your voice. It analyzes vocal pitch, speed, and volume changes to identify real spoken emphasis. The audio file is deleted from Google servers immediately after analysis.'],
  ['Is the Whisper engine completely offline?','Yes. The entire transcription engine runs 100% locally on your computer using an embedded Python runtime and PyTorch. We optimized it to execute on your CPU to preserve your GPU power for DaVinci Resolve\'s real-time video playback and rendering.'],
  ['What happens after I buy?','You get an instant download link by email from Lemon Squeezy: installer, script and a quick-start guide. You will be up and running in under 5 minutes.'],
];
const CHEV = '<span class="chev"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" d="M19 9l-7 7-7-7"/></svg></span>';

const faqlist = document.getElementById('faqlist');
if (faqlist) {
  faqlist.innerHTML = QA.map((q,i) => '<div class="qa' + (i===0?' open':'') + '"><button>' + q[0] + CHEV + '</button><div class="ans"><p>' + q[1] + '</p></div></div>').join('');
  document.querySelectorAll('.qa button').forEach(b => b.addEventListener('click', () => b.parentElement.classList.toggle('open')));
}

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
