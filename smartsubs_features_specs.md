# Documentazione Tecnica & Specifiche delle Funzionalità — SmartSubs Pro

Questo documento cataloga in dettaglio tutte le funzionalità, le specifiche tecniche, gli algoritmi e l'architettura di **SmartSubs Pro v2.3.5**. È strutturato per fornire una descrizione oggettiva e completa del funzionamento del software.

---

## 1. Architettura Generale e Integrazione con DaVinci Resolve

* **Interfaccia Utente Nativa (Fusion UI Manager):** Il plugin non utilizza framework grafici esterni o finestre indipendenti. È sviluppato interamente con `Fusion UI Manager` (le API Qt native di DaVinci Resolve). Questo permette alla GUI di ereditare automaticamente il tema grafico scuro, i colori di accento (Resolve Selection Blue `#3D7FD4`) e le proporzioni DPI di DaVinci Resolve, funzionando direttamente nel loop degli eventi del programma.
* **Compatibilità delle Versioni:** 
  - Compatibile sia con **DaVinci Resolve Free** che con **DaVinci Resolve Studio**.
  - Supportato su sistemi operativi **Windows** e **macOS** (inclusi chip Apple Silicon M1/M2/M3 tramite wheel pre-compilate per architettura ARM64).
  - Funziona da DaVinci Resolve v16 fino a v19+.
* **Esecuzione In-Process:** Il plugin viene eseguito all'interno del processo di Resolve (tramite `fuscript.exe`) quando viene avviato dal menu *Workspace -> Scripts*.

---

## 2. Motore di Trascrizione Vocale Locale (Whisper Standalone)

* **Esecuzione Offline:** La trascrizione vocale di base non effettua chiamate cloud e non richiede connessione internet. Il sistema utilizza un motore standalone composto da:
  - Runtime Python 3.10 incorporato.
  - Libreria PyTorch compilata per l'esecuzione su CPU (ottimizzata per non interferire con le risorse GPU utilizzate da Resolve per il rendering video).
  - OpenAI Whisper per il riconoscimento vocale e l'allineamento dei timestamp.
  - Libreria `imageio-ffmpeg` per la decodifica audio.
* **Modelli Whisper Selezionabili:** L'utente può scegliere la dimensione del modello in base all'hardware a disposizione:
  - **Tiny:** ~1 GB RAM richiesto. Velocità massima, precisione di trascrizione base.
  - **Small:** ~2 GB RAM richiesto. Buon compromesso velocità/precisione.
  - **Medium:** ~5 GB RAM richiesto. Bilanciato e consigliato per la maggior parte dei sistemi.
  - **Large:** ~10 GB RAM richiesto. Massima precisione di trascrizione, velocità ridotta.
* **Rilevamento Multilingua:** Supporta il riconoscimento automatico della lingua dell'audio (*Auto-detect*) o la selezione manuale della lingua target (Italiano, Inglese, Spagnolo, Francese, Tedesco, Portoghese) per ottimizzare la precisione del modello.

---

## 3. Analisi Vocale Multimodale con Gemini AI (Rilevamento dell'Enfasi)

* **Integrazione Files API di Google GenAI:** Per superare i limiti dei normali trascrittori testuali (che evidenziano le parole basandosi solo su elenchi statici di sostantivi), SmartSubs Pro integra l'analisi vocale di Gemini:
  1. Il plugin esporta temporaneamente la traccia vocale della timeline in formato `.wav`.
  2. Il file audio viene caricato sui server Gemini tramite le API dedicate per l'analisi multimodale (`client.files.upload`).
  3. Gemini **ascolta l'audio originale** analizzando intonazione, variazioni di volume, picchi di pitch (frequenza fondamentale) e allungamenti sillabici.
  4. Identifica quali parole sono pronunciate con reale enfasi emotiva, tono interrogativo o enfasi enfatica da parte dello speaker.
  5. Ritorna l'elenco esatto di queste parole chiave ad alto impatto (le cosiddette *Power Words* dinamiche).
