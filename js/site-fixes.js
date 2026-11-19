/* MFYZI - Contact: remove the Gmail/email field and the "copy email" button (main.js keeps working) */
(function () {
  'use strict';
  const btn = document.getElementById('copy-email-btn');
  if (btn) btn.style.setProperty('display', 'none', 'important'); // hidden, not deleted, so main.js never breaks
  const input = document.getElementById('sender-email');
  if (input) {
    input.required = false; input.removeAttribute('required'); input.value = '';
    const group = input.closest('.form-group'); if (group) group.style.setProperty('display', 'none', 'important');
  }
  // if only the WhatsApp button is left, centre it
  const box = document.querySelector('.contact-direct-actions');
  if (box) { box.style.justifyContent = 'center'; }
})();
