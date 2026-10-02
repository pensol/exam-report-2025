(() => {
  'use strict';
  const STORAGE_KEY = 'exam-report-2025-v1';
  const overlay = document.querySelector('#overlay');
  const sheet = document.querySelector('#sheet');
  const mobileForm = document.querySelector('#mobile-form');
  const status = document.querySelector('#save-status');
  let state = {};
  try { state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (_) {}

  const pct = (value, total) => `${value / total * 100}%`;
  const debounce = (fn, wait=180) => { let timer; return () => { clearTimeout(timer); timer=setTimeout(fn,wait); }; };
  const save = debounce(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    status.textContent = `保存済み ${new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
  });

  const updateValue = (id, value, source) => {
    state[id] = value;
    const desktop = document.getElementById(id);
    const mobile = document.getElementById(`mobile-${id}`);
    if (desktop && desktop !== source) {
      if (desktop.classList.contains('mark')) desktop.classList.toggle('selected', !!value);
      else desktop.value = value || '';
    }
    if (mobile && mobile !== source) {
      if (mobile.classList.contains('mobile-mark')) mobile.classList.toggle('selected', !!value);
      else mobile.value = value || '';
    }
    status.textContent='保存中…'; save();
  };

  function place(el, f) {
    el.style.left = pct(f.x + (f.dx || 0), PAGE.width);
    el.style.top = pct(f.y + (f.dy || 0), PAGE.height);
    el.style.width = pct(f.w, PAGE.width);
    el.style.height = pct(f.h, PAGE.height);
    el.style.setProperty('--font-pt', f.font || 9);
    el.dataset.debug = `${f.id}  x:${f.x} y:${f.y} w:${f.w} h:${f.h}`;
    el.setAttribute('aria-label', f.label || f.id);
  }

  FIELDS.forEach((f, index) => {
    let el;
    if (f.type === 'mark') {
      el = document.createElement('button');
      el.type = 'button'; el.className = 'mark';
      el.classList.toggle('selected', !!state[f.id]);
      el.addEventListener('click', () => {
        updateValue(f.id, !state[f.id], el);
        el.classList.toggle('selected', !!state[f.id]);
      });
    } else {
      el = document.createElement(f.type === 'textarea' ? 'textarea' : 'input');
      el.className = 'field'; el.value = state[f.id] || '';
      if (el.tagName === 'INPUT') el.type = f.type === 'number' ? 'text' : 'text';
      if (f.type === 'number') el.inputMode = 'numeric';
      el.tabIndex = index + 1;
      el.addEventListener('input', () => updateValue(f.id, el.value, el));
    }
    el.id = f.id; place(el, f); overlay.appendChild(el);
  });

  function scaleFonts() {
    const scale = sheet.getBoundingClientRect().width / PAGE.width;
    FIELDS.forEach(f => {
      const el = document.getElementById(f.id);
      if (el && f.type !== 'mark') el.style.fontSize = `${(f.font || 9) * scale}px`;
    });
  }
  scaleFonts();
  new ResizeObserver(scaleFonts).observe(sheet);

  const groups = [
    ['基本情報・受験結果', f => f.y < 300 && f.x < 610],
    ['志望・強み・活動', f => f.y >= 300 && f.x < 610],
    ['受験科目・面接', f => f.x >= 610 && f.y < 270],
    ['小論文・その他科目', f => f.x >= 610 && f.y >= 270 && f.y < 700],
    ['受験対策', f => f.x >= 610 && f.y >= 700],
  ];
  groups.forEach(([title, predicate]) => {
    const fields = FIELDS.filter(predicate);
    if (!fields.length) return;
    const section = document.createElement('section');
    section.className = 'mobile-group';
    const heading = document.createElement('h2'); heading.textContent = title; section.appendChild(heading);
    fields.forEach(f => {
      let control;
      if (f.type === 'mark') {
        control = document.createElement('button'); control.type='button'; control.className='mobile-mark';
        control.textContent=f.label; control.classList.toggle('selected', !!state[f.id]);
        control.addEventListener('click', () => { updateValue(f.id, !state[f.id], control); control.classList.toggle('selected', !!state[f.id]); });
        section.appendChild(control);
      } else {
        const label = document.createElement('label'); label.className='mobile-control'; label.textContent=f.label;
        control = document.createElement(f.type === 'textarea' ? 'textarea' : 'input');
        control.value=state[f.id] || ''; if (f.type === 'number') control.inputMode='numeric';
        control.addEventListener('input', () => updateValue(f.id, control.value, control));
        label.appendChild(control); section.appendChild(label);
      }
      control.id=`mobile-${f.id}`;
    });
    mobileForm.appendChild(section);
  });

  document.querySelector('#mobile-form-button').addEventListener('click', () => document.body.classList.remove('preview-mode'));
  document.querySelector('#preview-button').addEventListener('click', () => document.body.classList.add('preview-mode'));

  document.querySelector('#debug-toggle').addEventListener('change', e => sheet.classList.toggle('debug', e.target.checked));
  document.querySelector('#print-button').addEventListener('click', () => window.print());
  document.querySelector('#clear-button').addEventListener('click', () => {
    if (!confirm('保存されている入力内容をすべて消去しますか？')) return;
    state = {}; localStorage.removeItem(STORAGE_KEY);
    document.querySelectorAll('.field').forEach(el => el.value='');
    document.querySelectorAll('.mark').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.mobile-control input, .mobile-control textarea').forEach(el => el.value='');
    document.querySelectorAll('.mobile-mark').forEach(el => el.classList.remove('selected'));
    status.textContent='入力を消去しました';
  });
})();