* **Ciclo di Vita e Sicurezza dei Dati:** Per garantire la privacy, il caricamento del file audio è protetto da blocchi `try...finally` strutturati. Il file `.wav` viene **eliminato definitivamente dai server di Google immediatamente dopo l'analisi** (`client.files.delete`).

---

## 4. Algoritmi di Segmentazione e Divisione Temporale

La temporizzazione dei sottotitoli non si limita ad inserire un numero fisso di parole per secondo, ma si adatta al ritmo del parlato tramite algoritmi specifici:

* **Slicing basato sulle Pause (Silence Detection):** Il plugin analizza i timestamp restituiti da Whisper. Se rileva un silenzio o una pausa tra due parole consecutive superiore a **0.4 secondi**, forza la chiusura del sottotitolo corrente e ne apre uno nuovo. Questo evita che parole appartenenti a due frasi o concetti distinti vengano aggregate nello stesso frame.
* **Taglio sulla Punteggiatura (Punctuation Slicing):** Se una parola termina con un segno di punteggiatura forte (`.`, `!`, `?`, `:`, `;`, `,`), il sottotitolo viene interrotto immediatamente dopo quella parola. L'aggiunta della virgola (`,`) risolve i problemi di allineamento temporale in cui Whisper "allunga" i timestamp delle parole riempiendo artificialmente i vuoti d'aria.

---

## 5. Gestione della Grafica e dei Modelli in DaVinci Resolve

* **Integrazione con Modelli Text+:** Il plugin genera i sottotitoli utilizzando nodi grafici nativi `TextPlus` (Text+) in Resolve.
* **Supporto Doppia Clip (Simple / Hook):**
  - **`Sub_Simple`:** Il modello grafico per i sottotitoli normali.
  - **`Sub_Hook`:** Il modello grafico per le parole evidenziate (ad es. con testo giallo, bordi neri spessi, ombreggiatura o transizioni di scala).
  Il plugin riconosce automaticamente la presenza di questi due modelli nel Media Pool del progetto. Se presenti, li clona e li posiziona in timeline alternandoli in base all'enfasi calcolata.
* **Auto-Generazione dei Modelli di Fallback:** Se i modelli grafici non sono presenti nel Media Pool dell'utente, SmartSubs Pro genera automaticamente dei preset Text+ di base (in formato compresso nativo `.setting` compatibile con le API Fusion), garantendo che il plugin funzioni anche su installazioni pulite.

---

## 6. Logiche di Formattazione e Stili dei Sottotitoli

Il pannello delle impostazioni permette di configurare in dettaglio il comportamento visivo del testo:

* **Effetto Karaoke Attivo:** Se abilitato, il plugin analizza il millisecondo esatto in cui ogni parola viene pronunciata. Quando viene generata una frase con più parole, il sottotitolo visualizza la frase intera, ma **evidenzia in tempo reale la singola parola pronunciata in quell'istante**, applicando lo stile `Sub_Hook` in sovrapposizione temporale esatta.
* **Smart Multiline Split (Ripartizione su più righe):** Per frasi lunghe, un algoritmo divide il testo su due righe in modo bilanciato (cercando di avere lo stesso numero di parole o caratteri per riga) per mantenere i sottotitoli compatti e leggibili.
* **Controllo del Casing:** Possibilità di forzare tutto il testo in MAIUSCOLO (*Uppercase*) per uno stile social più aggressivo, o di mantenere le lettere maiuscole e minuscole originali (*Natural Casing*).
* **Pulizia della Punteggiatura:** Opzione per rimuovere automaticamente la punteggiatura visiva nei video verticali brevi (evitando virgole e punti isolati a schermo) mantenendo attiva la punteggiatura logica per la temporizzazione dei tagli.

---

## 7. I Preset Inclusi nel Sistema

