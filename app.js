/* No dependencies. Works from a local folder and static hosting. */
(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  let language = window.parent.__hyLanguage || 'tr';
  try { language = window.parent.__hyLanguage || localStorage.getItem('hy-language') || (navigator.language.toLowerCase().startsWith('tr') ? 'tr' : 'en'); } catch (_) {}
  if (!['tr', 'en'].includes(language)) language = 'tr';
  const caption = el => el?.dataset[language === 'tr' ? 'captionTr' : 'captionEn'] || '';
  let galleryIndex = 0;
  const thumbs = $$('[data-gallery-index]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reduced.matches;
  const heroVideo = $('#hero-video');
  let lightboxItems = [], lightboxIndex = 0, returnFocus = null;
  const dialog = $('#lightbox');
  function translate(root = document) {
    $$('[data-tr][data-en]', root).forEach(el => { el.innerHTML = el.dataset[language]; });
    document.documentElement.lang = language;
    $$('[data-language]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.language === language)));
    const labels = { 'Main navigation': ['Ana gezinme', 'Main navigation'], 'Image viewer': ['Görsel görüntüleyici', 'Image viewer'], 'Close image': ['Görseli kapat', 'Close image'], 'Previous image': ['Önceki görsel', 'Previous image'], 'Next image': ['Sonraki görsel', 'Next image'], 'Open image': ['Görseli büyüt', 'Open image'], 'Selected work': ['Seçili projeler', 'Selected work'], 'Project gallery': ['Proje galerisi', 'Project gallery'] };
    $$('[aria-label]').forEach(el => {
      if (!el.dataset.ariaKey) el.dataset.ariaKey = el.getAttribute('aria-label');
      if (labels[el.dataset.ariaKey]) el.setAttribute('aria-label', labels[el.dataset.ariaKey][language === 'tr' ? 0 : 1]);
    });
    if (thumbs.length) setGallery(galleryIndex);
    if (dialog?.open) renderLightbox();
    $$('[data-caption-tr][data-caption-en]').forEach(el=>{if(el.tagName==='BUTTON')el.setAttribute('aria-label',caption(el));});
    updateMotionLabel();
  }
  $$('[data-language]').forEach(b => b.addEventListener('click', () => {
    language = b.dataset.language; window.parent.__hyLanguage = language;
    try { localStorage.setItem('hy-language', language); } catch (_) {}
    translate();
  }));
  const menu = $('.menu-toggle'), nav = $('#nav-links');
  function closeMenu() { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); }
  menu?.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); });
  $$('#nav-links a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => { if (!e.target.closest('.site-nav')) closeMenu(); });
  matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

  function setGallery(i) {
    if (!thumbs.length) return;
    galleryIndex = (i + thumbs.length) % thumbs.length;
    const selected = thumbs[galleryIndex], image = $('#gallery-open img'), opener = $('#gallery-open');
    image.src = selected.dataset.src; image.alt = caption(selected);
    opener.dataset.captionTr = selected.dataset.captionTr; opener.dataset.captionEn = selected.dataset.captionEn;
    $('#gallery-caption').textContent = caption(selected);
    $('#gallery-count').textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(thumbs.length).padStart(2, '0')}`;
    thumbs.forEach((b, j) => b.setAttribute('aria-pressed', String(j === galleryIndex)));
  }
  thumbs.forEach(b => b.addEventListener('click', () => setGallery(Number(b.dataset.galleryIndex))));
  $$('[data-gallery-step]').forEach(b => b.addEventListener('click', () => setGallery(galleryIndex + Number(b.dataset.galleryStep))));
  function renderLightbox() {
    resetZoom();
    const item = lightboxItems[lightboxIndex]; if (!item) return;
    const im = $('#lightbox-image'); im.src = item.src; im.alt = item[language];
    $('#lightbox-caption').textContent = item[language];
    $('#lightbox-count').textContent = `${String(lightboxIndex + 1).padStart(2, '0')} / ${String(lightboxItems.length).padStart(2, '0')}`;
    $$('[data-lightbox-step]').forEach(b => { b.disabled = lightboxItems.length < 2; });
  }
  let zoomLevel=1;
  function resetZoom(){zoomLevel=1;const stage=$('.lightbox-stage');stage?.classList.remove('zoomed');const b=$('[data-zoom="0"]');if(b)b.textContent='100%';}
  $$('[data-zoom]').forEach(b=>b.addEventListener('click',()=>{
    const dir=Number(b.dataset.zoom);zoomLevel=dir===0?1:Math.max(1,Math.min(5,zoomLevel+dir*.5));
    const stage=$('.lightbox-stage');stage.classList.toggle('zoomed',zoomLevel>1);stage.style.setProperty('--zoom-width',Math.max(1,stage.clientWidth-48)*zoomLevel+'px');
    $('[data-zoom="0"]').textContent=Math.round(zoomLevel*100)+'%';
  }));
  $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    $$('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    $$('[data-category]').forEach(x=>x.hidden=b.dataset.filter!=='all'&&x.dataset.category!==b.dataset.filter);
  }));
  function stepLightbox(d) { lightboxIndex = (lightboxIndex + d + lightboxItems.length) % lightboxItems.length; renderLightbox(); }
  $$('[data-lightbox-group]').forEach(opener => opener.addEventListener('click', () => {
    returnFocus = opener;
    if (opener.id === 'gallery-open') {
      lightboxItems = thumbs.map(b => ({src:b.dataset.src,tr:b.dataset.captionTr,en:b.dataset.captionEn})); lightboxIndex = galleryIndex;
    } else {
      const group = $$('[data-lightbox-group]').filter(b => b.dataset.lightboxGroup === opener.dataset.lightboxGroup);
      lightboxItems = group.map(b => ({src:$('img',b).getAttribute('src'),tr:b.dataset.captionTr,en:b.dataset.captionEn})); lightboxIndex = group.indexOf(opener);
    }
    renderLightbox(); dialog.showModal(); document.body.classList.add('modal-open');
  }));
  $('.lightbox-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('close', () => { document.body.classList.remove('modal-open'); $('#lightbox-image').removeAttribute('src'); returnFocus?.focus({preventScroll:true}); });
  $$('[data-lightbox-step]').forEach(b => b.addEventListener('click', () => stepLightbox(Number(b.dataset.lightboxStep))));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    if (dialog?.open && ['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); stepLightbox(e.key === 'ArrowRight' ? 1 : -1); }
    else if (thumbs.length && ['ArrowLeft','ArrowRight'].includes(e.key) && e.target.closest('.project-gallery')) { e.preventDefault(); setGallery(galleryIndex + (e.key === 'ArrowRight' ? 1 : -1)); }
  });
  function swipe(el, callback) {
    let x=0,y=0;
    el?.addEventListener('touchstart', e => {x=e.changedTouches[0].clientX;y=e.changedTouches[0].clientY;},{passive:true});
    el?.addEventListener('touchend', e => {const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)callback(dx<0?1:-1);},{passive:true});
  }
  swipe($('.gallery-stage'), d => setGallery(galleryIndex+d)); swipe($('.lightbox-stage'), stepLightbox);
  function updateMotionLabel() {
    const b=$('#motion-toggle'); if(!b)return;
    b.setAttribute('aria-pressed',String(motionPaused)); b.textContent = language==='tr' ? (motionPaused?'Hareketi başlat ▷':'Hareketi durdur Ⅱ') : (motionPaused?'Play motion ▷':'Pause motion Ⅱ');
  }
  function applyMotion() { document.documentElement.classList.toggle('motion-paused',motionPaused); if(heroVideo){if(motionPaused)heroVideo.pause();else heroVideo.play().catch(()=>{});}updateMotionLabel(); }
  $('#motion-toggle')?.addEventListener('click',()=>{motionPaused=!motionPaused;applyMotion();});
  reduced.addEventListener('change',e=>{motionPaused=e.matches;applyMotion();});
  document.addEventListener('visibilitychange',()=>{if(heroVideo){if(document.hidden)heroVideo.pause();else if(!motionPaused)heroVideo.play().catch(()=>{});}});
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target);}}),{threshold:.12});
    $$('.section-head,.work-media,.about-name,.expertise,.drawing-caption').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
    if(heroVideo){const vo=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!motionPaused)heroVideo.play().catch(()=>{});else heroVideo.pause();}),{threshold:.05});vo.observe(heroVideo);}
  }
  let ticking=false;
  function onScroll(){if(ticking)return;ticking=true;requestAnimationFrame(()=>{const max=document.documentElement.scrollHeight-innerHeight;$('.progress').style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;ticking=false;});}
  addEventListener('scroll',onScroll,{passive:true});
  $$('a[href$=".pdf"]').forEach(a=>a.setAttribute('download',''));
  // Fine-pointer interactions and scroll motion, respecting reduced motion.
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  if (finePointer.matches) {
    $$('.work-media').forEach(el=>{
      el.addEventListener('pointermove', e=>{if(motionPaused)return;const r=el.getBoundingClientRect();el.style.setProperty('--tilt-x',((e.clientY-r.top)/r.height-.5)*-3+'deg');el.style.setProperty('--tilt-y',((e.clientX-r.left)/r.width-.5)*3+'deg');});
      el.addEventListener('pointerleave',()=>{el.style.setProperty('--tilt-x','0deg');el.style.setProperty('--tilt-y','0deg');});
    });
  }
  const heroCopy=$('.hero-copy');
  if(heroCopy){let queued=false;addEventListener('scroll',()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{heroCopy.style.transform=motionPaused?'none':`translateY(${Math.min(scrollY*.12,100)}px)`;queued=false;});},{passive:true});}
  translate();applyMotion();onScroll();
})();
