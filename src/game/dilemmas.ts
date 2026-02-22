import type { Dilemma } from "@/types";

// Wheat costs use exact fractions; applyWheatCost (Math.floor) is applied at resolution time.
// e.g. 14% of 10 wheat = 1.4 → floors to 1 wheat deducted.

export const DILEMMAS: Dilemma[] = [
  {
    id: "peah",
    title: "פֵּאָה — פִּנַּת הַשָּׂדֶה",
    narrative:
      "הַקָּצִיר הֵסְתַּיֵּם. הַמָּסֹרֶת מְצַוָּה לְהַשְׁאִיר אֶת פִּנּוֹת הַשָּׂדֶה בִּלְתִּי קְצוּרוֹת, כְּדֵי שֶׁהָעֲנִיִּים יוּכְלוּ לְלַקֵּט. עַד כַּמָּה תִּהְיֶה נָדִיב?",
    choices: [
      {
        label: "הַשְׁאֵר פִּנּוֹת נְדִיבוֹת",
        description:
          "אַתָּה מַשְׁאִיר שְׁלֹשָׁה אֲחוּזִים מִן הַיְּבוּל לָעֲנִיִּים",
        wheatCost: 3,
        meterEffect: { morality: +10, devotion: +5 },
      },
      {
        label: "הַשְׁאֵר פִּנּוֹת מִינִימָלִיּוֹת",
        description: "אַתָּה מַשְׁאִיר אֶחָד אֶחוּזִים בִּלְבַד",
        wheatCost: 1,
        meterEffect: { morality: +3, devotion: +1 },
      },
      {
        label: "שְׁמֹר הַכֹּל",
        description: "אַתָּה לוֹקֵחַ אֶת כָּל הַקָּצִיר לְעַצְמְךָ",
        wheatCost: 0,
        meterEffect: { morality: -5, devotion: -3 },
      },
    ],
  },
  {
    id: "shikchah",
    title: "שִׁכְחָה — הָעֹמֶר הַנִּשְׁכָּח",
    narrative:
      "בְּשָׁעָה שֶׁאָסַפְתָּ אֶת הָעֳמָרִים מִן הַשָּׂדֶה, הִבַּטְתָּ לְאָחוֹר וּרְאִיתָ עֳמָרִים שֶׁנִּשְׁאֲרוּ. הַמָּסֹרֶת מְצַוָּה: אַל תָּשׁוּב לְקַחְתָּם — יִהְיוּ לָעָנִי וְלַגֵּר. מַה תִּבְחַר?",
    choices: [
      {
        label: "הַשְׁאֵר שְׁנֵי עֳמָרִים",
        description: "אַתָּה מַשְׁאִיר שְׁנֵי עֳמָרִים לָעֲנִיִּים כַּמִּצְוָה",
        wheatCost: 2,
        meterEffect: { morality: +12, devotion: +6 },
      },
      {
        label: "הַשְׁאֵר עֹמֶר אֶחָד",
        description: "אַתָּה מַשְׁאִיר עֹמֶר אֶחָד לָעֲנִיִּים",
        wheatCost: 1,
        meterEffect: { morality: +5, devotion: +2 },
      },
      {
        label: "שׁוּב וְקַח הַכֹּל",
        description: "אַתָּה חוֹזֵר וְלוֹקֵחַ אֶת כָּל הָעֳמָרִים לְעַצְמְךָ",
        wheatCost: 0,
        meterEffect: { morality: -6, devotion: -3 },
      },
    ],
  },
  {
    id: "maaser",
    title: "מַעֲשֵׂר",
    narrative:
      "הַקָּצִיר נֶאֱסַף. אַתָּה שׁוֹקֵל כֵּיצַד לְחַלֵּק אוֹתוֹ עִם הַקְּהִלָּה. כֵּיצַד תַּקְצֶה אֶת הַמַּעַשְׂרוֹת?",
    choices: [
      {
        label: "מַעֲשֵׂר שָׁלֵם",
        description: "אַתָּה נוֹתֵן אֶת הַחֵלֶק הַמָּלֵא לַקְּהִלָּה",
        wheatCost: 1.4, // 14% of WHEAT_PER_HARVEST (10) = 1.4; floors to 1
        meterEffect: { faithfulness: +8, devotion: +5, morality: +5 },
      },
      {
        label: "מַעֲשֵׂר חָלְקִי",
        description: "אַתָּה נוֹתֵן מַחֲצִית מִן הַמַּעֲשֵׂר",
        wheatCost: 1, // 10% of 10 = 1
        meterEffect: { faithfulness: +4, devotion: +2 },
      },
      {
        label: "וַיַּעֲבֹר אֶל דַּרְכּוֹ",
        description: "אַתָּה מַשְׁאִיר אֶת הַכֹּל לְעַצְמְךָ הַפַּעַם",
        wheatCost: 0,
        meterEffect: { faithfulness: -5, devotion: -3 },
      },
    ],
  },
];
