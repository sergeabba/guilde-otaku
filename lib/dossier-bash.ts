export interface DossierBashEntry {
  searchQuery: string;
  anilistId: number;
  title: string;
  date: string;
  tag: string;
  color: string;
  review: string;
  cover: string;
  /** Affiche HD (TMDB, 780 px) quand elle existe ; sinon la jaquette AniList. */
  hdCover?: string;
  /** Grande image paysage (TMDB 1280 px, sinon bannière AniList) pour la chronique à la une. */
  backdrop?: string;
  localCover?: string;
  trailer_url?: string;
}

export function normalizeDossierBashKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const MOIS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];

/** « 03 Octobre 2026 » → horodatage (0 si la date est illisible). Sert au tri des chroniques. */
export function dossierBashTime(date: string): number {
  const m = normalizeDossierBashKey(date).match(/^(\d{1,2}) ([a-z]+) (\d{4})$/);
  const month = m ? MOIS.indexOf(m[2]) : -1;
  return m && month >= 0 ? Date.UTC(Number(m[3]), month, Number(m[1])) : 0;
}

/** « 03 Octobre 2026 » → { label: "Automne 2026", school: "2026/27" } (saison d'anime). */
export function dossierBashSeason(date: string): { label: string; school: string } | null {
  const t = dossierBashTime(date);
  if (!t) return null;
  const d = new Date(t), m = d.getUTCMonth(), y = d.getUTCFullYear();
  const label = m <= 2 ? "Hiver" : m <= 5 ? "Printemps" : m <= 8 ? "Été" : "Automne";
  const start = m >= 8 ? y : y - 1;
  return { label: `${label} ${y}`, school: `${start}/${String(start + 1).slice(2)}` };
}

/**
 * Ordre d'affichage : celui de la Chronique (la plus récente en tête de
 * DOSSIER_BASH_DATA, dans l'ordre où elle a été écrite : la première est « à la
 * une ») ; les chroniques connues seulement de la base suivent, les plus récentes d'abord.
 */
export function sortDossierBash<T extends { date: string; title?: string; searchQuery?: string }>(list: T[]): T[] {
  const rank = (e: T) => {
    const keys = [e.title, e.searchQuery].filter(Boolean).map((k) => normalizeDossierBashKey(k!));
    const i = DOSSIER_BASH_DATA.findIndex((d) => keys.includes(normalizeDossierBashKey(d.title)) || keys.includes(normalizeDossierBashKey(d.searchQuery)));
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  };
  return [...list].sort((a, b) => rank(a) - rank(b) || dossierBashTime(b.date) - dossierBashTime(a.date));
}

export function findDossierBashEntry(value: string) {
  const normalizedValue = normalizeDossierBashKey(value);

  return DOSSIER_BASH_DATA.find((entry) => {
    const normalizedEntryTitle = normalizeDossierBashKey(entry.title);
    const normalizedEntrySearch = normalizeDossierBashKey(entry.searchQuery);
    return normalizedEntryTitle === normalizedValue || normalizedEntrySearch === normalizedValue;
  });
}

