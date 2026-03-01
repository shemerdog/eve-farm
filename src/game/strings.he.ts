export const HE = {
    // ── App / document ─────────────────────────────────────────
    appTitle: 'חוה',

    // ── Meters bar ─────────────────────────────────────────────
    meters: {
        devotion: 'דְּבֵקוּת', // devekut
        morality: 'מוּסָרִיּוּת', // musariyut
        faithfulness: 'נֶאֱמָנוּת', // ne'emanut
    },

    // ── Plot tile ───────────────────────────────────────────────
    plot: {
        plow: 'חֲרֹשׁ', // kharosh (imperative: plow)
        plant: 'זְרַע', // zra (imperative: sow)
        harvest: 'קְצֹר', // ktsor (imperative: harvest/reap)
        gather: 'אֱסֹף', // esof (imperative: gather/collect sheafs)
        // Orchard-specific actions:
        plantOrchard: 'שְׁתוֹל', // shtol (imperative: plant a vine/tree)
        fertilize: 'דַּשֵּׁן', // dashen (imperative: fertilize)
        tendPrune: 'זְמֹר', // zmor (imperative: prune/tend)
        thinShoots: 'דַּלֵּל', // dalel (imperative: thin shoots)
        pickGrapes: 'בְּצֹר', // btzor (imperative: pick/harvest grapes)
    },

    // ── Dilemma modal ───────────────────────────────────────────
    dilemma: {
        keepAll: 'שְׁמֹר הַכֹּל', // shmor hakol (keep everything)
        free: 'חינם',
        keptByCommunity: 'לקהילה',
        meterAbbrev: {
            devotion: 'ד', // dalet
            morality: 'מ', // mem
            faithfulness: 'נ', // nun
        },
        saveForCycles: 'זְכֹר בְּחִירָה זוֹ לחמש מחזורים', // Remember this choice for 5 cycles
        savedActive: 'שָׁמוּר', // Saved
        savedCyclesLeft: 'מחזורים נותרים', // cycles remaining
    },

    // ── Buildings ───────────────────────────────────────────────
    buildings: {
        categoryLabel: 'מבנים',
        emptySlotLabel: 'בנה', // "Build"
        Farmhouse: 'בית',
        Barn: 'אסם',
        Sheepfold: 'דיר',
        Silo: 'סילו',
    },

    // ── Decisions panel ─────────────────────────────────────────
    decisionsPanel: {
        title: 'נהל החלטות', // Manage Decisions
        noDecisionsYet: 'עדיין לא נתקלת בהחלטות שניתן לשמור', // No saveable dilemmas encountered yet
        noSavedChoice: 'ללא בחירה שמורה', // No saved choice
        manageButtonLabel: 'נהל החלטות', // aria-label for open button
    },
} as const
