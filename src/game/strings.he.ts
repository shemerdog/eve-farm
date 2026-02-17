export const HE = {
  // ── App / document ─────────────────────────────────────────
  appTitle: 'חוה',

  // ── Meters bar ─────────────────────────────────────────────
  meters: {
    devotion:     'דְּבֵקוּת',    // devekut
    morality:     'מוּסָרִיּוּת', // musariyut
    faithfulness: 'נֶאֱמָנוּת',   // ne'emanut
  },

  // ── Plot tile ───────────────────────────────────────────────
  plot: {
    plant:   'זְרַע',  // zra (imperative: sow)
    harvest: 'קְצֹר',  // ktsor (imperative: harvest/reap)
  },

  // ── Dilemma modal ───────────────────────────────────────────
  dilemma: {
    keepAll:         'שְׁמֹר הַכֹּל', // shmor hakol (keep everything)
    free:            'חינם',
    keptByCommunity: 'לקהילה',
    meterAbbrev: {
      devotion:     'ד', // dalet
      morality:     'מ', // mem
      faithfulness: 'נ', // nun
    },
  },
} as const
