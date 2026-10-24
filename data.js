/* =====================================================================
   BARLANG – PROGRAM ADATOK
   ---------------------------------------------------------------------
   Havonta CSAK ezt a fájlt kell átírni – az oldal minden programos
   része (nyitókép-matrica, Heti menetrend, line-up lista, naptár-
   letöltés) innen dolgozik, magától.

   Egy esemény így néz ki:

     {
       datum: "2026-10-24",        // ÉÉÉÉ-HH-NN
       ido: "20:00",               // ÓÓ:PP (kezdés)
       cim: "Fellépő / esemény",   // ez jelenik meg nagy betűkkel
       kategoria: "koncert",       // koncert | kviz | jazz | buli | egyeb
       leiras: "..."               // OPCIONÁLIS – elhagyható
     },

   Tippek:
   - Az események sorrendje mindegy, az oldal dátum szerint rendezi.
   - A már elmúlt napok maguktól áthúzva, halványan jelennek meg.
   - A kategória a szűrőgombokhoz kell. Ha nem egyértelmű, legyen
     "koncert".
   - Vesszőt minden } után tegyél, az utolsó után nem kötelező.
   ===================================================================== */

window.BARLANG_PROGRAM = [
  /* ---------- 2026. október (a havi borítóképről) ---------- */
  { datum: "2026-10-03", ido: "20:00", cim: "Bëlga",                         kategoria: "koncert" },
  { datum: "2026-10-08", ido: "18:00", cim: "Stepout Games Quiz",            kategoria: "kviz" },
  { datum: "2026-10-09", ido: "20:00", cim: "Kiss Erzsi Panchan",            kategoria: "koncert" },
  { datum: "2026-10-10", ido: "20:00", cim: "Beatbox verseny",               kategoria: "egyeb" },
  { datum: "2026-10-13", ido: "19:30", cim: "Borbély Műhely Jazzklub",       kategoria: "jazz" },
  { datum: "2026-10-15", ido: "19:00", cim: "EU kvíz",                       kategoria: "kviz" },
  { datum: "2026-10-16", ido: "20:00", cim: "Cafe Medrano lemezbemutató",    kategoria: "koncert" },
  { datum: "2026-10-17", ido: "20:00", cim: "Paradogs, Kombeen",             kategoria: "koncert" },
  {
    datum: "2026-10-24", ido: "20:00",
    cim: "Slamtendrectomy, V. Reflux, Head on Collision",
    kategoria: "koncert",
    leiras: "„A szentendrei nehézzenei felállás, a tatabányai gore brigád és a debreceni hardcore csapat egy este, a Barlangban.”"
  },
  { datum: "2026-10-30", ido: "20:00", cim: "Sokkal Másabb",                 kategoria: "koncert" },
  { datum: "2026-10-31", ido: "20:00", cim: "Halloween Party DJ Spacecowboyjal", kategoria: "buli" }
];

/* A szűrőgombok feliratai. Új kategóriát itt lehet felvenni. */
window.BARLANG_KATEGORIAK = {
  koncert: "Koncert",
  kviz: "Kvíz",
  jazz: "Jazz",
  buli: "Buli",
  egyeb: "Egyéb"
};
