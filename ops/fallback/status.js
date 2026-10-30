(() => {
  let checking = false;
  async function check() {
    if (checking) return;
    checking = true;
    try {
      const mode = await fetch('/__maintenance', { cache: 'no-store', signal: AbortSignal.timeout(4000) });
      const data = await mode.json();
      const modified = Date.parse(mode.headers.get('Last-Modified') || '');
      const updating = data.mode === 'update' && Number.isFinite(modified) && Date.now() - modified < 7200000;
      document.getElementById('state').textContent = updating ? 'Update wird installiert' : 'Vorübergehend nicht erreichbar';
      document.getElementById('heading').textContent = updating ? 'Ein Update. Gleich geht’s weiter.' : 'Wir sind gleich wieder da.';
      document.getElementById('description').textContent = updating
        ? 'Wir aktualisieren Netflix Clone gerade für dich. Sobald das Update abgeschlossen ist, geht es hier automatisch weiter.'
        : 'Die Anwendung ist gerade nicht erreichbar. Wir prüfen automatisch, wann du weiterschauen kannst.';
      const response = await fetch('/__availability', { cache: 'no-store', signal: AbortSignal.timeout(4000) });
      if (response.ok && (await response.json()).status === 'ok') {
        location.reload();
        return;
      }
    } catch { /* Retry after network errors without losing the original URL. */ }
    finally { checking = false; }
    document.getElementById('feedback').textContent = 'Noch nicht erreichbar. Nächster Versuch in 5 Sekunden.';
  }
  document.getElementById('retry').addEventListener('click', check);
  setInterval(check, 5000);
  check();
})();
