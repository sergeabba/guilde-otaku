export type Rank =
  | "Fondateur"
  | "Monarque"
  | "Ex Monarque"
  | "Ordre Céleste"
  | "New G dorée"
  | "Futurs Espoirs"
  | "Vieux Briscard"
  | "Fantôme"
  | "Revenant";

export interface FighterStats {
  force: number;
  vitesse: number;
  technique: number;
}

export interface SpecialAttack {
  name: string;
  effect: string;
}

export interface Member {
  id: number;
  name: string;
  rank: Rank;
  birthday: string;
  bio: string;
  photo: string;
  animeChar: string;
  color: string;
  badge?: string;
  rankJP?: string;
  stats: FighterStats; // Ajout des stats
  special: SpecialAttack; // Ajout du coup spécial
}

export const members: Member[] = [
  { 
    id: 1, name: "Craig Ryan", rank: "Fondateur", birthday: "21 juin", bio: "Milliardaire suisse, mangaka, philanthrope, acteur, footballeur à ses heures perdues, recordman des quiz de cette guilde, il a tout accompli.", photo: "/photos/craig.jpg", animeChar: "/anime/craig_anime.jpg", color: "#FFD700",
    stats: { force: 95, vitesse: 90, technique: 99 },
    special: { name: "Quiz Omniscient", effect: "Stun l'adversaire avec une question impossible." }
  },
  { 
    id: 2, name: "Jaïze Ben", rank: "Monarque", birthday: "01 Août", bio: "La forme de vie ultime, l'inéluctable, l'inamovible, le sucre et le sel, le jour et la nuit ; depuis trois ans, Dakar pleure cet homme.", photo: "/photos/jaize.jpg", animeChar: "/anime/jaize_anime.jpg", color: "#FFD700", badge: "JAIZE D'OR",
    stats: { force: 99, vitesse: 99, technique: 99 },
    special: { name: "L'Inéluctable", effect: "Ignore la défense adverse et frappe directement l'âme." }
  },
  { 
    id: 3, name: "Dr Leyna-Chloé", rank: "Monarque", birthday: "22 octobre", bio: "La Grande Dr Leyna-Chloé, également nommée la Mère du Peuple ; elle nous guidera tous à la Christmas Bowl. Charisme digne d'une reine.", photo: "/photos/leyna.jpg", animeChar: "/anime/leyna_anime.jpg", color: "#FFD700",
    stats: { force: 75, vitesse: 82, technique: 96 },
    special: { name: "Aura Maternelle", effect: "Restaure 50% de ses PV et paralyse l'ennemi de respect." }
  },
  { 
    id: 4, name: "Serge \"Le Don\"", rank: "Ex Monarque", birthday: "12 mars", bio: "Vagabond, héros du Méta dans son esprit, l'un des premiers monarques de la première ère d'Otaku, toujours dévoué à la gente féminine.", photo: "/photos/serge.JPG", animeChar: "/anime/serge_anime.jpg", color: "#FFD700",
    stats: { force: 88, vitesse: 92, technique: 85 },
    special: { name: "Esquive Méta", effect: "Se déplace dans le Métavers pour esquiver la prochaine attaque." }
  },
  { 
    id: 5, name: "Roys", rank: "Monarque", birthday: "29 janvier", bio: "Ballon d'Or 2006 et 2026, actuel MVP du groupe Otaku, le Sage de la Cuisse Fang, éternellement âgé de quinze ans depuis 2021.", photo: "/photos/roys.jpg", animeChar: "/anime/roys_anime.jpg", color: "#FFD700", badge: "BALLON D'OR 2026",
    stats: { force: 92, vitesse: 96, technique: 90 },
    special: { name: "Frappe d'Or", effect: "Tir fulgurant qui brise la garde ennemie." }
  },
  { 
    id: 6, name: "Gabriel \"Gabibou\"", rank: "Monarque", birthday: "04 Juin", bio: "Monsieur Trois Puces, l'ange Gabriel lui-même, Gabibou le Vide Atah, la manigance, homme fort et discret, monarque depuis les temps immémoriaux.", photo: "/photos/gabriel.jpg", animeChar: "/anime/gabriel_anime.jpg", color: "#FFD700",
    stats: { force: 85, vitesse: 94, technique: 98 },
    special: { name: "Vide Atah", effect: "Annule l'attaque ennemie par pure manigance." }
  },
  { 
    id: 7, name: "Anthony", rank: "Monarque", birthday: "29 mai", bio: "Le monstre Anthony, dans sa jeunesse surnommé Copycut, l'homme le plus rapide de l'Ouest, champion universitaire, playboy malgré lui.", photo: "/photos/anthony.jpg", animeChar: "/anime/anthony_anime.jpg", color: "#FFD700",
    stats: { force: 80, vitesse: 100, technique: 88 },
    special: { name: "Flash Copy", effect: "Copie et renvoie l'attaque adverse à double vitesse." }
  },
  { 
    id: 8, name: "Mike", rank: "Monarque", birthday: "27 Mars", bio: "All Mike, Ultimo Diez, plus grand numéro 10 de l'histoire du BFC. Élu surcoté de l'année 2025, sûrement à cause de TikTok.", photo: "/photos/mike.jpg", animeChar: "/anime/mike_anime.jpg", color: "#FFD700", badge: "SURCOTÉ 2025",
    stats: { force: 82, vitesse: 85, technique: 95 },
    special: { name: "Ultimo Diez", effect: "Passe décisive fatale : invoque une attaque surprise hors de l'écran." }
  },
  { 
    id: 9, name: "Maxime \"MX Geek\"", rank: "Monarque", birthday: "02 Décembre", bio: "Le Scientifique, ancienne légende du rap, vit désormais une existence paisible tel le roi Boji, mais le Cristiano-Grappling surgit s'il y a heja.", photo: "/photos/maxime.jpg", animeChar: "/anime/maxime_anime.jpg", color: "#FFD700",
    stats: { force: 94, vitesse: 80, technique: 92 },
    special: { name: "Cristiano-Grappling", effect: "Prise de soumission au sol impossible à briser." }
  },
  { 
    id: 10, name: "Hugo", rank: "Monarque", birthday: "30 Septembre", bio: "Le bachelor, le bonbon de ces dames, HUGOAT, disponible uniquement le jeudi (et popoh), mais dernièrement de plus en plus actif.", photo: "/photos/hugo.JPG", animeChar: "/anime/hugo_anime.jpg", color: "#FFD700",
    stats: { force: 85, vitesse: 88, technique: 90 },
    special: { name: "Charme du Jeudi", effect: "Réduit l'attaque ennemie de 50% sous l'effet du charisme." }
  },
  { 
    id: 11, name: "Kévin", rank: "Monarque", birthday: "07 Mars", bio: "L'homme aux mille et une références, Makaga Goumin Makaga Prime, statisticien à Lindsey, parle couramment japonais. Feyman du groupe depuis 2021.", photo: "/photos/kevin.jpg", animeChar: "/anime/kevin_anime.jpg", color: "#FFD700",
    stats: { force: 78, vitesse: 86, technique: 97 },
    special: { name: "1001 Références", effect: "Analyse statistique parfaite : esquive assurée sur 3 tours." }
  },
  { 
    id: 12, name: "Gomes Jonathan", rank: "Monarque", birthday: "03 Avril", bio: "Origuinowe Tambani Gomes lui-même, père de famille, fervent admirateur de Nekfeu, homme profondément ancré dans sa culture.", photo: "/photos/gomes.jpg", animeChar: "/anime/gomes_anime.jpg", color: "#FFD700",
    stats: { force: 89, vitesse: 82, technique: 85 },
    special: { name: "Aura Paternelle", effect: "Bouclier impénétrable protégeant toute sa barre de vie." }
  },
  { 
    id: 13, name: "Eric \"The SVAGE\"", rank: "Monarque", birthday: "24 Novembre", bio: "Artiste, ingénieur du son et photographe, ce géant locksé de deux mètres, figure majeure de l'industrie audiovisuelle.", photo: "/photos/eric.JPG", animeChar: "/anime/eric_anime.jpg", color: "#FFD700",
    stats: { force: 96, vitesse: 75, technique: 90 },
    special: { name: "Onde Sonore", effect: "Dégâts de zone massifs basés sur des fréquences destructrices." }
  },
  { 
    id: 14, name: "BVSH", rank: "Ordre Céleste", birthday: "18 juillet", bio: "Le Bachester United, homme de l'année, maître de la chronique du Bash, virtuose des recommandations, rappeur et poète, digne héritier d'All Might.", photo: "/photos/bvsh.JPG", animeChar: "/anime/bvsh_anime.jpg", color: "#9B59B6", badge: "HOMME DE L'ANNÉE 2024 ",
    stats: { force: 95, vitesse: 88, technique: 92 },
    special: { name: "Chronique du Smash", effect: "Coup de poing ravageur hérité du symbole de la paix." }
  },
  { 
    id: 15, name: "OXANCE", rank: "Ordre Céleste", birthday: "10 Novembre", bio: "The Ox, bras droit vaillant, allié digne de Roronoa Zoro, toujours fiable quel que soit le plan ; doubleur et cascadeur de Damson Idris.", photo: "/photos/oxance.jpg", animeChar: "/anime/oxance_anime.jpg", color: "#9B59B6",
    stats: { force: 92, vitesse: 90, technique: 94 },
    special: { name: "Tranchant de l'Ox", effect: "Coupe l'espace-temps, imparable à courte portée." }
  },
  { 
    id: 16, name: "Ben Uchiwa", rank: "Ordre Céleste", birthday: "12 juin", bio: "L'un des doyens de la guilde, disciple d'Akira Toriyama, le faux Ben car nul n'égale le Jaize ; érudit, guide précieux pour la jeunesse.", photo: "/photos/ben.jpg", animeChar: "/anime/ben_anime.jpg", color: "#9B59B6",
    stats: { force: 85, vitesse: 85, technique: 98 },
    special: { name: "Genjutsu Érudit", effect: "Plonge l'ennemi dans une illusion affaiblissante." }
  },
  { 
    id: 17, name: "Adnan", rank: "Ordre Céleste", birthday: "15 Avril", bio: "Grand rappeur dans sa jeunesse, devenu éminent influenceur LinkedIn, mêlant passion et business avec maestria ; il incarne la force tranquille.", photo: "/photos/adnan.jpg", animeChar: "/anime/adnan_anime.jpg", color: "#9B59B6",
    stats: { force: 80, vitesse: 82, technique: 96 },
    special: { name: "Réseautage Fatal", effect: "Baisse drastiquement les stats adverses en un post." }
  },
  { 
    id: 18, name: "Remy", rank: "Ordre Céleste", birthday: "17 Avril", bio: "Le Mougounho, MVP des Otaku Awards 2024 et ANTAGONISTE 2025, a gravé son nom dans l'histoire par ses citations et notes vocales.", photo: "/photos/remy.jpg", animeChar: "/anime/remy_anime.jpg", color: "#9B59B6", badge: "ANTAGONISTE DE L'ANNÉE 2025",
    stats: { force: 90, vitesse: 85, technique: 88 },
    special: { name: "Note Vocale Malédiction", effect: "Dommages continus au fil du temps (Poison sonore)." }
  },
  { 
    id: 19, name: "Lucas", rank: "Ordre Céleste", birthday: "04 Janvier", bio: "Petit frère du légendaire Copy Cut, expert en shôjo et romance, forme un duo méconnu avec le BVSH, toujours dévoué aux mangas.", photo: "/photos/lucas.jpg", animeChar: "/anime/lucas_anime.jpg", color: "#9B59B6",
    stats: { force: 78, vitesse: 88, technique: 90 },
    special: { name: "Aura Shôjo", effect: "Désarme l'adversaire grâce au pouvoir de l'amour." }
  },
  { 
    id: 20, name: "Dorian XYZ", rank: "Ordre Céleste", birthday: "27 Juillet", bio: "Grand passionné de jeux vidéo, anime les débats malgré des avis controversés ; face à l'adversité, il tient bon, personnage singulier.", photo: "/photos/dorian.jpg", animeChar: "/anime/dorian_anime.jpg", color: "#9B59B6",
    stats: { force: 84, vitesse: 80, technique: 89 },
    special: { name: "Avis Controversé", effect: "Provoque la confusion totale chez l'ennemi." }
  },
  { 
    id: 21, name: "Gleyn", rank: "Ordre Céleste", birthday: "16 Mai", bio: "Le Chien du Firmament, Lord Pathso, homme au grand cœur toujours rayonnant ; la passion de Pokémon et Taylor Swift coule dans ses veines.", photo: "/photos/gleyn.jpg", animeChar: "/anime/gleyn_anime.jpg", color: "#9B59B6",
    stats: { force: 82, vitesse: 92, technique: 86 },
    special: { name: "Morsure du Firmament", effect: "Attaque rapide qui vole de la vie à l'adversaire." }
  },
  { 
    id: 22, name: "Vaneck", rank: "Ordre Céleste", birthday: "27 juin", bio: "Culture Bantu, basketteur, psychologue et même sexologue, culturiste et grand sportif, il manie toutes formes d'art du bout des doigts.", photo: "/photos/vaneck.jpg", animeChar: "/anime/vaneck_anime.jpg", color: "#9B59B6",
    stats: { force: 95, vitesse: 88, technique: 92 },
    special: { name: "Dunk Bantu", effect: "Écrase l'ennemi depuis les cieux, brise les armures." }
  },
  { 
    id: 23, name: "Bruni Warner", rank: "Ex Monarque", birthday: "1 Mai", bio: "Anciennement The Beard, l'un des plus anciens. Élu départ de l'année 2025, comeback digne de Luxus. Poète et scénariste du manga PAYBACK.", photo: "/photos/bruni.jpg", animeChar: "/anime/bruni_anime.jpg", color: "#E67E22", badge: "DÉPART DE L'ANNÉE 2025",
    stats: { force: 92, vitesse: 85, technique: 88 },
    special: { name: "Foudre du Comeback", effect: "Frappe dévastatrice d'éclairs (à la Luxus)." }
  },
  { 
    id: 24, name: "Saske Kun", rank: "New G dorée", birthday: "18 février", bio: "Divine, alias Philippe, l'idole des femmes, celle qui a redonné un souffle de vie à la guilde. Passion pour les films d'horreur.", photo: "/photos/saske.jpg", animeChar: "/anime/saske_anime.jpg", color: "#E91E8C", badge: "FEMME DE L'ANNÉE 2025",
    stats: { force: 80, vitesse: 90, technique: 94 },
    special: { name: "Horreur Absolue", effect: "Paralyse l'ennemi de terreur pendant 2 tours." }
  },
  { 
    id: 25, name: "Abigaëlle", rank: "New G dorée", birthday: "16 Mars", bio: "Fan de seinen et de gore, femme singulière et particulièrement folle. Petit conseil : évitez-la au réveil quand la faim la tenaille.", photo: "/photos/abigaelle.jpg", animeChar: "/anime/abigaelle_anime.jpg", color: "#E91E8C",
    stats: { force: 94, vitesse: 85, technique: 80 },
    special: { name: "Faim Féroce", effect: "Passe en mode Berserk, double la force de ses coups." }
  },
  { 
    id: 26, name: "Graziella", rank: "New G dorée", birthday: "8 janvier", bio: "Femme de l'année 2024, toujours radieuse et dévouée aux mangas, cinéphile perfectionniste. Désormais c'est Cooking Grazyyyy.", photo: "/photos/graziella.jpg", animeChar: "/anime/graziella_anime.jpg", color: "#E91E8C", badge: "FEMME DE L'ANNÉE 2024",
    stats: { force: 75, vitesse: 88, technique: 96 },
    special: { name: "Cuisson Parfaite", effect: "Brûle l'ennemi avec des flammes culinaires intenses." }
  },
  { 
    id: 27, name: "Godwin (Balara)", rank: "New G dorée", birthday: "15 Mars", bio: "BG No Face, nonchalant, flemmard, 1m95. Sa marque de fabrique : dire que tout est surcoté.", photo: "/photos/godwin.jpg", animeChar: "/anime/godwin_anime.jpg", color: "#E91E8C", badge: "SOUS-COTÉ 2025",
    stats: { force: 88, vitesse: 70, technique: 90 },
    special: { name: "Jugement \"Surcoté\"", effect: "Annule le coup spécial de l'adversaire d'un simple regard." }
  },
  { 
    id: 28, name: "Séréna (Sun Set)", rank: "New G dorée", birthday: "6 janvier", bio: "Organisatrice de quiz et ANIMATRICE DE L'ANNÉE 2025, très méthodique, dotée d'un puissant esprit de leadership.", photo: "/photos/serena.JPG", animeChar: "/anime/serena_anime.jpg", color: "#E91E8C", badge: "ANIMATRICE DE L'ANNÉE 2025",
    stats: { force: 75, vitesse: 85, technique: 98 },
    special: { name: "Ordre Méthodique", effect: "Contrôle les actions de l'ennemi pour le prochain tour." }
  },
  { 
    id: 29, name: "Fenela", rank: "New G dorée", birthday: "30 octobre", bio: "Tournesol de cœur, toujours souriante et bienveillante, mais attention : elle pourrait te briser le bras, musclée comme elle est.", photo: "/photos/fenela.jpg", animeChar: "/anime/fenela_anime.jpg", color: "#E91E8C",
    stats: { force: 96, vitesse: 80, technique: 85 },
    special: { name: "Brisure du Tournesol", effect: "Attaque de prise infligeant des dégâts critiques." }
  },
  { 
    id: 30, name: "Phillipe", rank: "New G dorée", birthday: "4 janvier", bio: "Le chouchou des nanas du meta, toujours disponible pour les faux wé, mais c'est un mec bien, promis.", photo: "/photos/phillipe.jpg", animeChar: "/anime/phillipe_anime.jpg", color: "#E91E8C",
    stats: { force: 82, vitesse: 88, technique: 86 },
    special: { name: "Faux Wé", effect: "Créé un clone de lui-même pour absorber les dégâts." }
  },
  { 
    id: 31, name: "Sylver ED", rank: "New G dorée", birthday: "22 août", bio: "L'Étalon des jeunes filles, tireur d'élite sur Call of Duty, seul homme à enchaîner mille pompes au matin, un gars résolument chill.", photo: "/photos/sylver.jpg", animeChar: "/anime/sylver_anime.jpg", color: "#E91E8C",
    stats: { force: 95, vitesse: 90, technique: 92 },
    special: { name: "Tir d'Élite", effect: "Headshot instantané, impossible à esquiver." }
  },
  { 
    id: 32, name: "NEVERHOOD", rank: "New G dorée", birthday: "24 mars", bio: "Plus grand fantôme de l'histoire de la guilde, mais en 2025 il a fait des efforts. Félicitations, Casper !", photo: "/photos/neverhood.jpg", animeChar: "/anime/neverhood_anime.jpg", color: "#E91E8C",
    stats: { force: 70, vitesse: 98, technique: 85 },
    special: { name: "Disparition", effect: "Devient intangible pendant 2 tours." }
  },
  /*
  { 
    id: 33, name: "Clay", rank: "New G dorée", birthday: "11 février", bio: "Grande jeune femme, tireuse d'élite sur Call of Duty, passionnée de Genshin Impact, actuellement en cavale telle une voleuse fantôme.", photo: "/photos/clay.jpg", animeChar: "/anime/clay_anime.jpg", color: "#E91E8C",
    stats: { force: 75, vitesse: 96, technique: 94 },
    special: { name: "Vol Fantôme", effect: "Vole un objet ou buff à l'adversaire tout en fuyant." }
  },
  */
  { 
    id: 34, name: "Loreena Maëlice", rank: "New G dorée", birthday: "11 Juillet", bio: "Nouvelle venue, femme aux multiples facettes, brave et intelligente. Son front généreux fait partie de son charme.", photo: "/photos/loreena.jpg", animeChar: "/anime/loreena_anime.jpg", color: "#E91E8C",
    stats: { force: 80, vitesse: 85, technique: 90 },
    special: { name: "Intelligence Stratégique", effect: "Anticipe l'attaque ennemie et contre-attaque automatiquement." }
  },
  { 
    id: 35, name: "Christoff", rank: "Vieux Briscard", birthday: "20 octobre", bio: "Le playboy, Nicky Larson d'OKONDJA, homme cultivé, riche et brillant, archétype du séducteur du XXIe siècle ; au fond, un mec bien.", photo: "/photos/christoff.jpg", animeChar: "/anime/christoff_anime.jpg", color: "#1ABC9C",
    stats: { force: 88, vitesse: 88, technique: 94 },
    special: { name: "Tir de Mokkori", effect: "Tir précis qui ignore les armures." }
  },
  { 
    id: 36, name: "Junior MG", rank: "Futurs Espoirs", birthday: "09 Mai", bio: "L'Orateur, l'éloquence incarnée, mannequin à temps plein et égérie du Guinzshow, cet homme charismatique transforme votre vision de la vie.", photo: "/photos/junior.JPG", animeChar: "/anime/junior_anime.jpg", color: "#3498DB",
    stats: { force: 80, vitesse: 85, technique: 95 },
    special: { name: "Discours Envoûtant", effect: "Endort l'adversaire avec sa voix suave." }
  },
  { 
    id: 37, name: "Thomas", rank: "Futurs Espoirs", birthday: "20 Juin", bio: "Influenceur certifié sur Facebook (pendant un mois), agent secret de la SEEG, le Thomas Sankouran (sans courant). Nounours de ses dames à 1m90.", photo: "/photos/thomas.jpg", animeChar: "/anime/thomas_anime.jpg", color: "#3498DB",
    stats: { force: 94, vitesse: 75, technique: 82 },
    special: { name: "Coupure de Courant", effect: "Plonge l'arène dans le noir, aveuglant l'ennemi." }
  },
  { 
    id: 38, name: "Jeanice", rank: "Futurs Espoirs", birthday: "13 Avril", bio: "La Dre Ameku, femme d'une grande sagesse, respectable, portée par de nobles valeurs, une pépite discrète rayonnant dans l'ombre.", photo: "/photos/jeanice.jpg", animeChar: "/anime/jeanice_anime.jpg", color: "#3498DB",
    stats: { force: 75, vitesse: 80, technique: 96 },
    special: { name: "Sagesse de l'Ombre", effect: "Soin massif et buff de défense pour toute l'équipe." }
  },
  { 
    id: 39, name: "Grace", rank: "Futurs Espoirs", birthday: "16 Novembre", bio: "Insaisissable, son arrivée comme son départ restent un mystère. Surnommée Pikachu, son charme électrique a su faire parler de lui.", photo: "/photos/grace.jpg", animeChar: "/anime/grace_anime.jpg", color: "#3498DB",
    stats: { force: 78, vitesse: 99, technique: 88 },
    special: { name: "Fatal-Foudre", effect: "Dégâts électriques massifs avec 30% de chance de paralyser." }
  },
  { 
    id: 40, name: "Floriane Nao", rank: "Futurs Espoirs", birthday: "09 janvier", bio: "La richissime, joviale, rayonnante de sourires, petit rayon de soleil. AVEC LES MEILLEURS FILMS SUR DISCORD, ATAH.", photo: "/photos/floriane.jpg", animeChar: "/anime/floriane_anime.jpg", color: "#3498DB",
    stats: { force: 70, vitesse: 85, technique: 92 },
    special: { name: "Rayon de Soleil", effect: "Éblouit l'ennemi et annule son prochain tour." }
  },
  { 
    id: 41, name: "Traicy", rank: "Futurs Espoirs", birthday: "30 Avril", bio: "Petite par la taille, immense par l'esprit et le cœur, adorable étoile de 2006. MEILLEURE RECRUE DE L'ANNÉE 2025.", photo: "/photos/traicy.JPG", animeChar: "/anime/traicy_anime.jpg", color: "#3498DB", badge: "RECRUE DE L'ANNÉE 2025",
    stats: { force: 75, vitesse: 92, technique: 85 },
    special: { name: "Étoile Filante", effect: "Attaque éclair multiple très difficile à parer." }
  },
  { 
    id: 42, name: "Herta", rank: "Fantôme", birthday: "06 Mars", bio: "Le Miel du Ox, elle réagit toujours aux messages mais interagit si peu ; peut-être une agente secrète, qui sait ?", photo: "/photos/herta.jpg", animeChar: "/anime/herta_anime.jpg", color: "#3498DB",
    stats: { force: 78, vitesse: 95, technique: 90 },
    special: { name: "Infiltration Secrète", effect: "Attaque dans le dos infligeant des dégâts critiques." }
  },
  { 
    id: 43, name: "Tina", rank: "Futurs Espoirs", birthday: "18 février", bio: "La très discrète, parle peu mais avec justesse, inoffensive comme une brise ; une jolie jeune femme nimbée de mystère.", photo: "/photos/tina.jpg", animeChar: "/anime/tina_anime.jpg", color: "#3498DB",
    stats: { force: 72, vitesse: 88, technique: 94 },
    special: { name: "Brise Tranchante", effect: "Attaque ventrale invisible et perforante." }
  },
  { 
    id: 44, name: "Kadi", rank: "Futurs Espoirs", birthday: "24 août", bio: "Skadi, la princesse Athéna en personne, toujours entourée de ses fidèles chevaliers, aimée de tous.", photo: "/photos/kadi.jpg", animeChar: "/anime/kadi_anime.jpg", color: "#3498DB",
    stats: { force: 70, vitesse: 85, technique: 98 },
    special: { name: "Invocation Chevaleresque", effect: "Appelle un chevalier pour la protéger de la prochaine attaque." }
  },
  { 
    id: 45, name: "Prunelle Come", rank: "Fantôme", birthday: "01 novembre", bio: "Titania, à la voix empreinte d'autorité ; peut paraître froide mais profondément attachée et protectrice. Elle illumine les Discord.", photo: "/photos/prunelle.jpg", animeChar: "/anime/prunelle_anime.jpg", color: "#3498DB",
    stats: { force: 85, vitesse: 82, technique: 95 },
    special: { name: "Autorité de Titania", effect: "Silence l'adversaire (impossible d'utiliser un coup spécial)." }
  },
  { 
    id: 46, name: "DAOUD", rank: "Fantôme", birthday: "01 janvier", bio: "Frère de Prunelle, il se fait appeler Guerro maintenant. Amateur de rap, simple, posé, avec une détermination qui rappelle Eren Yeager.", photo: "/photos/daoud.jpg", animeChar: "/anime/daoud_anime.jpg", color: "#3498DB",
    stats: { force: 92, vitesse: 85, technique: 82 },
    special: { name: "Grand Terrassement", effect: "Transformation brutale augmentant ses stats de Force de 50%." }
  },
  { 
    id: 47, name: "Emmanuel Lony", rank: "Futurs Espoirs", birthday: "15 janvier", bio: "Ambiverti et chill au max, passionné de sport, de musique et d'animés. Son cœur balance entre Natsu et Dante (Devil May Cry).", photo: "/photos/lony.jpg", animeChar: "/anime/lony_anime.jpg", color: "#3498DB",
    stats: { force: 88, vitesse: 90, technique: 88 },
    special: { name: "Hurlement du Démon", effect: "Mélange de feu et de force démoniaque ravageuse." }
  },
  { 
    id: 48, name: "Éméraude Norina", rank: "Futurs Espoirs", birthday: "13 novembre", bio: "Nono, femme unique à la douceur remarquable, pleine de bonnes intentions. Elle est une véritable pierre précieuse, tout comme son prénom.", photo: "/photos/emeraude.JPG", animeChar: "/anime/emeraude_anime.jpg", color: "#3498DB",
    stats: { force: 75, vitesse: 82, technique: 94 },
    special: { name: "Éclat Précieux", effect: "Éblouissement purificateur qui soigne ses altérations d'état." }
  },
  { 
    id: 49, name: "Lune", rank: "Futurs Espoirs", birthday: "31 Mai", bio: "La Lune de cette guilde, pleine de malice et de curiosité. Passionnée de mangas, elle brille par sa douceur et son charme unique.", photo: "/photos/lune.jpg", animeChar: "/anime/lune_anime.jpg", color: "#3498DB",
    stats: { force: 72, vitesse: 88, technique: 92 },
    special: { name: "Éclipse Stellaire", effect: "Plonge l'arène dans l'obscurité pour attaquer furtivement." }
  },
  { 
    id: 50, name: "Jeremih Noah", rank: "Futurs Espoirs", birthday: "22 novembre", bio: "Le lianeux, locksé, ténébreux, sportif, mamamiiii les mots me manquent, un vieil ami et allié du Don.", photo: "/photos/jeremih.jpg", animeChar: "/anime/jeremih_anime.jpg", color: "#3498DB",
    stats: { force: 92, vitesse: 92, technique: 85 },
    special: { name: "Frappe Ténébreuse", effect: "Enchaînement martial à grande vitesse." }
  },
  { 
    id: 51, name: "Suliane", rank: "Futurs Espoirs", birthday: "10 mars", bio: "La très vive Suliane, grande moqueuse et fine observatrice, toujours prête à allumer les flammes avec humour. Esprit audacieux.", photo: "/photos/suliane.jpg", animeChar: "/anime/suliane_anime.jpg", color: "#3498DB",
    stats: { force: 78, vitesse: 95, technique: 88 },
    special: { name: "Moquerie Fatale", effect: "Rend l'adversaire fou de rage, baissant sa défense." }
  },
  { 
    id: 52, name: "Lucia", rank: "Futurs Espoirs", birthday: "25 Juillet", bio: "Rayonnante comme un soleil de juillet, fan d'animés et toujours curieuse. Derrière son côté mystérieux se cache une fille pleine de chaleur.", photo: "/photos/lucia.jpg", animeChar: "/anime/lucia_anime.jpg", color: "#3498DB",
    stats: { force: 75, vitesse: 85, technique: 90 },
    special: { name: "Éruption Solaire", effect: "Rayon brûlant qui transperce les boucliers." }
  },
  { 
    id: 53, name: "Marie Esther", rank: "Futurs Espoirs", birthday: "29 novembre", bio: "Disciple du BVSH, à la voix douce, timide, elle apparaît par éclipses, toujours disponible pour les chills de la SABA.", photo: "/photos/marie.jpg", animeChar: "/anime/marie_anime.jpg", color: "#3498DB", badge: "SOUS-COTÉE 2025",
    stats: { force: 70, vitesse: 82, technique: 95 },
    special: { name: "Éclipse de la SABA", effect: "Disparaît et restaure sa jauge de spécial secrètement." }
  },
  /*
  { 
    
    id: 54, name: "Annaëlle", rank: "Fantôme", birthday: "16 Juillet", bio: "Très discrète, ses véritables talents demeurent un mystère ; à l'image de Mikasa, calme, déterminée, portée par une force silencieuse.", photo: "/photos/annaelle.jpg", animeChar: "/anime/annaelle_anime.jpg", color: "#7F8C8D",
    stats: { force: 90, vitesse: 94, technique: 92 },
    special: { name: "Tranchant Tridimensionnel", effect: "Frappe mortelle au point faible (Nuque)." }
  },
  */
 /*
  { 
    id: 55, name: "Paule Ackerman", rank: "Fantôme", birthday: "25 Mars", bio: "Rengoku Kyojuro Ackerman, figure emblématique des jeux inter-otaku, grand amour de Dorian ; désormais plus rare, mais fidèle à la famille.", photo: "/photos/paule.jpg", animeChar: "/anime/paule_anime.jpg", color: "#7F8C8D",
    stats: { force: 95, vitesse: 90, technique: 98 },
    special: { name: "Souffle de la Flamme", effect: "Dégâts de feu colossaux qui embrasent l'arène entière." }
  },
  */
  { 
    id: 56, name: "Emmanuel Melrick", rank: "Revenant", birthday: "23 Mai", bio: "Fantôme revenu d'entre les morts, tel Cell face à Gohan. Très chill et coqueluche des jeunes femmes. Il faut dire qu'il est costumé.", photo: "/photos/melrick.jpg", animeChar: "/anime/melrick_anime.jpg", color: "#8E44AD",
    stats: { force: 92, vitesse: 88, technique: 94 },
    special: { name: "Régénération de Cell", effect: "Revient d'un K.O. avec 20% de sa santé si tué." }
  },
  { 
    id: 57, 
    name: "Merveille", 
    rank: "New G dorée", 
    birthday: "14 mars", 
    bio: "Femme aux multiples facettes, décriée par certains (que grazy hein ), mais en réalité d’une simplicité désarmante. Drôle sans forcer, intelligente sans le crier, généreuse sans calcul ; elle incarne cette joie de vivre naturelle qui ne s’explique pas, elle se ressent. Toujours un sourire en coin, toujours un rire prêt à éclater une présence légère mais marquante, tu vois le genre hehe ( ou pas ).", 
    photo: "/photos/merveille.jpg", 
    animeChar: "/anime/merveille_anime.jpg", 
    color: "#E91E8C",
    stats: { force: 75, vitesse: 85, technique: 92 },
    special: { name: "Sourire en Coin", effect: "Désarme complètement l'adversaire grâce à une simplicité désarmante." }
  },
  { 
    id: 58, 
    name: "Brian Obame", 
    rank: "Revenant", 
    birthday: "21 Mai", 
    bio: "Le golden boy du meta en personne (désormais retraité de Facebook), ancien “fantôme de l’année 2025” titre qu’il a bien incarné. Retiré du groupe otaku à une époque ( un fantôme quoi ) mais revenu comme si de rien n’était, tu connais. Un gars chill, posé, avec de vraies valeurs et surtout des republications TikTok toujours bien ...…. bref, un vrai bg.", 
    photo: "/photos/brian.jpg", 
    animeChar: "/anime/brian_anime.jpg", 
    color: "#8E44AD", 
    badge: "FANTÔME DE L'ANNÉE 2025",
    stats: { force: 82, vitesse: 96, technique: 88 },
    special: { name: "Apparition Chill", effect: "Esquive l'attaque ennemie telle un fantôme et contre-attaque avec une trend TikTok." }
  },
  { 
    id: 59, 
    name: "Armand", 
    rank: "New G dorée", 
    birthday: "23 Décembre", 
    bio: "Nouveau venu dans la Guilde sous le pseudo d'Armandstone, ce gars chill de 21 ans s'est vite intégré. Très proche de Traicy ( huum ), Côté culture, il a des goûts pointus : il valide le génie de Senku, et la classe de Nicky Larson.", 
    photo: "/photos/armand.jpg", 
    animeChar: "/anime/arman_anime.jpg", 
    color: "#E91E8C", 
    stats: { force: 95, vitesse: 85, technique: 88 },
    special: { 
      name: "Kamui Scientifique", 
      effect: "Disparaît dans une autre dimension comme Kakashi pour esquiver, puis élabore une contre-attaque à 10 milliards de pourcents façon Senku en écoutant Mockingbird." 
    }
  }

  
];

