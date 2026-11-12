-- guide: the usage text for agents (constant). Slovak first, a short Italian section after it. Gateway names carry a hyphen (D116).
SELECT $guide$
SLOVENSKÉ METODICKÉ POKYNY A STANOVISKÁ - balík sk-metodika

ČO OBSAHUJE
Metodické dokumenty slovenských orgánov vo forme PDF, každý s textom z PDF (textová vrstva alebo lokálne OCR skenu) a odkazom na originál v source_url:
- Finančná správa SR (financnasprava): metodické pokyny, metodické usmernenia, závery z rokovaní komisií MF SR a prehľady zmlúv o zamedzení dvojitého zdanenia (štyri sekcie, pole section).
- Ministerstvo financií SR, Finančný spravodajca (mfsr-spravodajca): len ročníky od roku 2010.
- Národná banka Slovenska (nbs-metodicke): metodické usmernenia, stanoviská a odporúčania.
- Úrad pre verejné obstarávanie (uvo-metodicke): metodické usmernenia a výkladové stanoviská, ale zber je v predvolenom nastavení VYPNUTÝ (pozri limity). Ak sa neprevádzkuje, v korpuse tieto dokumenty nie sú.

KTORÝ NÁSTROJ
- sk-metodika_search: hľadanie. query (syntax webového vyhľadávania: "presná fráza", slovo OR slovo, -vylúč), mode hybrid (predvolené: fulltext + sémantické poradie), lexical alebo semantic, filtre fonte, section, tipo, ente, anno_from, anno_to, data_from, data_to, k (1 až 50). Bez query vypíše dokumenty podľa tipo, anno, numero. Výsledok: headline označuje zhodu «takto» (len pri fulltextovej zhode), snippet je najbližší úsek textu.
- sk-metodika_doc: jeden dokument podľa id, alebo fonte + source_id, alebo tipo + numero + anno (numero tak, ako je vytlačené, napr. 10/DZPaU/2026/MP, s lomkou a bez kódovania); text po častiach (offset, length, next_offset). Dokumenty bez čísla (stanoviská NBS) sa nájdu cez id alebo fonte + source_id.
- sk-metodika_lookup: štruktúrovaný zoznam podľa fonte, section, tipo, numero (začiatok), anno, dátumu a ente bez textu; triedenie sort, stránkovanie limit/offset, pole total.
- sk-metodika_status: skutočné pokrytie korpusu z dát (počty podľa zdroja, roky, pôvod textu, OCR, nespracované položky, pokrytie, duplicitné identity).
- sk-metodika_guide: tento text.

AKO ČÍTAŤ VÝSLEDKY
text_source: pdf = textová vrstva PDF, ocr = lokálne OCR skenu (môže obsahovať chyby rozpoznania). Polia numero, anno a data môžu byť prázdne, ak ich zdroj neuvádza (nikdy sa nedoplňujú vymyslené hodnoty).

POCTIVÉ LIMITY
- Metodický pokyn nie je prameňom práva: je to výklad správneho orgánu. Záväzný je text PDF na source_url; text v korpuse je odvodený výťah, pri citovaní vždy uveď originál z source_url.
- Fulltext používa konfiguráciu sk_unaccent (simple + unaccent): veľkosť písmen aj diakritika sa skladajú (metodicky pokyn nájde Metodický pokyn), ale bez stemmingu. Ohnuté tvary (pokyn, pokynu, pokynom) sú rôzne slová; sémantické poradie to čiastočne vyrovnáva. Zoznam tvarov skúšaj cez OR.
- Skeny sú čítané OCR: text môže mať chyby a fulltext ich nenájde.
- Licencie: Finančná správa, MF SR a ÚVO nezverejňujú podmienky použitia (licencia nezverejnená); NBS dovoľuje ďalšie použitie, vyžaduje uvedenie NBS ako zdroja a nezmenené súbory (originálny PDF súbor sa nesmie meniť). Zdroj uvádzaj vždy.
- ÚVO: súbor robots.txt webu uvo.gov.sk zakazuje všeobecným automatom prístup (Disallow: /). Zber ÚVO je preto predvolene vypnutý a zapína sa len vedomým potvrdením (uvoRobotsAck). Zber navyše pokrýva len jeden z troch rozložení stránok; rozložení s priamymi odkazmi /fileadmin a detailných záznamov usmernenie-detail (pár tisíc záznamov) sa nezbiera.
- Finančný spravodajca MF SR: ročníky 1999 až 2009 existujú len ako archívy zip a nezbierajú sa; zber začína rokom 2010.
- Pokrytie nie je úplné ani aktuálne okamžite: skutočný stav ukazuje sk-metodika_status (počty, skipped podľa dôvodu, coverage).
- Osobné údaje: dokumenty môžu uvádzať mená úradníkov a orgánov; balík nič nemaže ani nemaskuje.

SINTESI IN ITALIANO
Prassi metodologica slovacca in PDF: Finanzverwaltung (Finančná správa SR, quattro sezioni), Ministero delle Finanze (Finančný spravodajca dal 2010, gli anni 1999-2009 sono solo archivi zip non raccolti), Banca nazionale slovacca (NBS) e Ufficio per gli appalti pubblici (UVO, raccolta disattivata per robots.txt). Strumenti: sk-metodika_search (ricerca ibrida), sk-metodika_doc (testo a porzioni), sk-metodika_lookup (elenco per estremi), sk-metodika_status (copertura reale), sk-metodika_guide. Limiti: la prassi non è fonte di diritto, il testo vincolante è il PDF originale (source_url); FTS sk_unaccent senza stemming, scansioni in OCR; licenze di FS, MF SR e UVO non pubblicate, la NBS richiede la citazione della fonte e file non modificati.
$guide$ AS text
