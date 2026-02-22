export const HE = {
  // ── App / document ─────────────────────────────────────────
  appTitle: "חוה",

  // ── Meters bar ─────────────────────────────────────────────
  meters: {
    devotion: "דְּבֵקוּת", // devekut
    morality: "מוּסָרִיּוּת", // musariyut
    faithfulness: "נֶאֱמָנוּת", // ne'emanut
  },

  // ── Plot tile ───────────────────────────────────────────────
  plot: {
    plow: "חֲרֹשׁ", // kharosh (imperative: plow)
    plant: "זְרַע", // zra (imperative: sow)
    harvest: "קְצֹר", // ktsor (imperative: harvest/reap)
    gather: "אֱסֹף", // esof (imperative: gather/collect sheafs)
  },

  // ── Dilemma modal ───────────────────────────────────────────
  dilemma: {
    keepAll: "שְׁמֹר הַכֹּל", // shmor hakol (keep everything)
    free: "חינם",
    keptByCommunity: "לקהילה",
    meterAbbrev: {
      devotion: "ד", // dalet
      morality: "מ", // mem
      faithfulness: "נ", // nun
    },
    saveForCycles: "זְכֹר בְּחִירָה זוֹ לחמש מחזורים", // Remember this choice for 5 cycles
    savedActive: "שָׁמוּר", // Saved
    savedCyclesLeft: "מחזורים נותרים", // cycles remaining
  },
} as const;