export const rankColors: Record<Rank, { bg: string; text: string; border: string; glow: string }> = {
  "Fondateur":      { bg: "from-yellow-900/80 to-yellow-700/40", text: "text-yellow-300", border: "border-yellow-400", glow: "shadow-yellow-500/50" },
  "Monarque":       { bg: "from-yellow-800/80 to-amber-700/40", text: "text-amber-300", border: "border-amber-400", glow: "shadow-amber-500/50" },
  "Ex Monarque":    { bg: "from-orange-900/80 to-orange-700/40", text: "text-orange-300", border: "border-orange-400", glow: "shadow-orange-500/50" },
  "Ordre Céleste":  { bg: "from-purple-900/80 to-purple-700/40", text: "text-purple-300", border: "border-purple-400", glow: "shadow-purple-500/50" },
  "New G dorée":    { bg: "from-pink-900/80 to-pink-700/40", text: "text-pink-300", border: "border-pink-400", glow: "shadow-pink-500/50" },
  "Futurs Espoirs": { bg: "from-blue-900/80 to-blue-700/40", text: "text-blue-300", border: "border-blue-400", glow: "shadow-blue-500/50" },
  "Vieux Briscard": { bg: "from-teal-900/80 to-teal-700/40", text: "text-teal-300", border: "border-teal-400", glow: "shadow-teal-500/50" },
  "Fantôme":        { bg: "from-gray-900/80 to-gray-700/40", text: "text-gray-300", border: "border-gray-400", glow: "shadow-gray-500/50" },
  "Revenant":       { bg: "from-violet-900/80 to-violet-700/40", text: "text-violet-300", border: "border-violet-400", glow: "shadow-violet-500/50" },
};

export const rankJP: Record<Rank, string> = {
  "Fondateur":      "Sōsetsusha",
  "Monarque":       "Ōja",
  "Ex Monarque":    "Moto Ōja",
  "Ordre Céleste":  "Tenjōkai",
  "New G dorée":    "Ōgon Sedai",
  "Futurs Espoirs": "Mirai no Kibō",
  "Vieux Briscard": "Kōsanhei",
  "Fantôme":        "Yūrei",
  "Revenant":       "Bōrei",
};