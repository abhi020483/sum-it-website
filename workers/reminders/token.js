/* One-click unsubscribe token. MUST stay identical to unsubToken() in
   functions/api/_lib.js — test/token.test.js checks that both give the same result.
   token = HMAC-SHA256(WEBHOOK_SECRET, 'afmelden:v1:' + lowercase e-mail), base64url */
export async function unsubToken(secret, email) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key,
    new TextEncoder().encode('afmelden:v1:' + String(email).trim().toLowerCase()));
  let bin = ''; for (const b of new Uint8Array(sig)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function unsubUrl(apiBase, secret, email, taal) {
  const t = await unsubToken(secret, email);
  return String(apiBase).replace(/\/+$/, '') + '/api/afmelden?e=' + encodeURIComponent(String(email).toLowerCase()) +
    '&t=' + t + (taal === 'en' ? '&l=en' : '');
}
