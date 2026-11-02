/* ============================================================
   Reminder mail TEXTS — Ian can rewrite everything in TEXTS below.
   Placeholders: {naam} = first name, {n} = this reminder's number,
   {total} = number of reminders (REMINDER_COUNT in config.js).
   Keep {naam}; the button, unsubscribe link and layout are added automatically.
   ============================================================ */
export const TEXTS = {
  nl: {
    subject: '{naam}, je Sum-IT account staat klaar',              // every reminder except the last
    subjectLast: 'Laatste herinnering: de eerste 3 maanden zijn gratis', // the last reminder
    hello: 'Hoi {naam},',
    helloNoName: 'Hoi,',
    body: [
      'Een tijdje geleden meldde je je aan bij Sum-IT. Ik wilde je even laten weten dat je nu zelf je account kunt aanmaken en meteen kunt beginnen met je administratie: bonnetjes scannen, facturen sturen en alles in één overzicht.',
      'De eerste 3 maanden zijn gratis.'
    ],
    button: 'Maak je account aan',
    questions: 'Vragen? Antwoord gewoon op deze mail, die komt rechtstreeks bij mij terecht.',
    signoff: 'Groet,',
    name: 'Ian',
    company: 'Sum-IT',
    counter: 'Dit is herinnering {n} van {total}.',
    counterMore: 'Na herinnering {total} mailen we je niet meer.',
    counterLast: 'Hierna mailen we je niet meer.',
    unsubText: 'Liever geen mail meer?',
    unsubLink: 'Afmelden met één klik',
    footer: 'Sum-IT is een product van Alpha Nova B.V. Je ontvangt deze mail omdat je je op sum-it.eu hebt aangemeld en toestemming gaf voor e-mail.'
  },
  en: {
    subject: '{naam}, your Sum-IT account is ready',
    subjectLast: 'Last reminder: the first 3 months are free',
    hello: 'Hi {naam},',
    helloNoName: 'Hi,',
    body: [
      'A while ago you signed up for Sum-IT. I just wanted to let you know that you can now create your own account and get started with your admin right away: scan receipts, send invoices and see everything in one overview.',
      'The first 3 months are free.'
    ],
    button: 'Create your account',
    questions: 'Questions? Just reply to this e-mail, it comes straight to me.',
    signoff: 'Best,',
    name: 'Ian',
    company: 'Sum-IT',
    counter: 'This is reminder {n} of {total}.',
    counterMore: 'After reminder {total} we will not e-mail you again.',
    counterLast: 'After this we will not e-mail you again.',
    unsubText: 'Rather not get e-mail?',
    unsubLink: 'Unsubscribe with one click',
    footer: 'Sum-IT is a product of Alpha Nova B.V. You get this e-mail because you signed up on sum-it.eu and agreed to receive e-mail.'
  }
};

/* ---------- Layout (no need to touch this when changing texts) ---------- */
const C = { green: '#00BC7D', navy: '#1b1b4a', ink: '#3a3a55', mute: '#8a8ca0', card: '#f4f5f9' };

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function firstName(naam) {
  const n = String(naam || '').trim().split(/\s+/)[0] || '';
  return n.slice(0, 40);
}

function fill(s, v) {
  return String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
}

/* Returns { subject, html, text } for one person and one reminder. */
export function reminderMail({ naam, taal, reminderNo, total, unsubscribeUrl, registerUrl }) {
  const t = TEXTS[taal] || TEXTS.nl;
  const fn = firstName(naam);
  const isLast = reminderNo >= total;
  const vText = { naam: fn, n: reminderNo, total };
  const vHtml = { naam: esc(fn), n: reminderNo, total };
  const subjRaw = isLast ? t.subjectLast : t.subject;
  const subject = fill(fn ? subjRaw : subjRaw.replace(/^\{naam\},\s*/, ''), vText);
  const subjectOut = subject.charAt(0).toUpperCase() + subject.slice(1);
  const hello = fn ? t.hello : t.helloNoName;
  const counter = fill(t.counter, vText) + ' ' + fill(isLast ? t.counterLast : t.counterMore, vText);

  const p = s => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${C.ink}">${s}</p>`;
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef0f5;margin:0;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px">
<tr><td style="padding:32px 36px 8px">
${p(fill(hello, vHtml))}
${t.body.map(b => p(esc(fill(b, vText)))).join('\n')}
</td></tr>
<tr><td style="padding:4px 36px 20px">
<a href="${esc(registerUrl)}" style="display:inline-block;background:${C.green};color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 30px;border-radius:999px">${esc(t.button)} &rarr;</a>
</td></tr>
<tr><td style="padding:0 36px 28px">
${p(esc(t.questions))}
<p style="margin:0;font-size:16px;line-height:1.6;color:${C.ink}">${esc(t.signoff)}<br><strong style="color:${C.navy}">${esc(t.name)}</strong><br><span style="color:${C.mute}">${esc(t.company)}</span></p>
</td></tr>
<tr><td style="background:${C.card};padding:16px 36px;border-top:1px solid #e8eaf2;border-radius:0 0 16px 16px">
<p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${C.mute}">${esc(counter)}</p>
<p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:${C.mute}">${esc(t.unsubText)} <a href="${esc(unsubscribeUrl)}" style="color:${C.mute};text-decoration:underline">${esc(t.unsubLink)}</a></p>
<p style="margin:0;font-size:12px;line-height:1.5;color:${C.mute}">${esc(t.footer)}</p>
</td></tr>
</table>
</td></tr></table>`;

  const text = [
    fill(hello, vText), '',
    ...t.body.map(b => fill(b, vText) + '\n'),
    `${t.button}: ${registerUrl}`, '',
    t.questions, '',
    t.signoff, t.name, t.company, '',
    '---',
    counter,
    `${t.unsubText} ${t.unsubLink}: ${unsubscribeUrl}`,
    t.footer
  ].join('\n');

  return { subject: subjectOut, html, text };
}