export const DOSSIER_BASH_DATA: DossierBashEntry[] = [
  // ── Chronique du Bash : saison d'automne 2026 ──
  {
    searchQuery: "Black Clover 2nd Season",
    anilistId: 195604,
    title: "Black Clover Season 2",
    date: "03 Octobre 2026",
    tag: "SHŌNEN TANT ATTENDU",
    color: "#f1a143",
    review: "Le 03 octobre, on aura l'anime le plus attendu de la saison (je pense) avec Black Clover saison 2.\n\nL'adaptation du meilleur arc, nouvelle équipe, l'animation est meilleure, ça fait du bien de revoir la bande à Asta.\n\nLa saison fera 12 épisodes normalement. L'ending est époustouflant. L'opening, wow. Les couleurs... Le jeu des seiyū... non vas-y, j'ai trop de choses à dire sur la saison 2 donc je vais m'arrêter là... Retenez juste que les enfers vont se déchaîner sur le monde, et ce pour notre plus grand plaisir.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx195604-tSZcfKbVqSEG.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/k7XtJOiflFofEOP8l5i75y4p5po.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/qu9epTZh29fGUkY7ZYc9PVsv0Ig.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Black+Clover+Season+2+trailer"
  },
  {
    searchQuery: "Ranma 1/2 (2024) 3rd Season",
    anilistId: 209872,
    title: "Ranma1/2 Season 3",
    date: "03 Octobre 2026",
    tag: "COMÉDIE MAPPA",
    color: "#e4bb5d",
    review: "Un autre anime que j'attends : la saison 3 de Ranma.\n\nBah c'est MAPPA. Le trailer est énervé de fou. C'est juste trop beau.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx209872-RBeVPqwejHFp.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/xvD9urN8lUtWw5fm4a87Rl3dCZn.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Ranma1%2F2+%282024%29+Season+3+trailer"
  },
  {
    searchQuery: "Aoashi 2nd Season",
    anilistId: 191788,
    title: "Aoashi Season 2",
    date: "04 Octobre 2026",
    tag: "FOOTBALL",
    color: "#4ade80",
    review: "La journée du 04 octobre sera également chargée. On aura la saison 2 de l'excellent Ao Ashi.\n\nRien à dire là-dessus par contre.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx191788-XC6F24LdX6a4.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/vXUYKVdvmXjQN1o6RLpMca52sse.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/87IQdOn34p1z2KTdM4IZ1N8bWaH.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Aoashi+Season+2+trailer"
  },
  {
    searchQuery: "Ao no Hako Season 2",
    anilistId: 189123,
    title: "Blue Box Season 2",
    date: "04 Octobre 2026",
    tag: "ROMANCE SPORTIVE",
    color: "#e4ae50",
    review: "On aura également le bon Blue Box (la saison 2 adapte un arc intéressant).\n\nL'opening me parle, la réalisation s'est améliorée, donc je conseille.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx189123-0secXELIhkIW.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/8p39Ud6ZKMixBQ7R4frg2o3idzc.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Blue+Box+Season+2+trailer"
  },
  {
    searchQuery: "Hotel Inhumans 2nd Season",
    anilistId: 199426,
    title: "HOTEL INHUMANS Season 2",
    date: "04 Octobre 2026",
    tag: "ACTION",
    color: "#e45d78",
    review: "Hotel Inhumans saison 2... bah j'en avais parlé mais je n'ai pas suivi, donc vas-y.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx199426-0nBgTV9BrcJn.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/edCc7fsPUERfsYr31dlNsSMUbxA.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/1Ik6i72QjVRNQ3N475uxiFxRrv9.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=HOTEL+INHUMANS+Season+2+trailer"
  },
  {
    searchQuery: "Sasaki to Pii-chan Season 2",
    anilistId: 176314,
    title: "Sasaki and Peeps Season 2",
    date: "07 Octobre 2026",
    tag: "ISEKAI CHILL",
    color: "#1a78d6",
    review: "Sasaki and Peeps... c'est chill, c'est une histoire entre un moineau sage des étoiles et un salary man.\n\nC'est fun et drôle avec un peu d'action, car ça reste un isekai. L'animation de la saison 2 semble bonne.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176314-lpvca6vjmkeO.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/itOssMSSSumlnIiXmdsAh426nEW.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/xljpEwFQF6Rl1rU1w7SEs1pk3YE.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Sasaki+and+Peeps+Season+2+trailer"
  },
  {
    searchQuery: "Kikansha no Mahou wa Tokubetsu desu 2nd Season",
    anilistId: 172192,
    title: "A Returner's Magic Should be Special Season 2",
    date: "07 Octobre 2026",
    tag: "FANTASY",
    color: "#f19328",
    review: "A Returner's Magic Should Be Special... la saison 1 était bien (j'en ai déjà parlé), donc allez-y.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx172192-W7P5xEUaxF3y.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/nrUEjTXayPJjII673Xy2sBbs7vq.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/2KKDIwALX3HJWCjeDnvLa3Ag6ki.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=A+Returner%27s+Magic+Should+be+Special+Season+2+trailer"
  },
  {
    searchQuery: "Tantei wa mou, Shindeiru. Season 2",
    anilistId: 152677,
    title: "The Detective Is Already Dead Season 2",
    date: "07 Octobre 2026",
    tag: "MYSTÈRE",
    color: "#a78bfa",
    review: "Et le retour de The Detective Is Already Dead. Je n'ai suivi que le premier épisode, mais je sais que ça a plu à la commu, donc voilà...",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx152677-gtJbgjE94lCN.png",
    hdCover: "https://image.tmdb.org/t/p/w780/doI3eje4GWgbxDncwTvjBb7W3Z0.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/aqETSDXdeYqcD1PPd2WBfeWtoct.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=The+Detective+Is+Already+Dead+Season+2+trailer"
  },
  {
    searchQuery: "Yozakura-san Chi no Daisakusen 2nd Season Part 2",
    anilistId: 213657,
    title: "Mission: Yozakura Family Season 2 Part 2",
    date: "11 Octobre 2026",
    tag: "ESPIONNAGE",
    color: "#5dbbe4",
    review: "Il n'y a pas grand-chose à dire, mais je note quand même le retour de Yozakura Family pour le 11 octobre.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx213657-ORNXVEBCjXaz.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Mission%3A+Yozakura+Family+Season+2+Part+2+trailer"
  },
  {
    searchQuery: "Dragon Ball Super: Beerus",
    anilistId: 206814,
    title: "Dragon Ball Super: Beerus",
    date: "11 Octobre 2026",
    tag: "LÉGENDE",
    color: "#e48643",
    review: "Dragon Ball Super Beerus : le même film, en mieux, oui.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx206814-PVVzRbf1IQpe.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/sGuCmIy8kEmx3FWZyMj654rF6g8.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/8phLVFEXOe02JgFmH9ldn3j4tXW.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Dragon+Ball+Super%3A+Beerus+trailer"
  },
  {
    searchQuery: "Diamond no Ace act II: Second Season Part 2",
    anilistId: 213658,
    title: "Ace of the Diamond act II Season 2 Part 2",
    date: "11 Octobre 2026",
    tag: "BASEBALL",
    color: "#1a93d6",
    review: "Et la suite d'Ace of Diamond, le 11 octobre.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx213658-D3BPJaqawLxS.png",
    backdrop: "https://image.tmdb.org/t/p/w1280/wq5ZykCAFrboIpz36O8pbrJG2dF.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Ace+of+the+Diamond+act+II+-Second+Season-+trailer"
  },
  {
    searchQuery: "Chitose-kun wa Ramune Bin no Naka Part 2",
    anilistId: 198727,
    title: "Chitose Is in the Ramune Bottle Part 2",
    date: "13 Octobre 2026",
    tag: "TRANCHE DE VIE",
    color: "#7dd3fc",
    review: "Chitose on the Ramune machin... j'en avais parlé, donc vas-y. C'est le 13 octobre.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx198727-BL0JTpg0G8tq.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/4BE1aoCu5mCG3ZJ7alNDQkB3oK4.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Chitose+Is+in+the+Ramune+Bottle+2nd+Cour+trailer"
  },
  {
    searchQuery: "Cyberpunk: Edgerunners 2",
    anilistId: 195539,
    title: "Cyberpunk: Edgerunners 2",
    date: "20 Octobre 2026",
    tag: "CYBERPUNK",
    color: "#fe286b",
    review: "Cyberpunk: Edgerunners 2. C'est la suite qui n'est pas vraiment une suite, vu qu'on aura un nouveau groupe de protagonistes, mais toujours dans le même univers sombre et torturé, avec une D.A que je trouve bien plus marquée.\n\nÇa promet vraiment d'être plus explosif, plus gore, plus cru dans son propos, et ça promet d'être tout aussi intéressant.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx195539-4LdfmKIHzuxr.png",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/195539-lO5SUdp4SOrq.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Cyberpunk%3A+Edgerunners+2+trailer"
  },
  {
    searchQuery: "Made in Abyss: Mezameru Shinpi",
    anilistId: 160275,
    title: "Made in Abyss : le film",
    date: "23 Octobre 2026",
    tag: "FILM ATTENDU",
    color: "#e4d643",
    review: "Le film tant attendu de Made in Abyss, qui sera une suite directe des événements de la saison 2, que je ne spoilerai pas.\n\nMais sachez qu'il y aura de nouveaux personnages, de nouveaux biomes, et ça promet d'être top.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx160275-cBOWJpcCGeMq.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/7HfBlYDlMVaHnvd7NEpZLd8r7FO.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/7vZSK3hXn9fNiaij2YjvNXdwOUn.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Made+in+Abyss%3A+Mezameru+Shinpi+trailer"
  },
  {
    searchQuery: "Watashi no Shiawase na Kekkon Tokubetsu-hen",
    anilistId: 190054,
    title: "My Happy Marriage Special Episodes",
    date: "25 Octobre 2026",
    tag: "ROMANCE",
    color: "#e44378",
    review: "My Happy Marriage revient le 25 octobre.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx190054-8h0AuqQjwcCL.png",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/190054-C8vrENMGNdnu.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=My+Happy+Marriage+Special+Episodes+trailer"
  },
  {
    searchQuery: "Takopii no Genzai: Arigatou, Mata Ashita",
    anilistId: 212539,
    title: "Takopi's Original Sin : le film",
    date: "27 Novembre 2026",
    tag: "FILM",
    color: "#7dd3fc",
    review: "En novembre, il y a juste Takopi. Je ne sais pas pourquoi, et c'est sûrement juste un film sans les coupures de l'anime, car oui, l'anime saute certains passages.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx212539-uiod38Ml39AZ.png",
    hdCover: "https://image.tmdb.org/t/p/w780/dM9eKAo5g5XiQcgEynX02WxTWr4.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/dpyInGkAFOWle2KVvRGqj9Ywef8.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Takopii+no+Genzai%3A+Arigatou%2C+Mata+Ashita+trailer"
  },
  {
    searchQuery: "Kusuriya no Hitorigoto: Bouhi no Hihou",
    anilistId: 200929,
    title: "The Apothecary Diaries: The Late Lady's Treasure",
    date: "11 Décembre 2026",
    tag: "FILM",
    color: "#e4bba1",
    review: "À noter en décembre : le film sur Les Carnets de l'apothicaire.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx200929-dx3hnftE7K7C.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=The+Apothecary+Diaries%3A+The+Late+Lady%E2%80%99s+Treasure+trailer"
  },
  {
    searchQuery: "Disney Twisted-Wonderland: THE ANIMATION - Season 2: EPISODE of SAVANACLAW",
    anilistId: 202282,
    title: "Disney Twisted-Wonderland Season 2",
    date: "23 Décembre 2026",
    tag: "FANTASY DISNEY",
    color: "#e4bb35",
    review: "La suite de Disney Twisted-Wonderland, en décembre.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx202282-WOXxDA9Wwey5.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/27ntwTTA3ygsktcwiJYcximegwb.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Disney+Twisted-Wonderland%3A+THE+ANIMATION+-+Season+2%3A+EPISODE+of+SAVANACLAW+trailer"
  },
  // ── Saison de printemps 2026 ──
  {
    searchQuery: "Jishou Akuyaku Reijou na Konyakusha no Kansatsu Kiroku",
    anilistId: 192808,
    title: "Observation Records of my Fiancée",
    date: "06 Avril 2026",
    tag: "ROMANCE MÉDIÉVALE",
    color: "#f472b6",
    review: "Cecil, insensible aux émotions, s'intéresse à sa fiancée, Tia, qui prétend être une réincarnation, renaissant sous les traits de la méchante d'un jeu otome. La croyant d'abord folle, Cecil entre dans son jeu ; jusqu'à ce que les événements prédits par Tia commencent à se réaliser.\n\nC'est donc une go qui se trouve dans un otome game et bah elle se fera passer pour une vilaine. Visuellement c'est assez mignon en vrai, le chara design est une vraie réussite et les personnages arrivent à être assez émotif et le travail sur les yeux est important... Néanmoins l'oeuvre semble être assez mid. Mais bref c'est pas deconnant de l'essayer.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx192808-tfrX4Gn2Y1Ye.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/ayhpfFHm1MtgPgLw3yN0euOUxsp.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/esmoeVNjHb4SAXRQJpkSoPX4nFB.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Observation+Records+of+my+Fiancée+anime+trailer"
  },
  {
    searchQuery: "Ponkotsu Fuuki Iin to Skirt take ga Futekisetsu na JK no Hanashi",
    anilistId: 189987,
    title: "The Klutzy Class Monitor",
    date: "06 Avril 2026",
    tag: "ROM-COM COLORÉE",
    color: "#60a5fa",
    review: "Sakuradaimon est chargé de veiller au respect des règles à l'entrée du lycée. Il interpelle régulièrement Poem à cause de ses tenues inappropriées. Mais lorsqu'ils se retrouvent dans la même classe de rattrapage, elle découvre son secret : aussi sérieux et rigide soit-il, Sakuradaimon est en fait nul en études !\n\nOn suivra donc ici une romance mignonne basée sur le quiproquo entre deux personnes qui normalement tout oppose. Pour ce qui est du visuel c'est super top, c'est très coloré, les chara-design sont super chatoyant, et la palette de couleur donne le ton : on aura une aventure haute en couleur.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx189987-CkTDPfD7vu2Y.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/uBHcmbmC3TccLO6hdrttOpjy4bN.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/8EaA5ffwNJv4uBwmfUWT06WY5ee.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=The+Klutzy+Class+Monitor+and+the+Girl+with+the+Short+Skirt+trailer"
  },
  {
    searchQuery: "Class de 2-banme ni Kawaii Onnanoko to Tomodachi ni Natta",
    anilistId: 169580,
    title: "I Made Friends with the Second Prettiest",
    date: "07 Avril 2026",
    tag: "ROMANCE & QUOTIDIEN",
    color: "#a78bfa",
    review: "Tout est dans le titre en gros ça sera l'histoire classique entre le no name et la fille populaire. On suivra Maehara Maki, jeune homme solitaire n'ayant pas d'amis. Il va rencontrer Asanagi, la deuxième fille la plus populaire, dans un vidéo club et de là naîtra une belle amitié... et qui sait ? Peut-être plus.\n\nC'est un trope assez basique mais qui peut marcher. L'anime promet un bon petit développement, et une belle petite relation avec sûrement un trio amoureux... l'oeuvre semble aussi bien écrite alors je me dis pourquoi pas.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx169580-nXxpmqu6UVux.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/8Y90sEn06eQTf1hZ8qd3CnV3IAp.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/sLLcDWhWCTWPn6hJgLcVtk9dhr.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=I+Made+Friends+with+the+Second+Prettiest+in+My+Class+trailer"
  },
  {
    searchQuery: "Tadaima, Ojamasaremasu!",
    anilistId: 202985,
    title: "Pardon the Intrusion, I'm Home!",
    date: "07 Avril 2026",
    tag: "HAREM INVERSÉ",
    color: "#4ade80",
    review: "L'histoire suit Rinko Nakayama, jeune OL de 24 ans passionnée d'anime. Elle remarque quelque chose d'anormal dans sa maison, quand elle suit un anime différent de son anime préféré son voisin cogne fort contre le mur... À l'aide de son autre voisin elle va réussir à élucider le mystère.\n\nIci on est en face typiquement à un anime super simple avec un principe assez simple, et il sera intéressant. L'alchimie entre les personnages se voit à distance, y'a de l'humour, mais sûrement un humour tout simple, tout chill. Visuellement c'est beau, et celui-là ne déroge pas à la règle.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx202985-WsJv1knJoRFL.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/ipc7ChnTAVAQWJm01UJFq3sjiOL.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/ytpYtFoZ7nZGvNHySLYufTFpZB9.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Pardon+the+Intrusion+I%27m+Home+anime+trailer"
  },
  {
    searchQuery: "Honzuki no Gekokujou Season 4",
    anilistId: 171110,
    title: "Ascendance of a Bookworm S4",
    date: "04 Avril 2026",
    tag: "BIJOU SLICE OF LIFE",
    color: "#fbbf24",
    review: "On suit une femme amoureuse des livres, qui se réincarne dans le corps d'une enfant dans un monde où le taux d'analphabétisation est très haut. Pour assouvir sa soif de lecture elle va elle-même se mettre à créer des livres !\n\nL'œuvre est apparemment un pur bijou, il a eu pas mal de distinctions assez intéressantes. C'est le slice of life le plus impressionnant de la saison, c'est juste magnifique, j'ai pas d'autres mots, c'est juste grandiose, l'animation est incroyable. C'est un anime feel-good, il a l'air super chill et mignon.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171110-7zOdInS6DQNL.jpg",
    backdrop: "https://s4.anilist.co/file/anilistcdn/media/anime/banner/171110-lgtmKokpevUM.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Ascendance+of+a+Bookworm+Season+4+trailer"
  },
  {
    searchQuery: "NEEDY GIRL OVERDOSE",
    anilistId: 202102,
    title: "NEEDY GIRL OVERDOSE",
    date: "04 Avril 2026",
    tag: "PSYCHÉDÉLIQUE & DARK",
    color: "#ef4444",
    review: "Idols, musique, paillettes, drogue, violence, suicide, mutilation, sang, tronçonneuse... Oui, ces mots n'ont rien à faire ensemble normalement mais pourtant c'est bien ce que nous promet NEEDY GIRL OVERDOSE.\n\nAme-Chan entretient une relation toxique avec P-Chan et a un besoin extrême d'attention. Elle devient streameuse sous le pseudo de 'KAngel'. Bref, le plus important et le plus choquant ici est la D.A, wow, c'est incroyable. C'est très 'jeu vidéo dérangeant'. L'œuvre n'est pas adaptée à tout le monde, c'est cru, c'est sombre, et ça peut être limite traumatisant.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx202102-7qDmTI7eT5xF.png",
    hdCover: "https://image.tmdb.org/t/p/w780/jl79CIc8yL0m5VKR2X1qkoAsre0.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/dot1NI6F5IrLck8xWIOn74ieaDH.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Needy+Girl+Overdose+anime+trailer"
  },
  {
    searchQuery: "Himitsu no AiPri",
    anilistId: 171080,
    title: "Onegai AiPri",
    date: "05 Avril 2026",
    tag: "IDOLS & MAGICAL GIRLS",
    color: "#f472b6",
    review: "C'est juste des idols/magical girl. C'est un peu trop coloré même pour moi, mais vu que je pense que c'est le seul anime du genre, je le cite.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171080-5d1bxwJRQ4vk.png",
    hdCover: "https://image.tmdb.org/t/p/w780/7fodK8119NeyY15MRJXMnd9nfAu.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/kNAVW7Keeu9bWokG12wDGBTuqxC.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Onegai+AIpri+trailer"
  },
  {
    searchQuery: "Ghost Concert missing Songs",
    anilistId: 201090,
    title: "Ghost Concert",
    date: "05 Avril 2026",
    tag: "IA vs HUMAIN",
    color: "#38bdf8",
    review: "On est dans un futur où l'IA a remplacé la musique et les protagonistes vont tout faire pour remettre l'humain au centre de la musique. GC est ce genre d'anime qui divertit et nous fait réfléchir sur notre façon de vivre et de consommer le divertissement.\n\nC'est beau, c'est bien animé également, les personnages auront des 'pouvoirs' donc y'aura de la casse. J'espère que l'anime peut être une critique du monde actuel en étant super pertinent.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx201090-HzQKUjjvde32.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/yMt59KZr0OewyRs31Vd3zWuneeW.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/heV7FqcSbz9zWerL0Uj8dAoyIXP.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Ghost+Concert+Missing+songs+trailer"
  },
  {
    searchQuery: "Megami Isekai Tensei Nani ni Naritai Desu ka Ore Yuusha no Rokkotsu de",
    anilistId: 206951,
    title: "MegaOre",
    date: "07 Avril 2026",
    tag: "ISEKAI ABSURDE",
    color: "#8b5cf6",
    review: "On suit l'histoire d'un homme qui meurt et se réincarne en... côte humaine ! Mais attention, pas n'importe laquelle, la côte d'un héros qui a un harem et qui est super beau.\n\nOn a une parodie exacerbée de l'état du marché de l'isekai moderne, l'œuvre détourne avec humour et sans aucune subtilité tous les clichés du genre. Visuellement, c'est l'anime le plus absurde de la saison, tantôt des marionnettes, tantôt des power rangers... Soit ça sera l'anime le plus drôle, soit le plus étrange.",
    localCover: "/covers/dossier-bash/206951/cover.jpg",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx206951-qiHcrw7pwzuq.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/zXGD7HbBtqdTpfSbi5Dq2Qo6tCN.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/zheGPQDo6pOM4Dg1sE6GB246Usp.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Megami+Isekai+ni+MegaOre+trailer"
  },
  {
    searchQuery: "Hidarikiki no Eren",
    anilistId: 158036,
    title: "EREN THE SOUTHPAW",
    date: "07 Avril 2026",
    tag: "GÉNIE vs TRAVAIL",
    color: "#f97316",
    review: "Koichi Asakura, jeune lycéen passionné d'art, tombe sur une œuvre d'EREN Yamagishi, un vrai génie qui a décidé de renoncer à son talent. L'œuvre mettra ici la confrontation entre un génie qui a abandonné son talent et un gars sans talent qui lui n'abandonne pas.\n\nL'œuvre nous renvoie à la vérité cruelle derrière la réussite et l'art. Ça a l'air super bien surtout dans le fond. Dans la forme aussi c'est pas mal, avec une animation sympa et des seiyuu pleins de talent.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx158036-KfXv0BFBUsWl.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/8Qnw5PtScEEOdlEWsGN5cwPYwGQ.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/4lfbfiNYyiM27U6BwT94taynXXH.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Eren+the+Southpaw+anime+trailer"
  },
  {
    searchQuery: "Otaku ni Yasashii Gal wa Inai",
    anilistId: 199588,
    title: "Gals Can't Be Kind to Otaku??",
    date: "07 Avril 2026",
    tag: "HAREM CLASSIQUE",
    color: "#ec4899",
    review: "On suit un puceau otaku nerd à lunette qui grâce au destin va rencontrer une gyal magnifique qui va tomber amoureuse de lui... ensuite une deuxième va se rajouter et on suivra son quotidien aux côtés de ces deux beautés fatales.\n\nQue dire ? Bah c'est le harem classique, enfin le triangle amoureux classique entre le nerd et la fille canon. Visuellement c'est chouette, les filles sont vraiment magnifiques, l'animation aussi est pas mal... à surveiller mais ça sera mid sûrement.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx199588-swWolWwf5mZx.png",
    hdCover: "https://image.tmdb.org/t/p/w780/mpbX1OQTNoWbqY0ixz280GLrURy.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/7837uc8fhaREbOVnqIwXrFu335o.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Gals+can%27t+be+kind+to+Otaku+anime+trailer"
  },
  {
    searchQuery: "Hime Kishi wa Barbaroi no Yome",
    anilistId: 182483,
    title: "The Warrior Princess",
    date: "09 Avril 2026",
    tag: "DARK ROMANCE",
    color: "#7f1d1d",
    review: "Seraphina de Ravilant, commandante en cheffe d'une armée, se fait faire prisonnière par Vehor... s'attendant à la pire torture, son ravisseur veut juste l'épouser ! Et de là commencera une cohabitation étrange.\n\nC'est vraiment de la dark romance, elle tombe amoureuse de son ravisseur, il a des abdos, c'est un daddy, il est beau... bref absolument pas ma came, mais voilà ça peut plaire. L'animation est top tier.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx182483-La7chs6htDWr.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/qEVAv7TMtJw9wiuFGVOeoePJWeR.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/xVRpdsYlQR6hsapwFbwxVnFXDBH.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=The+Warrior+Princess+and+the+Barbaric+Prince+trailer"
  },
  {
    searchQuery: "Kujima Utaeba Ie Hororo",
    anilistId: 177508,
    title: "Kujima : Why Sing, When You Can Warble?",
    date: "09 Avril 2026",
    tag: "COMÉDIE ABSURDE",
    color: "#d97706",
    review: "On suit un échoué au bac qui découvre Kujima, une espèce d'oiseau géant qui parle. Il décide de le recueillir, au début juste pour l'hiver, et on suivra le quotidien de cette famille étrange.\n\nEn vrai c'est super bon délire, c'est une comédie qui ne se prend pas au sérieux, c'est très absurde, mais ça peut et ça va plaire aux gens. La prod est sympa au passage.",
    cover: "https://a.storyblok.com/f/178900/707x1000/614f8589aa/kujima_why_sing_when_you_can_warble_key_art.jpg/m/filters:quality(95)format(webp)",
    hdCover: "https://image.tmdb.org/t/p/w780/agXbnHcwfL0kfh46mjaZbBxKlXQ.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/xXuog5n4JCsPvkfnsLOSgjBvXnE.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Kujima+Why+Sing+When+You+Can+Warble+trailer"
  },
  {
    searchQuery: "Kamiina Botan, Yoeru Sugata wa Yuri no Hana",
    anilistId: 187869,
    title: "Botan Kamiina Fully Blossoms When Drunk",
    date: "10 Avril 2026",
    tag: "ROMANCE & DÉBAUCHE",
    color: "#f87171",
    review: "Botan, jeune étudiante de 20 ans, découvre l'alcool après sa rencontre avec Ibuki, la responsable du dortoir. Au cours de soirées mi-éméchées mi-heureuses, elles deviennent 'drinking buddies'. C'est aussi rafraîchissant qu'une bière et tout mignon. Si vous aimez le vin et les romances entre lesbiennes, c'est pour vous !",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx187869-LUn3dyTzuKUq.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/se1dHUNQMRwUt75xRqkQRmXJicg.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/krbKWrBEOjPdUmp1CGRgRVnLsrs.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Botan+Kamiina+Fully+Blossoms+When+Drunk+trailer"
  },
  {
    searchQuery: "Kami no Shizuku",
    anilistId: 202508,
    title: "THE DROPS OF GOD",
    date: "10 Avril 2026",
    tag: "LE ONE PIECE DU VIN",
    color: "#7c2d12",
    review: "C'est le One Piece du vin. On suit le monde viticole qui débute avec la mort de Kanzaki, célèbre critique œnologique. Son héritage ne revient pas directement à son fils Shizuku : il devra identifier 12 vins exceptionnels, les 12 apôtres.\n\nOn suivra des confrontations intéressantes entre amateurs du vin, qui à l'aide de leurs palais divins devront retrouver les vins en question. Shizuku lui malheureusement est dégoûté par le vin, ce qui fera que ça sera intéressant de voir comment il fera. Un grand cru de cette saison.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx202508-dk6LEyevJYUY.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/eJngpqzGzppVkR5XoM9uuPFOukn.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/dWhXUMlQuSoASikDLbUfKyPtGeB.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=The+Drops+of+God+anime+trailer"
  },
  {
    searchQuery: "Yowa Yowa Sensei",
    anilistId: 185211,
    title: "Yowayowa Sensei",
    date: "11 Avril 2026",
    tag: "ECCHI & CULTURE",
    color: "#f87171",
    review: "Juste un anime de culture, un ecchi sur une sensei très maladroite à très forte poitrine. Et vous imaginez déjà ce qu'il se fera avec sa grosse poitrine. Le chara design c'est comme 100 girlfriends je trouve.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx185211-ewfgT5Cn99k0.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/tHjbyrqvbBkF6XwZgdSn3o74WzK.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/dKA8y1HxEq09M11p896hBkZsku1.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Yowayowa+Sensei+anime+trailer"
  },
  {
    searchQuery: "Aishiteru Game wo Owarasetai",
    anilistId: 194393,
    title: "I WANT TO END THIS LOVE GAME",
    date: "14 Avril 2026",
    tag: "LOVE GAME CLASSIQUE",
    color: "#fb7185",
    review: "L'histoire suivra deux amis d'enfance qui depuis petit s'amusent à se dire 'je t'aime' et le premier à craquer bah il perd. Et qui dit amis d'enfance dit amour réel, mais ça va cacher ça sous des trucs.\n\nÇa a l'air correct sans plus, ça manque clairement du génie de Kaguya Sama mais ça peut être divertissant si vous aimez les relations basées sur les quiproquos et les mielleuses situations.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx194393-0H9yYABu6y0i.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/vNXVxjzHrUFnhZkZlQgvdUmzG4Q.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/rep8uV9N7jSYpxpxH7glSP6qOmp.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=I+Want+to+End+This+Love+Game+trailer"
  },
  {
    searchQuery: "Candy Caries",
    anilistId: 205772,
    title: "Candy Caries",
    date: "15 Avril 2026",
    tag: "ÉTRANGE & PÂTE À MODELER",
    color: "#4b5563",
    review: "Je sais absolument pas c'est quoi cette merde, mais j'en parle parce que je dois finir la rubrique mais c'est trop étrange, c'est juste une histoire de carie, de démon, le tout en pâte à modeler/slow motion, du fond des enfers.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx205772-kb2YOaXFfPAB.png",
    hdCover: "https://image.tmdb.org/t/p/w780/a7sm6GnT2NfO9l7N4e8JGpYw7eN.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/7UywPXaiCJ43zysmaq82RKoGIEi.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Candy+Caries+anime+trailer"
  },
  {
    searchQuery: "Shunkashuutou Daikousha Haru no Mai",
    anilistId: 190143,
    title: "Agents of the Four Season",
    date: "28 Mars 2026",
    tag: "L'INCONTOURNABLE",
    color: "#4ade80",
    review: "De quoi ça parle ?\nAu commencement n'existait que l'Hiver qui, incapable de supporter la solitude, choisit de se couper une partie de son essence pour donner naissance au Printemps. Par la volonté de la Terre Mère, il se coupa à nouveau une partie de son essence pour engendrer l'Été et l'Automne.\n\nDe l'oeuvre se dégage une certaine poésie, le ton des couleurs, la nature tout ou presque dans cet anime appelle à la contemplation et à la beauté. Un incontournable de la saison !",
    cover: "https://www.nautiljon.com/images/manga/00/33/agents_of_the_four_seasons_-_la_danse_du_printemps_23733.webp",
    hdCover: "https://image.tmdb.org/t/p/w780/s8kMT6SmeAt7HovSJWbgIEvjmdm.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/lQcUbt8Rs0TcmIhsVGpoEeqWHwE.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Agents+of+the+Four+season+Dance+of+spring+trailer"
  },
  {
    searchQuery: "Maid-san wa Taberu dake",
    anilistId: 197868,
    title: "The Food Diary of Miss Maid",
    date: "02 Avril 2026",
    tag: "ANIME ASMR",
    color: "#f472b6",
    review: "Pour moi ce sera l'anime Asmr de la saison. On suivra juste la routine gustative (et non culinaire) d'une servante.\n\nLe ton de l'anime est chill et coloré et on suivra des personnages manger tout au long de la série. Entre nourriture et petite tranche de vie, c'est un anime à dévorer sans modération !",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx197868-sm5jcjPKWhNL.png",
    hdCover: "https://image.tmdb.org/t/p/w780/3HYUZAeE1WrA9ATGv6GjeyL6mOO.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/z53MYSiEOGvQ3tcD51I3Sb35Frx.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=The+Food+Diary+of+Miss+Maid+trailer"
  },
  {
    searchQuery: "Ganbare! Nakamura-kun!!",
    anilistId: 180228,
    title: "Go For It, Nakamura-kun!",
    date: "02 Avril 2026",
    tag: "ROMANCE BL",
    color: "#60a5fa",
    review: "Je préviens avant de commencer : c'est réellement une romance entre deux hommes. On suivra Nakamura, un jeune homme amoureux de son camarade de classe Hirose, qui tentera tant bien que mal d'entamer une romance avec lui...\n\nLe rendu est super bien. Il oscille entre le tendre, le mignon et l'adorable tout en explorant la complexité des relations avec une certaine justesse. Pour les amoureux de YAOI et de BL, c'est un incontournable !",
    cover: "https://m.media-amazon.com/images/M/MV5BMmRjYmZjMGItMGQ1Mi00OTZmLThmMTItYjMxZWZhNWNjNjczXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/rCI8bgsqoq2ho04ZE0gUr36l8Pg.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/wpsLsjCcIf3QexYO6pCaLm9PI0Z.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Go+For+It+Nakamura+trailer"
  },
  {
    searchQuery: "Nigashita Sakana wa Ookikatta",
    anilistId: 201817,
    title: "Always a Catch",
    date: "02 Avril 2026",
    tag: "ROMANCE FLUIDE",
    color: "#ffd700",
    review: "Le synopsis est tout simple : Maria était destinée à devenir l'héritière de sa famille, mais la naissance de son petit-frère l'oblige à céder sa place. Elle décide de partir étudier dans un pays voisin dans l'espoir de trouver un mari. Cependant, à son arrivée, le prince annonce la rupture de leurs fiançailles.\n\nLa production a l'air super modeste, mais c'est une oeuvre qui va plaire aux amoureux de romance du genre, même si ça restera un anime moyen.",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx201817-pyfL9F8muPeq.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/o5Gw2Wcd8saEpzQgzpUBwiqJ3WG.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/yczDaFhOEmNe0omdvGpYLu050dg.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Always+a+catch+anime+trailer"
  },
  {
    searchQuery: "Kirio Fanclub",
    anilistId: 181284,
    title: "Kirio Fan Club",
    date: "02 Avril 2026",
    tag: "LOUFOQUE & COLORÉ",
    color: "#a78bfa",
    review: "On suivra AIMI et NAMI, deux camarades de classes qui ont toutes les deux un crush sur Kirio (dont on ne voit jamais le visage d'ailleurs). Elles vont enchainer les trucs étranges et loufoques et leur obsession deviendra le prétexte à une rivalité étrange entre deux filles qui ne parlent que du même mec.\n\nCe qui est sûr, c'est que ça sera particulier de voir le point de vue de ces deux femmes. Je pense qu'ici on va surtout rire !",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx181284-JJafhd5gDT53.jpg",
    hdCover: "https://image.tmdb.org/t/p/w780/yy9gsBKHX9PHq17mJhhm2yVKh8g.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/5XnCFHGrBCDsZCH4Aihr4PsNXBe.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Kirio+Fan+Club+anime+trailer"
  },
  {
    searchQuery: "Haibara-kun no Tsuyokute Seishun New Game",
    anilistId: 195333,
    title: "Haibara Teenage New Game",
    date: "02 Avril 2026",
    tag: "REVANCHE TEMPORELLE",
    color: "#38bdf8",
    review: "On est clairement sur du school-life/voyage temporel. C'est toujours intéressant de voir un gars prendre sa revanche sur la vie. La réalisation est sommaire mais la bande son est bonne. J'aime beaucoup l'opening, il sera dans mon top 10 à coup sûr. Bref, un anime à ne pas négliger !",
    cover: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx195333-KUIF1eqOdVdd.png",
    hdCover: "https://image.tmdb.org/t/p/w780/3Bxl4kYXdGMMIoZXgDGzo26OiGH.jpg",
    backdrop: "https://image.tmdb.org/t/p/w1280/4QRcFqAJq0Jpi5jfQ2ExxVJtWCv.jpg",
    trailer_url: "https://www.youtube.com/results?search_query=Haibara+Teenage+New+Game+anime+trailer"
  }
];
