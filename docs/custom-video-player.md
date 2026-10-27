# Eigener Videoplayer

Einzelne Titel, normale Playlists, automatische Favoriten-Playlists und temporäre
Zufallsplaylists verwenden denselben Player. Er verwendet die vorhandenen
authentifizierten Video-Streaming-Routen und benötigt keinen externen Playerdienst.

## Bedienung

- Manuell zugeordnete Videokategorien werden bei den Steuerelementen angezeigt.
  Kategorie-Zeitabschnitte erscheinen mit Namen als Bereiche in zusätzlichen
  Timeline-Spuren. Ein Klick springt zum Start; der aktuell zutreffende Bereich
  wird hervorgehoben. Das gilt auch beim Wechsel des aktiven Playlist-Titels.
  Im manuellen Kategorisierungsmodus speichert der Player keinen persönlichen
  Fortschritt und zählt keine Aufrufe.

- Titel und Playlistname stehen über dem Video. Bei Playlists wird zusätzlich
  die Position in der Warteschlange angezeigt.
- Play/Pause, Zeitleiste mit Zeitangaben und Pufferanzeige, Zehn-Sekunden-Sprünge,
  Lautstärke, Stummschaltung und Geschwindigkeit von 0,5× bis 2×.
- Vollbild für den gesamten Player einschließlich Playlist-Auswahl.
  Bild-in-Bild wird angeboten, wenn der Browser die Funktion unterstützt.
- Über das Playlist-Symbol lässt sich jeder Titel direkt auswählen. Vor/Zurück
  wechselt zwischen benachbarten Titeln.
- Nach einem Titel startet ein abbrechbarer Fünf-Sekunden-Countdown. Über
  „Jetzt abspielen“ wird sofort weitergeschaltet. Am Ende der Playlist stoppt
  die Wiedergabe. Autoplay lässt sich in der Playlist-Seitenleiste abschalten.
- Die Steuerelemente blenden sich bei laufender Wiedergabe nach Inaktivität aus.
  Mausbewegung, Berührung oder Tastaturfokus blenden sie wieder ein.

## Tastatur

Eine Player-Schaltfläche fokussieren oder in die Videofläche klicken. Eingaben in Reglern und
Auswahllisten werden nicht von Player-Tastenkürzeln überschrieben.

| Taste | Aktion |
| --- | --- |
| Leertaste oder K | Play/Pause |
| Pfeil links/rechts | Zehn Sekunden zurück/vor |
| Pfeil hoch/runter | Lautstärke ändern |
| M | Stumm/Ton |
| F | Vollbild |
| I | Bild-in-Bild, sofern verfügbar |
| N / P | Nächster/vorheriger Titel |
| Escape | Playlist-Seitenleiste schließen |

## Gespeicherte Einstellungen und Fortschritt

Lautstärke, Stummschaltung, Geschwindigkeit und Playlist-Autoplay werden lokal
im Browser gespeichert. Ohne verfügbaren Browserspeicher funktioniert die
Wiedergabe weiterhin mit den Standardeinstellungen.

Der Fortschritt gehört zum aktiven Benutzerprofil. Er wird regelmäßig sowie
beim Pausieren, Verlassen, manuellen Spulen und Titelwechsel gespeichert.
Beim Laden werden gespeicherte Positionen erst nach den Videometadaten angewendet.
Bereits bis zum Ende angesehene Titel starten erneut am Anfang.
`?start=0` startet einen einzelnen Titel explizit neu; `?start=45` startet bei
Sekunde 45. Ohne diesen Parameter wird der gespeicherte Fortschritt verwendet.
Das Schließen eines Browserprozesses kann die letzte noch laufende
Speicheranfrage abbrechen; der letzte erfolgreich gespeicherte Stand bleibt erhalten.

Nicht abspielbare Quellen zeigen einen Fehler mit Wiederholen-Schaltfläche.
Die Playlist bleibt bedienbar, damit ein fehlerhafter Titel übersprungen werden kann.
Wenn der Browser automatisches Abspielen blockiert, kann die Wiedergabe per
Play-Schaltfläche gestartet werden.

## Medienfunktionen

Die Oberfläche verwendet die HTML-Video-Engine des Browsers. Abspielbare Formate
und Codecs hängen damit weiterhin vom Browser und der Quelldatei ab.
Der Player kann über `PlayerItem.captions` echte WebVTT-Untertitelspuren mit
`src`, `language`, `label` und optional `default` entgegennehmen. Als Standard
markierte Spuren blendet der Browser ein. Ohne Untertitelquelle wird keine leere
Spur erzeugt. Der Katalog liefert derzeit noch keine Untertitel-Metadaten;
eine Spurauswahl in der Oberfläche steht ebenfalls noch aus.
Die Sonar-Regel S4084 erkennt die per `map()` erzeugten `<track>`-Elemente
nicht, da sie nur direkte JSX-Elemente prüft. Dieser konkrete Befund ist in
Sonar als False Positive mit Verweis auf den Laufzeittest dokumentiert.
Zusätzliche Tonspuren benötigen passende Mediendateien und Metadaten im Katalog.
Adaptive Qualitätsstufen erfordern zusätzlich eine Transcoding-/HLS-Pipeline.
