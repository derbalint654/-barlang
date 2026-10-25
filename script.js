/* =====================================================================
   BARLANG – oldal logika (vanilla JS, szerver nélkül)
   Az adatok a data.js-ben vannak, ide nem kell nyúlni havonta.
   Teszteléshez a mai nap felülírható: index.html?ma=2026-10-15

   Frissülés: az oldal magától újraszámolja a "ma / következő / elmúlt"
   állapotokat éjfélkor, és amikor a látogató visszatér a fülre –
   nem kell újratölteni.
   ===================================================================== */
(function () {
  "use strict";

  var PROGRAM = (window.BARLANG_PROGRAM || []).slice();
  var KATEGORIAK = window.BARLANG_KATEGORIAK || {};
  var NAPOK = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
  var NAPOK_ROVID = ["V", "H", "K", "Sze", "Cs", "P", "Szo"];
  var HONAPOK = ["január", "február", "március", "április", "május", "június",
    "július", "augusztus", "szeptember", "október", "november", "december"];

  var mozgas = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (mozgas) document.documentElement.classList.add("anim");

  /* ---------- dátum segédek ---------- */
  var tesztNap = new URLSearchParams(location.search).get("ma");
  function maiNap() {
    if (tesztNap && /^\d{4}-\d{2}-\d{2}$/.test(tesztNap)) return napbol(tesztNap);
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function napbol(str) {
    var r = str.split("-").map(Number);
    return new Date(r[0], r[1] - 1, r[2]);
  }
  function kulcs(d) {
    return d.getFullYear() + "-" + ket(d.getMonth() + 1) + "-" + ket(d.getDate());
  }
  function honapKulcs(d) { return d.getFullYear() + "-" + ket(d.getMonth() + 1); }
  function honapNev(hk) {
    var r = hk.split("-").map(Number);
    return r[0] + ". " + HONAPOK[r[1] - 1];
  }
  function honapLep(hk, n) {
    var r = hk.split("-").map(Number);
    return honapKulcs(new Date(r[0], r[1] - 1 + n, 1));
  }
  function hetfoje(d) {
    var h = new Date(d);
    h.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return h;
  }
  function napLep(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function ket(n) { return (n < 10 ? "0" : "") + n; }
  function pontos(d) { return ket(d.getMonth() + 1) + "." + ket(d.getDate()) + "."; }
  function el(tag, cls, szoveg) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (szoveg != null) e.textContent = szoveg;
    return e;
  }
  function helyorzo(szoveg) { return el("span", "ph", "[IDE JÖN: " + szoveg + "]"); }

  PROGRAM.forEach(function (e) { e._nap = napbol(e.datum); });
  PROGRAM.sort(function (a, b) {
    return (a.datum + a.ido).localeCompare(b.datum + b.ido);
  });

  /* ---------- állapot: mai nap, következő esemény, kiválasztott hét/hónap ---------- */
  var MA, MA_K, KOVETKEZO;
  var nezettHet = null;     // a Heti menetrendben mutatott hét hétfője
  var nezettHonap = null;   // a programlistában mutatott hónap ("2026-11")
  var aktivSzuro = "mind";

  function allapotSzamol() {
    MA = maiNap();
    MA_K = kulcs(MA);
    PROGRAM.forEach(function (e) {
      e._allapot = e.datum < MA_K ? "mult" : (e.datum === MA_K ? "ma" : "jovo");
    });
    KOVETKEZO = PROGRAM.filter(function (e) { return e._allapot !== "mult"; })[0] || null;
  }

  /* Mely hónapok között lehet lapozni: az első feltöltött hónaptól
     a legutolsó (vagy a mostani) utáni hónapig – az még üres, oda
     kell majd beírni az új programot. */
  function honapTartomany() {
    var elso = PROGRAM.length ? honapKulcs(PROGRAM[0]._nap) : honapKulcs(MA);
    var utolso = PROGRAM.length ? honapKulcs(PROGRAM[PROGRAM.length - 1]._nap) : honapKulcs(MA);
    if (honapKulcs(MA) > utolso) utolso = honapKulcs(MA);
    if (honapKulcs(MA) < elso) elso = honapKulcs(MA);
    return { elso: elso, utolso: honapLep(utolso, 1) };
  }

  /* ---------- 1. nyitókép: következő esemény matrica ---------- */
  function rajzolMatrica() {
    var m = document.getElementById("kovetkezo");
    if (!m) return;
    var kicsi = m.querySelector(".matrica__kicsi");
    var nagy = m.querySelector(".matrica__nagy");
    if (!KOVETKEZO) {
      kicsi.textContent = "Program";
      nagy.textContent = "Hamarosan jön a következő havi program";
      return;
    }
    var holnap = napLep(MA, 1);
    if (KOVETKEZO._allapot === "ma") {
      kicsi.textContent = parseInt(KOVETKEZO.ido, 10) >= 17 ? "Ma este " + KOVETKEZO.ido : "Ma " + KOVETKEZO.ido;
    } else if (KOVETKEZO.datum === kulcs(holnap)) {
      kicsi.textContent = "Holnap " + KOVETKEZO.ido;
    } else {
      kicsi.textContent = "Következő: " + pontos(KOVETKEZO._nap) + " " + KOVETKEZO.ido;
    }
    nagy.textContent = KOVETKEZO.cim;
  }

  /* papírfecnik a plakátfalra a közelgő eseményekből */
  function rajzolFecnik() {
    var hely = document.querySelector(".fal__fecnik");
    if (!hely) return;
    hely.innerHTML = "";
    var jovo = PROGRAM.filter(function (e) { return e._allapot !== "mult"; });
    var lista = jovo.length >= 3 ? jovo.slice(0, 3) : PROGRAM.slice(-3);
    lista.forEach(function (e, i) {
      var f = el("div", "fecni fecni--" + (i + 1));
      f.appendChild(el("span", null, pontos(e._nap) + " " + e.ido));
      f.appendChild(el("b", null, e.cim.length > 18 ? e.cim.split(",")[0] : e.cim));
      hely.appendChild(f);
    });
  }

  /* ---------- 4. Heti menetrend (lapozható) ---------- */
  function alapHet() {
    // ha erre a hétre már nincs hátra esemény (pl. vasárnap), a jövő hetet mutatjuk
    var het = hetfoje(MA);
    var vasarnap = kulcs(napLep(het, 6));
    var hatraVan = PROGRAM.some(function (e) { return e.datum >= MA_K && e.datum <= vasarnap; });
    return hatraVan ? het : napLep(het, 7);
  }

  function rajzolHeti() {
    var lista = document.getElementById("heti-napok");
    var fej = document.getElementById("heti-het");
    var cimke = document.getElementById("heti-cimke");
    if (!lista) return;
    lista.innerHTML = "";
    var regiUres = document.querySelector(".heti__ures");
    if (regiUres) regiUres.remove();

    var hetfo = nezettHet;
    var vasarnap = napLep(hetfo, 6);
    fej.textContent = pontos(hetfo) + " – " + pontos(vasarnap);

    var eltolas = Math.round((hetfo - hetfoje(MA)) / (7 * 864e5));
    cimke.textContent = eltolas === 0 ? "ez a hét" : eltolas === 1 ? "jövő hét"
      : eltolas === -1 ? "múlt hét" : (eltolas > 0 ? eltolas + " hét múlva" : -eltolas + " hete");

    var vanEsemeny = false;
    for (var i = 0; i < 7; i++) {
      var nap = napLep(hetfo, i);
      var k = kulcs(nap);
      var esemenyek = PROGRAM.filter(function (e) { return e.datum === k; });
      if (esemenyek.length) vanEsemeny = true;

      var li = el("li", "nap");
      if (!esemenyek.length) li.classList.add("nap--ures");
      if (k === MA_K) li.classList.add("nap--ma");
      else if (k < MA_K) li.classList.add("nap--mult");

      var d = el("div", "nap__datum");
      d.appendChild(el("b", null, nap.getDate() + "."));
      d.appendChild(el("span", null, k === MA_K ? "ma" : NAPOK_ROVID[nap.getDay()]));
      d.setAttribute("aria-label", pontos(nap) + " " + NAPOK[nap.getDay()]);
      li.appendChild(d);

      var doboz = el("div", "nap__esemenyek");
      if (!esemenyek.length) {
        doboz.textContent = "–";
        doboz.setAttribute("aria-label", "nincs esemény");
      }
      esemenyek.forEach(function (e) {
        var a = el("a", "nap__esemeny");
        a.href = "#gig-" + e.datum + "-" + e.ido.replace(":", "");
        a.dataset.honap = honapKulcs(e._nap);
        a.appendChild(el("span", "nap__ido", e.ido));
        a.appendChild(el("span", "nap__nev", e.cim));
        doboz.appendChild(a);
      });
      li.appendChild(doboz);
      lista.appendChild(li);
    }
    if (!vanEsemeny) {
      var u = el("p", "heti__ures");
      u.appendChild(document.createTextNode("Erre a hétre még nincs program beírva. "));
      u.appendChild(helyorzo("a hét eseményei – a data.js fájlba kell beírni"));
      lista.parentNode.appendChild(u);
    }
  }

  (function hetiLapozo() {
    var elozo = document.getElementById("heti-elozo");
    var kov = document.getElementById("heti-kov");
    if (!elozo) return;
    elozo.addEventListener("click", function () { nezettHet = napLep(nezettHet, -7); rajzolHeti(); });
    kov.addEventListener("click", function () { nezettHet = napLep(nezettHet, 7); rajzolHeti(); });
    // a heti sávból egy másik hónap eseményére kattintva a lista is oda lapoz
    document.getElementById("heti-napok").addEventListener("click", function (ev) {
      var a = ev.target.closest(".nap__esemeny");
      if (a && a.dataset.honap !== nezettHonap) { nezettHonap = a.dataset.honap; rajzolLineup(); }
    });
  })();

  /* ---------- 2. Program / line-up (hónaponként lapozható) ---------- */
  var lineup = document.getElementById("lineup");

  function rajzolHonapLapozo() {
    var t = honapTartomany();
    document.getElementById("program-honap").textContent = honapNev(nezettHonap);
    var elozo = document.getElementById("honap-elozo");
    var kov = document.getElementById("honap-kov");
    elozo.disabled = nezettHonap <= t.elso;
    kov.disabled = nezettHonap >= t.utolso;
    elozo.querySelector("span").textContent = honapNev(honapLep(nezettHonap, -1)).split(" ")[1];
    kov.querySelector("span").textContent = honapNev(honapLep(nezettHonap, 1)).split(" ")[1];

    // a havi plakát csak a saját hónapjánál látszik, máshol helyőrző
    var plakat = document.getElementById("havi-plakat");
    var ures = document.getElementById("havi-plakat-ures");
    if (plakat && ures) {
      var sajat = plakat.dataset.honap === nezettHonap;
      plakat.hidden = !sajat;
      ures.hidden = sajat;
      document.getElementById("havi-plakat-ph").textContent =
        "[IDE JÖN: " + HONAPOK[Number(nezettHonap.split("-")[1]) - 1] + "i plakát – kepek mappába]";
    }
  }

  function rajzolLineup() {
    rajzolHonapLapozo();
    lineup.innerHTML = "";
    var honapEsemenyei = PROGRAM.filter(function (e) { return honapKulcs(e._nap) === nezettHonap; });
    if (!honapEsemenyei.length) {
      var ures = el("li", "lineup__ures");
      ures.appendChild(document.createTextNode("A " + honapNev(nezettHonap) + "i program még nincs fent. "));
      ures.appendChild(helyorzo(HONAPOK[Number(nezettHonap.split("-")[1]) - 1] + "i program – a data.js fájlba kell beírni"));
      lineup.appendChild(ures);
      return;
    }
    var latszik = honapEsemenyei.filter(function (e) {
      return aktivSzuro === "mind" || e.kategoria === aktivSzuro;
    });
    if (!latszik.length) {
      lineup.appendChild(el("li", "lineup__ures", "Ebben a kategóriában ebben a hónapban nincs esemény."));
      return;
    }
    latszik.forEach(function (e) {
      var li = el("li", "gig gig--" + e._allapot);
      li.id = "gig-" + e.datum + "-" + e.ido.replace(":", "");
      var kiemelt = KOVETKEZO && e === KOVETKEZO;
      if (kiemelt) li.classList.add("gig--kiemelt");

      var dat = el("p", "gig__datum");
      dat.textContent = pontos(e._nap);
      dat.appendChild(el("small", null, NAPOK[e._nap.getDay()]));
      li.appendChild(dat);

      var ido = el("p", "gig__ido", e.ido);
      ido.appendChild(el("span", "kat", KATEGORIAK[e.kategoria] || "Egyéb"));
      li.appendChild(ido);

      var cim = el("h3", "gig__cim", e.cim);
      if (e._allapot === "mult") cim.setAttribute("aria-label", e.cim + " (elmúlt)");
      li.appendChild(cim);

      if (e.leiras) li.appendChild(el("p", "gig__leiras", e.leiras));

      if (kiemelt) {
        var b = el("span", "badge " + (e._allapot === "ma" ? "badge--ma" : "badge--kov"),
          e._allapot === "ma" ? "MA" : "Következő");
        b.setAttribute("aria-hidden", "true");
        li.appendChild(b);
      }

      var akc = el("div", "gig__akciok");
      var gomb = el("button", "naptarba", "+ Naptárba");
      gomb.type = "button";
      gomb.setAttribute("aria-label", "Naptárba: " + e.cim + ", " + pontos(e._nap) + " " + e.ido);
      gomb.addEventListener("click", function () { letoltICS(e); });
      akc.appendChild(gomb);
      li.appendChild(akc);

      lineup.appendChild(li);
    });
    nyomas();
  }

  (function honapLapozo() {
    document.getElementById("honap-elozo").addEventListener("click", function () {
      nezettHonap = honapLep(nezettHonap, -1); rajzolLineup();
    });
    document.getElementById("honap-kov").addEventListener("click", function () {
      nezettHonap = honapLep(nezettHonap, 1); rajzolLineup();
    });
  })();

  (function szurok() {
    var hely = document.getElementById("szurok");
    if (!hely) return;
    var kat = [["mind", "Mind"]];
    Object.keys(KATEGORIAK).forEach(function (k) { kat.push([k, KATEGORIAK[k]]); });
    kat.forEach(function (k) {
      var g = el("button", "szuro", k[1]);
      g.type = "button";
      g.dataset.kat = k[0];
      g.setAttribute("aria-pressed", k[0] === aktivSzuro ? "true" : "false");
      g.addEventListener("click", function () {
        aktivSzuro = k[0];
        hely.querySelectorAll(".szuro").forEach(function (x) {
          x.setAttribute("aria-pressed", x.dataset.kat === aktivSzuro ? "true" : "false");
        });
        rajzolLineup();
      });
      hely.appendChild(g);
    });
  })();

  /* görgetéskor "rányomódik" a lapra */
  var megfigyelo = mozgas && "IntersectionObserver" in window
    ? new IntersectionObserver(function (bejegyzesek) {
        bejegyzesek.forEach(function (b) {
          if (b.isIntersecting) {
            b.target.classList.remove("nyomas");
            b.target.classList.add("nyomva");
            megfigyelo.unobserve(b.target);
          }
        });
      }, { threshold: .25 })
    : null;
  function nyomas() {
    if (!megfigyelo) return;
    lineup.querySelectorAll(".gig").forEach(function (g) {
      g.classList.add("nyomas");
      megfigyelo.observe(g);
    });
  }

  /* ---------- minden kirajzolása + automatikus frissülés ---------- */
  function mindentRajzol(lapozoVissza) {
    allapotSzamol();
    if (lapozoVissza || !nezettHet) nezettHet = alapHet();
    if (lapozoVissza || !nezettHonap) {
      nezettHonap = KOVETKEZO ? honapKulcs(KOVETKEZO._nap) : honapKulcs(MA);
    }
    rajzolMatrica();
    rajzolFecnik();
    rajzolHeti();
    rajzolLineup();
  }
  mindentRajzol(true);

  // ha közben megváltozik a nap (éjfél, vagy napokig nyitva hagyott fül),
  // minden magától frissül, és visszaugrik az aktuális hétre/hónapra
  var utolsoNap = MA_K;
  function napValtasEllenor() {
    if (kulcs(maiNap()) !== utolsoNap) {
      mindentRajzol(true);
      utolsoNap = MA_K;
    }
  }
  setInterval(napValtasEllenor, 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) napValtasEllenor();
  });

  /* ---------- .ics generálás és letöltés ---------- */
  function icsSzoveg(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }
  function hajtas(sor) { // RFC 5545: max. 75 bájtos sorok
    var ki = [];
    while (sor.length > 60) { ki.push(sor.slice(0, 60)); sor = " " + sor.slice(60); } // ékezetek miatt bőven 75 bájt alatt
    ki.push(sor);
    return ki.join("\r\n");
  }
  function letoltICS(e) {
    var d = e.datum.replace(/-/g, "");
    var t = e.ido.replace(":", "") + "00";
    var most = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    var leiras = (e.leiras ? e.leiras + "\n\n" : "") + "Barlang · https://www.facebook.com/Barlangklub/";
    var sorok = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Barlang Szentendre//Program//HU",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VTIMEZONE",
      "TZID:Europe/Budapest",
      "BEGIN:DAYLIGHT",
      "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST",
      "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
      "END:DAYLIGHT",
      "BEGIN:STANDARD",
      "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET",
      "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
      "END:STANDARD",
      "END:VTIMEZONE",
      "BEGIN:VEVENT",
      "UID:" + d + t + "-" + e.cim.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 20) + "@barlang-szentendre",
      "DTSTAMP:" + most,
      "DTSTART;TZID=Europe/Budapest:" + d + "T" + t,
      "SUMMARY:" + icsSzoveg(e.cim + " – Barlang"),
      "LOCATION:" + icsSzoveg("Barlang, 2000 Szentendre, Duna korzó 18."),
      "DESCRIPTION:" + icsSzoveg(leiras),
      "URL:https://www.facebook.com/Barlangklub/",
      "END:VEVENT",
      "END:VCALENDAR"
    ];
    var ics = sorok.map(hajtas).join("\r\n") + "\r\n";
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "barlang-" + e.datum + ".ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  /* ---------- 3. Pince ⟷ Udvar váltó ---------- */
  (function terek() {
    var szakasz = document.getElementById("terek");
    if (!szakasz) return;
    szakasz.querySelectorAll('input[name="ter"]').forEach(function (r) {
      r.addEventListener("change", function () {
        szakasz.dataset.ter = r.value;
        document.getElementById("panel-pince").hidden = r.value !== "pince";
        document.getElementById("panel-udvar").hidden = r.value !== "udvar";
      });
    });
  })();

  /* ---------- menü cetli (mobilon lenyíló) ---------- */
  (function menu() {
    var cetli = document.querySelector(".cetli");
    var gomb = cetli && cetli.querySelector(".cetli__btn");
    if (!gomb) return;
    function allit(nyitva) {
      cetli.classList.toggle("nyitva", nyitva);
      gomb.setAttribute("aria-expanded", nyitva ? "true" : "false");
    }
    gomb.addEventListener("click", function () { allit(!cetli.classList.contains("nyitva")); });
    cetli.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { allit(false); }); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && cetli.classList.contains("nyitva")) { allit(false); gomb.focus(); }
    });
    document.addEventListener("click", function (e) { if (!cetli.contains(e.target)) allit(false); });
  })();

  /* ---------- 6. galéria: érintésre színes, kattintásra lightbox ---------- */
  (function galeria() {
    var dlg = document.getElementById("lightbox");
    if (!dlg) return;
    var kep = dlg.querySelector("img");
    var felirat = dlg.querySelector(".lightbox__felirat");
    var utolsoMutato = "mouse";
    document.querySelectorAll(".zine__gomb").forEach(function (g) {
      g.addEventListener("pointerdown", function (e) { utolsoMutato = e.pointerType; });
      g.addEventListener("click", function () {
        // érintőképernyőn az első koppintás színesre vált, a második nagyít
        if (utolsoMutato === "touch" && !g.classList.contains("szines")) {
          document.querySelectorAll(".zine__gomb.szines").forEach(function (x) { x.classList.remove("szines"); });
          g.classList.add("szines");
          return;
        }
        var img = g.querySelector("img");
        kep.src = img.currentSrc || img.src;
        kep.alt = img.alt;
        felirat.textContent = g.dataset.felirat || "";
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
      });
    });
    dlg.querySelector(".lightbox__zar").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  })();
})();