I comportamenti descritti sopra sono pre-configurati in 4 profili pronti all'uso:

1. **🎬 Reel / TikTok:**
   - Lunghezza: 2 parole per sottotitolo.
   - Stile: Tutto maiuscolo, divisione su due righe abilitata.
   - Punteggiatura: Rimossa graficamente.
   - Target: Massima dinamicità visiva per video brevi.
2. **🎤 Viral Karaoke:**
   - Lunghezza: 1 parola per sottotitolo (Word-by-Word).
   - Stile: Tutto maiuscolo.
   - Evidenziazione: Effetto karaoke attivo con evidenziazione progressiva.
   - Target: Massima ritenzione visiva nei video parlati veloci.
3. **🎙️ Podcast / Long-form:**
   - Lunghezza: 4 parole per sottotitolo.
   - Stile: Caratteri naturali (maiuscole/minuscole), punteggiatura visibile mantenuta.
   - Target: Leggibilità ottimale per interviste e video informativi lunghi.
4. **📽️ Documentary:**
   - Lunghezza: 5 parole per sottotitolo.
   - Stile: Caratteri naturali, formattazione pulita.
   - Target: Narrazioni e voci fuori campo formali.

---

## 8. Persistenza dei Dati e Directory di Lavoro

* **Configurazioni e Database Utente:** Tutte le impostazioni del plugin, le chiavi API di Gemini e i log storici vengono scritti in una directory utente sicura e persistente:
  - **Windows:** `%LOCALAPPDATA%\SmartSubs` (es. `C:\Users\<NomeUtente>\AppData\Local\SmartSubs`).
  - **macOS:** `~/Library/Application Support/SmartSubs`.
  *Nota: Questa cartella non viene toccata durante gli aggiornamenti o la disinstallazione, preservando le preferenze e i modelli scaricati dall'utente.*
* **Directory dei Log:** Nel file `smartsubs.log` vengono registrati i dati ambientali (versione di Python utilizzata da Resolve, percorso dell'eseguibile, versione del plugin, ecc.) per scopi di diagnostica e supporto tecnico.

---

## 9. Installazione, Permessi e Pulizia di Sistema

* **Privilegi Amministrativi (Windows):** L'installer nativo (`SmartSubs_Installer.exe` compilato con Inno Setup) richiede privilegi di amministratore per poter scrivere nelle directory protette di DaVinci Resolve.
* **Risoluzione Dinamica delle Cartelle di Resolve:** L'installer esegue uno script in Pascal che rileva automaticamente la cartella delle utility di DaVinci Resolve, preferendo la cartella utente (`%APPDATA%`) rispetto a quella di sistema (`%PROGRAMDATA%`) per evitare duplicazioni del plugin e supportare sia la versione gratuita che studio.
* **Configurazione dei Permessi ACL (Windows):** L'installer esegue un comando di sistema `icacls` per impostare i permessi della cartella `%PROGRAMDATA%\SmartSubs` in modalità Lettura ed Esecuzione (`RX`) per il gruppo `Everyone` (`*S-1-1-0`). Questo garantisce che DaVinci Resolve possa eseguire il motore di trascrizione anche se avviato da utenti di Windows con privilegi limitati.
* **Gestione degli Aggiornamenti (InstallDelete):** All'avvio dell'installazione, il sistema rimuove automaticamente tutte le vecchie cartelle e file legacy delle versioni precedenti (incluse le vecchie cartelle `smartsubs` all'interno della directory delle utility di Resolve) per evitare che i file obsoleti causino blocchi o scansioni antivirus durante l'avvio di DaVinci Resolve.
* **Uninstaller Nativo:** Registra un disinstallatore standard nel Pannello di Controllo di Windows. Alla disinstallazione, rimuove completamente il file `SmartSubs Pro.py` da Resolve e le cartelle `plugin` e `engine` da `ProgramData`, lasciando il sistema operativo dell'utente pulito.
