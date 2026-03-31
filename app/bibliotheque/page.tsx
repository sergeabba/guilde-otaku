"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import GuildeHeader from "../components/GuildeHeader";
import OptimizedImage, { SkeletonCard } from "../components/OptimizedImage";
import { supabase } from "../../lib/supabase";
import { colors, typography, components, font, filterPillStyle, cardHoverStyle } from "../../outputs/styles/tokens";
import {
  Star, BookOpen, Tv, Gamepad2, Film, Quote, Flame, Gem, Meh,
  TrendingDown, Search, X, Clock, Calendar, Youtube, ArrowUpDown, Pencil
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Category = "Tout" | "Anime" | "Manga" | "Film/Série" | "Jeu Vidéo";
type Tier = "Chef-d'œuvre" | "Pépite" | "Bof" | "Surcoté" | "A définir";

// ─── DOSSIER BASH ────────────────────────────────────────────────────────────
const DOSSIER_BASH_DATA = [
  {
    searchQuery: "Observation Log of my Fiancée Who Calls Herself a Villainess",
    title: "Observation Records of my Fiancée",
    date: "06 Avril 2026",
    tag: "ROMANCE MÉDIÉVALE",
    color: "#f472b6",
    review: "Cecil, insensible aux émotions, s'intéresse à sa fiancée, Tia, qui prétend être une réincarnation, renaissant sous les traits de la méchante d'un jeu otome. La croyant d'abord folle, Cecil entre dans son jeu ; jusqu'à ce que les événements prédits par Tia commencent à se réaliser.\n\nC'est donc une go qui se trouve dans un otome game et bah elle se fera passer pour une vilaine. Visuellement c'est assez mignon en vrai, le chara design est une vraie réussite et les personnages arrivent à être assez émotif et le travail sur les yeux est important... Néanmoins l'oeuvre semble être assez mid. Mais bref c'est pas deconnant de l'essayer.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Observation+Records+of+my+Fiancée+anime+trailer"
  },
  {
    searchQuery: "The Klutzy Class Monitor and the Girl with the Short Skirt",
    title: "The Klutzy Class Monitor",
    date: "06 Avril 2026",
    tag: "ROM-COM COLORÉE",
    color: "#60a5fa",
    review: "Sakuradaimon est chargé de veiller au respect des règles à l'entrée du lycée. Il interpelle régulièrement Poem à cause de ses tenues inappropriées. Mais lorsqu'ils se retrouvent dans la même classe de rattrapage, elle découvre son secret : aussi sérieux et rigide soit-il, Sakuradaimon est en fait nul en études !\n\nOn suivra donc ici une romance mignonne basée sur le quiproquo entre deux personnes qui normalement tout oppose. Pour ce qui est du visuel c'est super top, c'est très coloré, les chara-design sont super chatoyant, et la palette de couleur donne le ton : on aura une aventure haute en couleur.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=The+Klutzy+Class+Monitor+and+the+Girl+with+the+Short+Skirt+trailer"
  },
  {
    searchQuery: "I Made Friends with the Second Prettiest Girl in My Class",
    title: "I Made Friends with the Second Prettiest",
    date: "07 Avril 2026",
    tag: "ROMANCE & QUOTIDIEN",
    color: "#a78bfa",
    review: "Tout est dans le titre en gros ça sera l'histoire classique entre le no name et la fille populaire. On suivra Maehara Maki, jeune homme solitaire n'ayant pas d'amis. Il va rencontrer Asanagi, la deuxième fille la plus populaire, dans un vidéo club et de là naîtra une belle amitié... et qui sait ? Peut-être plus.\n\nC'est un trope assez basique mais qui peut marcher. L'anime promet un bon petit développement, et une belle petite relation avec sûrement un trio amoureux... l'oeuvre semble aussi bien écrite alors je me dis pourquoi pas.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=I+Made+Friends+with+the+Second+Prettiest+in+My+Class+trailer"
  },
  {
    searchQuery: "Tadaima, Ojamasaremasu!",
    title: "Pardon the Intrusion, I'm Home!",
    date: "07 Avril 2026",
    tag: "HAREM INVERSÉ",
    color: "#4ade80",
    review: "L'histoire suit Rinko Nakayama, jeune OL de 24 ans passionnée d'anime. Elle remarque quelque chose d'anormal dans sa maison, quand elle suit un anime différent de son anime préféré son voisin cogne fort contre le mur... À l'aide de son autre voisin elle va réussir à élucider le mystère.\n\nIci on est en face typiquement à un anime super simple avec un principe assez simple, et il sera intéressant. L'alchimie entre les personnages se voit à distance, y'a de l'humour, mais sûrement un humour tout simple, tout chill. Visuellement c'est beau, et celui-là ne déroge pas à la règle.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Pardon+the+Intrusion+I%27m+Home+anime+trailer"
  },
  {
    searchQuery: "Ascendance of a Bookworm Season 4",
    title: "Ascendance of a Bookworm S4",
    date: "04 Avril 2026",
    tag: "BIJOU SLICE OF LIFE",
    color: "#fbbf24",
    review: "On suit une femme amoureuse des livres, qui se réincarne dans le corps d'une enfant dans un monde où le taux d'analphabétisation est très haut. Pour assouvir sa soif de lecture elle va elle-même se mettre à créer des livres !\n\nL'œuvre est apparemment un pur bijou, il a eu pas mal de distinctions assez intéressantes. C'est le slice of life le plus impressionnant de la saison, c'est juste magnifique, j'ai pas d'autres mots, c'est juste grandiose, l'animation est incroyable. C'est un anime feel-good, il a l'air super chill et mignon.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Ascendance+of+a+Bookworm+Season+4+trailer"
  },
  {
    searchQuery: "Needy Girl Overdose",
    title: "NEEDY GIRL OVERDOSE",
    date: "04 Avril 2026",
    tag: "PSYCHÉDÉLIQUE & DARK",
    color: "#ef4444",
    review: "Idols, musique, paillettes, drogue, violence, suicide, mutilation, sang, tronçonneuse... Oui, ces mots n'ont rien à faire ensemble normalement mais pourtant c'est bien ce que nous promet NEEDY GIRL OVERDOSE.\n\nAme-Chan entretient une relation toxique avec P-Chan et a un besoin extrême d'attention. Elle devient streameuse sous le pseudo de 'KAngel'. Bref, le plus important et le plus choquant ici est la D.A, wow, c'est incroyable. C'est très 'jeu vidéo dérangeant'. L'œuvre n'est pas adaptée à tout le monde, c'est cru, c'est sombre, et ça peut être limite traumatisant.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Needy+Girl+Overdose+anime+trailer"
  },
  {
    searchQuery: "Himitsu no AiPri",
    title: "Onegai AiPri",
    date: "05 Avril 2026",
    tag: "IDOLS & MAGICAL GIRLS",
    color: "#f472b6",
    review: "C'est juste des idols/magical girl. C'est un peu trop coloré même pour moi, mais vu que je pense que c'est le seul anime du genre, je le cite.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Onegai+AIpri+trailer"
  },
  {
    searchQuery: "Ghost Concert Missing songs",
    title: "Ghost Concert",
    date: "05 Avril 2026",
    tag: "IA vs HUMAIN",
    color: "#38bdf8",
    review: "On est dans un futur où l'IA a remplacé la musique et les protagonistes vont tout faire pour remettre l'humain au centre de la musique. GC est ce genre d'anime qui divertit et nous fait réfléchir sur notre façon de vivre et de consommer le divertissement.\n\nC'est beau, c'est bien animé également, les personnages auront des 'pouvoirs' donc y'aura de la casse. J'espère que l'anime peut être une critique du monde actuel en étant super pertinent.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Ghost+Concert+Missing+songs+trailer"
  },
  {
    searchQuery: "Megami Isekai Tensei Nani ni Naritai Desu ka Ore Yuusha no Rokkotsu de",
    title: "MegaOre",
    date: "07 Avril 2026",
    tag: "ISEKAI ABSURDE",
    color: "#8b5cf6",
    review: "On suit l'histoire d'un homme qui meurt et se réincarne en... côte humaine ! Mais attention, pas n'importe laquelle, la côte d'un héros qui a un harem et qui est super beau.\n\nOn a une parodie exacerbée de l'état du marché de l'isekai moderne, l'œuvre détourne avec humour et sans aucune subtilité tous les clichés du genre. Visuellement, c'est l'anime le plus absurde de la saison, tantôt des marionnettes, tantôt des power rangers... Soit ça sera l'anime le plus drôle, soit le plus étrange.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Megami+Isekai+ni+MegaOre+trailer"
  },
  {
    searchQuery: "Eren the Southpaw",
    title: "EREN THE SOUTHPAW",
    date: "07 Avril 2026",
    tag: "GÉNIE vs TRAVAIL",
    color: "#f97316",
    review: "Koichi Asakura, jeune lycéen passionné d'art, tombe sur une œuvre d'EREN Yamagishi, un vrai génie qui a décidé de renoncer à son talent. L'œuvre mettra ici la confrontation entre un génie qui a abandonné son talent et un gars sans talent qui lui n'abandonne pas.\n\nL'œuvre nous renvoie à la vérité cruelle derrière la réussite et l'art. Ça a l'air super bien surtout dans le fond. Dans la forme aussi c'est pas mal, avec une animation sympa et des seiyuu pleins de talent.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Eren+the+Southpaw+anime+trailer"
  },
  {
    searchQuery: "Gals can't be kind to Otaku",
    title: "Gals Can't Be Kind to Otaku??",
    date: "07 Avril 2026",
    tag: "HAREM CLASSIQUE",
    color: "#ec4899",
    review: "On suit un puceau otaku nerd à lunette qui grâce au destin va rencontrer une gyal magnifique qui va tomber amoureuse de lui... ensuite une deuxième va se rajouter et on suivra son quotidien aux côtés de ces deux beautés fatales.\n\nQue dire ? Bah c'est le harem classique, enfin le triangle amoureux classique entre le nerd et la fille canon. Visuellement c'est chouette, les filles sont vraiment magnifiques, l'animation aussi est pas mal... à surveiller mais ça sera mid sûrement.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Gals+can%27t+be+kind+to+Otaku+anime+trailer"
  },
  {
    searchQuery: "The Warrior Princess and the Barbaric Prince",
    title: "The Warrior Princess",
    date: "09 Avril 2026",
    tag: "DARK ROMANCE",
    color: "#7f1d1d",
    review: "Seraphina de Ravilant, commandante en cheffe d'une armée, se fait faire prisonnière par Vehor... s'attendant à la pire torture, son ravisseur veut juste l'épouser ! Et de là commencera une cohabitation étrange.\n\nC'est vraiment de la dark romance, elle tombe amoureuse de son ravisseur, il a des abdos, c'est un daddy, il est beau... bref absolument pas ma came, mais voilà ça peut plaire. L'animation est top tier.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=The+Warrior+Princess+and+the+Barbaric+Prince+trailer"
  },
  {
    searchQuery: "Kujima Utaeba Ie Hororo",
    title: "Kujima : Why Sing, When You Can Warble?",
    date: "09 Avril 2026",
    tag: "COMÉDIE ABSURDE",
    color: "#d97706",
    review: "On suit un échoué au bac qui découvre Kujima, une espèce d'oiseau géant qui parle. Il décide de le recueillir, au début juste pour l'hiver, et on suivra le quotidien de cette famille étrange.\n\nEn vrai c'est super bon délire, c'est une comédie qui ne se prend pas au sérieux, c'est très absurde, mais ça peut et ça va plaire aux gens. La prod est sympa au passage.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Kujima+Why+Sing+When+You+Can+Warble+trailer"
  },
  {
    searchQuery: "Kamiina Botan, Yoeru Sugata wa Yuri no Hana",
    title: "Botan Kamiina Fully Blossoms When Drunk",
    date: "10 Avril 2026",
    tag: "ROMANCE & DÉBAUCHE",
    color: "#f87171",
    review: "Botan, jeune étudiante de 20 ans, découvre l'alcool après sa rencontre avec Ibuki, la responsable du dortoir. Au cours de soirées mi-éméchées mi-heureuses, elles deviennent 'drinking buddies'. C'est aussi rafraîchissant qu'une bière et tout mignon. Si vous aimez le vin et les romances entre lesbiennes, c'est pour vous !",
    cover: "https://images.unsplash.com/photo-1594913785162-e6785b4d7023?q=80&w=800&auto=format&fit=crop", // TODO: Remplacer par officiel local
    trailer_url: "https://www.youtube.com/results?search_query=Botan+Kamiina+Fully+Blossoms+When+Drunk+trailer"
  },
  {
    searchQuery: "The Drops of God anime",
    title: "THE DROPS OF GOD",
    date: "10 Avril 2026",
    tag: "LE ONE PIECE DU VIN",
    color: "#7c2d12",
    review: "C'est le One Piece du vin. On suit le monde viticole qui débute avec la mort de Kanzaki, célèbre critique œnologique. Son héritage ne revient pas directement à son fils Shizuku : il devra identifier 12 vins exceptionnels, les 12 apôtres.\n\nOn suivra des confrontations intéressantes entre amateurs du vin, qui à l'aide de leurs palais divins devront retrouver les vins en question. Shizuku lui malheureusement est dégoûté par le vin, ce qui fera que ça sera intéressant de voir comment il fera. Un grand cru de cette saison.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=The+Drops+of+God+anime+trailer"
  },
  {
    searchQuery: "Yowayowa Sensei",
    title: "Yowayowa Sensei",
    date: "11 Avril 2026",
    tag: "ECCHI & CULTURE",
    color: "#f87171",
    review: "Juste un anime de culture, un ecchi sur une sensei très maladroite à très forte poitrine. Et vous imaginez déjà ce qu'il se fera avec sa grosse poitrine. Le chara design c'est comme 100 girlfriends je trouve.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Yowayowa+Sensei+anime+trailer"
  },
  {
    searchQuery: "I Want to End This Love Game",
    title: "I WANT TO END THIS LOVE GAME",
    date: "14 Avril 2026",
    tag: "LOVE GAME CLASSIQUE",
    color: "#fb7185",
    review: "L'histoire suivra deux amis d'enfance qui depuis petit s'amusent à se dire 'je t'aime' et le premier à craquer bah il perd. Et qui dit amis d'enfance dit amour réel, mais ça va cacher ça sous des trucs.\n\nÇa a l'air correct sans plus, ça manque clairement du génie de Kaguya Sama mais ça peut être divertissant si vous aimez les relations basées sur les quiproquos et les mielleuses situations.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=I+Want+to+End+This+Love+Game+trailer"
  },
  {
    searchQuery: "Candy Caries anime",
    title: "Candy Caries",
    date: "15 Avril 2026",
    tag: "ÉTRANGE & PÂTE À MODELER",
    color: "#4b5563",
    review: "Je sais absolument pas c'est quoi cette merde, mais j'en parle parce que je dois finir la rubrique mais c'est trop étrange, c'est juste une histoire de carie, de démon, le tout en pâte à modeler/slow motion, du fond des enfers.",
    cover: "",
    trailer_url: "https://www.youtube.com/results?search_query=Candy+Caries+anime+trailer"
  },
  {
    searchQuery: "Touken Ranbu Kai",
    title: "Agents of the Four Season",
    date: "28 Mars 2026",
    tag: "L'INCONTOURNABLE",
    color: "#4ade80",
    review: "De quoi ça parle ?\nAu commencement n'existait que l'Hiver qui, incapable de supporter la solitude, choisit de se couper une partie de son essence pour donner naissance au Printemps. Par la volonté de la Terre Mère, il se coupa à nouveau une partie de son essence pour engendrer l'Été et l'Automne.\n\nDe l'oeuvre se dégage une certaine poésie, le ton des couleurs, la nature tout ou presque dans cet anime appelle à la contemplation et à la beauté. Un incontournable de la saison !",
    cover: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop",
    trailer_url: "https://www.youtube.com/results?search_query=Agents+of+the+Four+season+Dance+of+spring+trailer"
  },
  {
    searchQuery: "Maid-san wa Taberu dake",
    title: "The Food Diary of Miss Maid",
    date: "02 Avril 2026",
    tag: "ANIME ASMR",
    color: "#f472b6",
    review: "Pour moi ce sera l'anime Asmr de la saison. On suivra juste la routine gustative (et non culinaire) d'une servante.\n\nLe ton de l'anime est chill et coloré et on suivra des personnages manger tout au long de la série. Entre nourriture et petite tranche de vie, c'est un anime à dévorer sans modération !",
    cover: "https://meitabe-anime.com/assets/img/top/kv.webp",
    trailer_url: "https://www.youtube.com/results?search_query=The+Food+Diary+of+Miss+Maid+trailer"
  },
  {
    searchQuery: "Go For It Nakamura",
    title: "Go For It, Nakamura-kun!",
    date: "02 Avril 2026",
    tag: "ROMANCE BL",
    color: "#60a5fa",
    review: "Je préviens avant de commencer : c'est réellement une romance entre deux hommes. On suivra Nakamura, un jeune homme amoureux de son camarade de classe Hirose, qui tentera tant bien que mal d'entamer une romance avec lui...\n\nLe rendu est super bien. Il oscille entre le tendre, le mignon et l'adorable tout en explorant la complexité des relations avec une certaine justesse. Pour les amoureux de YAOI et de BL, c'est un incontournable !",
    cover: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop",
    trailer_url: "https://www.youtube.com/results?search_query=Go+For+It+Nakamura+trailer"
  },
  {
    searchQuery: "Always a Catch",
    title: "Always a Catch",
    date: "02 Avril 2026",
    tag: "ROMANCE FLUIDE",
    color: "#ffd700",
    review: "Le synopsis est tout simple : Maria était destinée à devenir l'héritière de sa famille, mais la naissance de son petit-frère l'oblige à céder sa place. Elle décide de partir étudier dans un pays voisin dans l'espoir de trouver un mari. Cependant, à son arrivée, le prince annonce la rupture de leurs fiançailles.\n\nLa production a l'air super modeste, mais c'est une oeuvre qui va plaire aux amoureux de romance du genre, même si ça restera un anime moyen.",
    cover: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop",
    trailer_url: "https://www.youtube.com/results?search_query=Always+a+catch+anime+trailer"
  },
  {
    searchQuery: "Kirio Fan Club",
    title: "Kirio Fan Club",
    date: "02 Avril 2026",
    tag: "LOUFOQUE & COLORÉ",
    color: "#a78bfa",
    review: "On suivra AIMI et NAMI, deux camarades de classes qui ont toutes les deux un crush sur Kirio (dont on ne voit jamais le visage d'ailleurs). Elles vont enchainer les trucs étranges et loufoques et leur obsession deviendra le prétexte à une rivalité étrange entre deux filles qui ne parlent que du même mec.\n\nCe qui est sûr, c'est que ça sera particulier de voir le point de vue de ces deux femmes. Je pense qu'ici on va surtout rire !",
    cover: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop",
    trailer_url: "https://www.youtube.com/results?search_query=Kirio+Fan+Club+anime+trailer"
  },
  {
    searchQuery: "Haibara's Teenage New Game",
    title: "Haibara Teenage New Game",
    date: "02 Avril 2026",
    tag: "REVANCHE TEMPORELLE",
    color: "#38bdf8",
    review: "On est clairement sur du school-life/voyage temporel. C'est toujours intéressant de voir un gars prendre sa revanche sur la vie. La réalisation est sommaire mais la bande son est bonne. J'aime beaucoup l'opening, il sera dans mon top 10 à coup sûr. Bref, un anime à ne pas négliger !",
    cover: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop",
    trailer_url: "https://www.youtube.com/results?search_query=Haibara+Teenage+New+Game+anime+trailer"
  }
];

// ─── CONFIG TIERS & CATÉGORIES ───────────────────────────────────────────────
const tierConfig: Record<Tier, { color: string; bg: string; icon: React.ReactNode; label: string; glow: string }> = {
  "Chef-d'œuvre": { color: "#FFD700", bg: "rgba(255,215,0,0.08)",   icon: <Flame size={16} />,       label: "CHEFS-D'ŒUVRE", glow: "0 0 30px rgba(255,215,0,0.3)"   },
  "Pépite":       { color: "#34d399", bg: "rgba(52,211,153,0.08)",  icon: <Gem size={16} />,          label: "PÉPITES",       glow: "0 0 30px rgba(52,211,153,0.3)"  },
  "Bof":          { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", icon: <Meh size={16} />,          label: "BOF",           glow: "0 0 30px rgba(148,163,184,0.2)" },
  "Surcoté":      { color: "#f87171", bg: "rgba(248,113,113,0.08)", icon: <TrendingDown size={16} />, label: "SURCOTÉS",      glow: "0 0 30px rgba(248,113,113,0.3)" },
  "A définir":    { color: "#a1a1aa", bg: "rgba(161,161,170,0.08)", icon: <Clock size={16} />,        label: "EN ATTENTE",    glow: "0 0 10px rgba(161,161,170,0.2)" },
};

const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  "Anime":      { icon: <Tv size={12} />,       color: "#a78bfa" },
  "Manga":      { icon: <BookOpen size={12} />, color: "#f472b6" },
  "Film/Série": { icon: <Film size={12} />,      color: "#60a5fa" },
  "Jeu Vidéo":  { icon: <Gamepad2 size={12} />, color: "#4ade80" },
};

const TIERS: Tier[] = ["Chef-d'œuvre", "Pépite", "Bof", "Surcoté", "A définir"];
const CATEGORIES: Category[] = ["Tout", "Anime", "Manga", "Film/Série", "Jeu Vidéo"];

// ─── ENTRY CARD ──────────────────────────────────────────────────────────────
function EntryCard({ entry, index, onSelect }: { entry: any; index: number; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const tier = tierConfig[entry.tier as Tier] || tierConfig["A définir"];
  const cat  = categoryConfig[entry.category] || categoryConfig["Anime"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onSelect}
      style={{
       ...cardHoverStyle(hovered, (tier.color + "60") as any),
        cursor: "pointer",
        boxShadow: hovered ? tier.glow : "none",
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: "20px", right: "20px", height: "2px",
        background: `linear-gradient(90deg, transparent, ${tier.color}, transparent)`,
        borderRadius: "0 0 4px 4px",
        opacity: hovered ? 1 : 0.4, transition: "opacity 0.3s",
      }} />

      <div style={{ height: "200px", marginBottom: "12px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
        <OptimizedImage src={entry.cover_image} alt={entry.title} />
      </div>

      {/* Badge catégorie */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `${cat.color}18`, border: `1px solid ${cat.color}40`, borderRadius: "100px", padding: "3px 8px", marginBottom: "10px" }}>
        <span style={{ color: cat.color }}>{cat.icon}</span>
        <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 700, color: cat.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{entry.category}</span>
      </div>

      <h3 style={{ fontFamily: font, fontSize: "18px", fontWeight: 900, color: colors.textPrimary, lineHeight: 1.1, textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "6px" }}>
        {entry.title}
      </h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
        <span style={{ ...typography.meta }}>
          {entry.status}{entry.year ? ` · ${entry.year}` : ""}
        </span>
        {entry.trailer_url && (
          <span style={{ ...components.tag, color: colors.youtube, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            ▶ Trailer
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${colors.border}`, paddingTop: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Star size={13} fill={tier.color} color={tier.color} />
          <span style={{ fontFamily: font, fontSize: "22px", fontWeight: 900, color: tier.color, lineHeight: 1 }}>{entry.note}</span>
          <span style={{ ...typography.meta }}>/10</span>
        </div>
        <span style={{ fontFamily: font, fontSize: "10px", fontWeight: 800, color: tier.color, background: tier.bg, border: `1px solid ${tier.color}30`, padding: "3px 8px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {entry.tier}
        </span>
      </div>
    </motion.div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function BibliothequePage() {
  const [oeuvres, setOeuvres]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [dossierBash, setDossierBash]   = useState(DOSSIER_BASH_DATA);
  const [activeCategory, setActiveCategory] = useState<Category>("Tout");
  const [activeTier, setActiveTier]     = useState<Tier | "Tous">("Tous");
  const [searchTerm, setSearchTerm]     = useState("");
  const [sortBy, setSortBy]             = useState("recent");
  const [isMobile, setIsMobile]         = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    fetchOeuvres();
    fetchDossierCovers();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchOeuvres = async () => {
    const { data, error } = await supabase
      .from("bibliotheque")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOeuvres(data);
    setLoading(false);
  };

  const fetchDossierCovers = async () => {
    const fallback = "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?q=80&w=800&auto=format&fit=crop";
    const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

    const updated = await Promise.all(
      DOSSIER_BASH_DATA.map(async (item) => {
        // PRIORITÉ : Si une image est déjà définie en dur (ou stockée localement), on l'utilise directement.
        if (item.cover && item.cover.trim() !== "") {
          return item;
        }

        try {
          // Extraire l'année pour le filtrage (ex: "2026")
          const releaseYearMatch = item.date.match(/\d{4}/);
          const targetYear = releaseYearMatch ? parseInt(releaseYearMatch[0]) : null;

          // 1. Essayer TMDB avec un système de scoring intelligent
          if (apiKey) {
            const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&language=fr-FR&query=${encodeURIComponent(item.searchQuery)}`);
            const json = await res.json();
            
            if (json.results && json.results.length > 0) {
              const scoredResults = json.results
                .filter((x: any) => x.media_type === "tv" || x.media_type === "movie")
                .map((x: any) => {
                  let score = 0;
                  const name = x.name || x.title || "";
                  const originalName = x.original_name || x.original_title || "";
                  
                  // Titre correspondant ?
                  if (name.toLowerCase() === item.title.toLowerCase() || name.toLowerCase() === item.searchQuery.toLowerCase()) score += 10;
                  else if (name.toLowerCase().includes(item.searchQuery.toLowerCase())) score += 5;
                  
                  if (originalName.toLowerCase() === item.searchQuery.toLowerCase()) score += 8;

                  // Animation (ID 16 sur TMDB) ?
                  if (x.genre_ids?.includes(16)) score += 5;

                  // Langue japonaise (Anime) ?
                  if (x.original_language === "ja") score += 5;

                  // Année correspondante ?
                  const releaseDate = x.first_air_date || x.release_date;
                  if (releaseDate && targetYear) {
                    const resYear = parseInt(releaseDate.split("-")[0]);
                    if (resYear === targetYear) score += 5;
                    else if (Math.abs(resYear - targetYear) <= 1) score += 2;
                  }

                  return { ...x, score };
                })
                .sort((a: any, b: any) => b.score - a.score);

              const bestMatch = scoredResults[0] as any;
              if (bestMatch && bestMatch.score >= 5 && bestMatch.poster_path) {
                return { ...item, cover: `https://image.tmdb.org/t/p/w780${bestMatch.poster_path}` };
              }
            }
          }
          
          // 2. Essayer MangaDex
          const mdRes = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(item.searchQuery)}&includes[]=cover_art&limit=1`);
          const mdJson = await mdRes.json();
          if (mdJson.data && mdJson.data.length > 0) {
            const coverRel = mdJson.data[0].relationships.find((r: any) => r.type === "cover_art");
            const coverFileName = coverRel?.attributes?.fileName;
            if (coverFileName) {
               return { ...item, cover: `https://uploads.mangadex.org/covers/${mdJson.data[0].id}/${coverFileName}` };
            }
          }
          
          // 3. Fallback ultime sur AniList (Très précis pour les animes)
          const aliRes = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: `query($search: String) { Media(search: $search, sort: SEARCH_MATCH) { coverImage { extraLarge } } }`,
              variables: { search: item.searchQuery },
            }),
          });
          const aliJson = await aliRes.json();
          const fetchedCover = aliJson?.data?.Media?.coverImage?.extraLarge;
          if (fetchedCover) {
            return { ...item, cover: fetchedCover };
          }

          return { ...item, cover: fallback };
        } catch {
          return { ...item, cover: fallback };
        }
      })
    );
    setDossierBash(updated);
  };

  const mappedEntries = oeuvres.map((d) => ({
    id:          d.id,
    title:       d.title,
    category:    d.type || "Anime",
    tier:        d.tier || "A définir",
    year:        d.year || new Date(d.created_at).getFullYear(),
    cover_image: d.cover_image,
    status:      d.status || "Terminé",
    note:        d.score || 0,
    synopsis:    d.synopsis,
    avis_guilde: d.avis_guilde,
    trailer_url: d.trailer_url,
    created_at:  d.created_at,
  }));

  let filtered = mappedEntries.filter((e) => {
    const matchCat    = activeCategory === "Tout" || e.category === activeCategory;
    const matchTier   = activeTier === "Tous" || e.tier === activeTier;
    const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchTier && matchSearch;
  });

  filtered.sort((a, b) => {
    if (sortBy === "recent")  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "oldest")  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === "note")    return b.note - a.note;
    if (sortBy === "alpha")   return a.title.localeCompare(b.title);
    return 0;
  });

  const entriesByTier = TIERS.map((tier) => ({
    tier,
    items: filtered.filter((e) => e.tier === tier),
  })).filter((g) => g.items.length > 0);

  // ─── STYLES LOCAUX (tokens) ──────────────────────────────────────────────
  const sectionAccentBar: React.CSSProperties = { width: "32px", height: "3px", background: colors.gold, borderRadius: "2px" };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, color: colors.textPrimary, fontFamily: font, overflowX: "hidden", position: "relative" }}>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: ${colors.bg}; }
        ::-webkit-scrollbar-thumb { background: ${colors.goldBorder}; border-radius: 2px; }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", left: "-10%", width: "70vw", height: "70vw", background: `radial-gradient(circle, ${colors.goldLight} 0%, transparent 65%)`, filter: "blur(60px)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 65%)", filter: "blur(80px)" }} />
      </div>

      <GuildeHeader activePage="bibliotheque" />

      <div style={{ position: "relative", zIndex: 10 }}>

        {/* ── HERO ── */}
        <motion.section ref={heroRef} style={{ y: heroY, opacity: heroOpacity }}>
          <div style={{ padding: isMobile ? "60px 20px 40px" : "90px 48px 60px", maxWidth: "1100px", margin: "0 auto" }}>
            <motion.p initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              style={{ ...typography.overline, marginBottom: "16px" }}>
              Guilde Otaku · Saison 2025/26
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: isMobile ? "clamp(40px,12vw,64px)" : "clamp(72px,9vw,120px)", fontWeight: 900, fontStyle: "italic", lineHeight: 0.9, textTransform: "uppercase", letterSpacing: "-0.03em", marginBottom: "24px" }}>
              LA <span style={{ color: colors.gold }}>BIBLIOTHÈQUE</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ ...typography.body, letterSpacing: "0.08em", maxWidth: "480px" }}>
              Les verdicts définitifs de la Guilde. Animes, mangas, films, séries et jeux vidéo jugés sans pitié.
            </motion.p>
          </div>
        </motion.section>

        {/* ── DOSSIER DU BASH ── */}
        <section style={{ padding: isMobile ? "0 20px 60px" : "0 48px 80px", maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
              <div style={sectionAccentBar} />
              <span style={{ ...typography.sectionLabel }}>LE DOSSIER DU BASH · PRINTEMPS 2026</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              {dossierBash.map((anime, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.015, borderColor: anime.color }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    const dbMatch = mappedEntries.find(e =>
                      e.title.toLowerCase().includes(anime.searchQuery.toLowerCase()) ||
                      e.title.toLowerCase() === anime.title.toLowerCase()
                    );
                    setSelectedEntry(dbMatch ?? {
                      title:       anime.title,
                      category:    "Anime",
                      tier:        index === 0 ? "Chef-d'œuvre" : "A définir",
                      year:        2026,
                      cover_image: anime.cover,
                      status:      "Saison Printemps",
                      note:        "✨",
                      avis_guilde: anime.review,
                      trailer_url: anime.trailer_url,
                      synopsis:    "Cette œuvre n'a pas encore sa fiche complète dans la base de données de la Guilde.",
                    });
                  }}
                  style={{
                    position: "relative", overflow: "hidden", cursor: "pointer",
                    background: index === 0
                      ? "linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(74,222,128,0.05) 100%)"
                      : colors.bgCard,
                    border: `1px solid ${index === 0 ? "rgba(74,222,128,0.3)" : colors.border}`,
                    borderRadius: "24px",
                    padding: isMobile ? "28px 24px" : "40px",
                    backdropFilter: "blur(20px)",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: "32px",
                    alignItems: isMobile ? "flex-start" : "center",
                  }}
                >
                  {/* Affiche */}
                  <div style={{ flexShrink: 0, width: isMobile ? "100%" : "320px", height: isMobile ? "auto" : "480px", aspectRatio: isMobile ? "2/3" : "auto", borderRadius: "16px", overflow: "hidden", border: `1px solid ${anime.color}40`, boxShadow: `0 20px 40px ${anime.color}30`, background: colors.bgCard, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {anime.cover
                      ? <OptimizedImage src={anime.cover} alt={anime.title} />
                      : <span style={{ ...typography.meta, fontStyle: "italic" }}>Chargement...</span>
                    }
                  </div>

                  {/* Texte */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                      <span style={{ fontFamily: font, fontSize: "12px", fontWeight: 800, color: anime.color, letterSpacing: "0.15em", textTransform: "uppercase", background: `${anime.color}15`, border: `1px solid ${anime.color}30`, padding: "6px 14px", borderRadius: "100px" }}>
                        {anime.tag}
                      </span>
                      <span style={{ ...typography.meta, display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={14} style={{ display: "inline", verticalAlign: "middle" }} />
                        {anime.date}
                      </span>
                    </div>

                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "32px" : "48px", fontWeight: 900, lineHeight: 1.1, textTransform: "uppercase", fontStyle: "italic", marginBottom: "24px", color: colors.textPrimary, letterSpacing: "-0.02em" }}>
                      {anime.title}
                    </h2>

                    <div style={{ position: "relative", paddingLeft: "28px", borderLeft: `4px solid ${anime.color}50`, marginBottom: "24px" }}>
                      <Quote size={24} color={`${anime.color}60`} style={{ position: "absolute", top: -4, left: "-14px", background: index === 0 ? "none" : colors.bg, padding: "2px" }} />
                      {anime.review.split("\n\n").map((para, pi) => (
                        <p key={pi} style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "16px" : "18px", fontWeight: 500, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", marginBottom: pi === anime.review.split("\n\n").length - 1 ? 0 : "20px" }}>
                          {para}
                        </p>
                      ))}
                    </div>

                    {anime.trailer_url && (
                      <a href={anime.trailer_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", background: "rgba(248,113,113,0.1)", border: `1px solid rgba(248,113,113,0.3)`, borderRadius: "10px", fontFamily: font, fontSize: "14px", fontWeight: 900, color: colors.youtube, textTransform: "uppercase", letterSpacing: "0.1em", textDecoration: "none" }}>
                        <Youtube size={18} /> Voir le Trailer
                      </a>
                    )}

                    <div style={{ marginTop: "24px", ...typography.meta, fontStyle: "italic", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", borderTop: `1px solid ${colors.border}`, paddingTop: "12px" }}>
                      → Cliquer pour voir la fiche détaillée
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── TIER LIST ── */}
        <section style={{ padding: isMobile ? "0 20px 80px" : "0 48px 100px", maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" }}>
            <div style={sectionAccentBar} />
            <span style={{ ...typography.sectionLabel }}>TIER LIST OTAKU</span>
          </motion.div>

          {/* FILTERS & SORT */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px", marginBottom: "40px", flexWrap: "wrap", alignItems: isMobile ? "stretch" : "center" }}>

            {/* Recherche */}
            <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
              <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: colors.textMuted }} />
              <input type="text" placeholder="Rechercher un titre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...components.input, padding: "10px 14px 10px 38px", borderRadius: "100px" }} />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: colors.textMuted, cursor: "pointer", minHeight: "unset", minWidth: "unset" }}>
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Tri */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: colors.bgCard, border: `1px solid ${colors.border}`, padding: "8px 14px", borderRadius: "100px" }}>
              <ArrowUpDown size={14} color={colors.textSecondary} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                style={{ background: "transparent", border: "none", color: colors.textPrimary, fontFamily: font, fontSize: "14px", outline: "none", cursor: "pointer", textTransform: "uppercase", fontWeight: 700 }}>
                <option value="recent"  style={{ background: colors.bg }}>Plus récents</option>
                <option value="oldest"  style={{ background: colors.bg }}>Plus anciens</option>
                <option value="note"    style={{ background: colors.bg }}>Mieux notés</option>
                <option value="alpha"   style={{ background: colors.bg }}>De A à Z</option>
              </select>
            </div>

            {/* Catégories */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={filterPillStyle(activeCategory === cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          {/* RÉSULTATS */}
          <AnimatePresence mode="wait">
            <motion.div key={`${activeCategory}-${activeTier}-${searchTerm}-${sortBy}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(220px,1fr))", gap: isMobile ? "10px" : "16px" }}>
                  {[1,2,3,4,5,6,7,8].map((i) => <SkeletonCard key={i} />)}
                </div>
              ) : entriesByTier.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", ...typography.body, fontSize: "20px", fontStyle: "italic" }}>
                  Aucune œuvre trouvée dans ces filtres...
                </div>
              ) : (
                entriesByTier.map(({ tier, items }) => {
                  const cfg = tierConfig[tier as Tier];
                  return (
                    <motion.div key={tier} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5 }} style={{ marginBottom: "56px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", paddingBottom: "14px", borderBottom: `1px solid ${cfg.color}20` }}>
                        <div style={{ width: "6px", height: "32px", background: cfg.color, borderRadius: "3px", boxShadow: cfg.glow }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: cfg.color }}>
                          {cfg.icon}
                          <h2 style={{ fontFamily: font, fontSize: "30px", fontWeight: 900, color: cfg.color, textTransform: "uppercase", letterSpacing: "-0.01em", fontStyle: "italic", lineHeight: 1 }}>{cfg.label}</h2>
                        </div>
                        <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${cfg.color}30, transparent)` }} />
                        <span style={{ ...typography.meta }}>{items.length} titre{items.length > 1 ? "s" : ""}</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(auto-fill,minmax(220px,1fr))", gap: isMobile ? "10px" : "16px" }}>
                        <AnimatePresence>
                          {items.map((entry, i) => (
                            <EntryCard key={entry.id} entry={entry} index={i} onSelect={() => setSelectedEntry(entry)} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </div>

      {/* ── MODAL ── */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedEntry(null)}
            style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: "#0d0d14", border: `1px solid ${tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold}40`, borderRadius: "24px", padding: isMobile ? "28px 24px" : "40px", maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: tierConfig[selectedEntry.tier as Tier]?.glow, position: "relative" }}
            >
              <button onClick={() => setSelectedEntry(null)} style={{ position: "absolute", top: "16px", right: "16px", background: colors.bgHover, border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.textPrimary, minHeight: "unset", minWidth: "unset" }}>
                <X size={16} />
              </button>

              <div style={{ position: "absolute", top: 0, left: "20px", right: "20px", height: "3px", background: `linear-gradient(90deg, transparent, ${tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold}, transparent)`, borderRadius: "0 0 4px 4px" }} />

              {/* Cover */}
              <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
                <div style={{ width: "180px", height: "250px", borderRadius: "12px", overflow: "hidden", border: `1px solid ${tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold}40` }}>
                  <OptimizedImage src={selectedEntry.cover_image} alt={selectedEntry.title} />
                </div>
              </div>

              {/* Tier + catégorie */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: font, fontSize: "11px", fontWeight: 800, color: tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold, background: tierConfig[selectedEntry.tier as Tier]?.bg, border: `1px solid ${tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold}30`, padding: "3px 10px", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {selectedEntry.tier}
                </span>
                <span style={{ ...typography.meta }}>
                  {selectedEntry.category}{selectedEntry.year ? ` · ${selectedEntry.year}` : ""}
                </span>
              </div>

              <h2 style={{ fontFamily: font, fontSize: isMobile ? "28px" : "36px", fontWeight: 900, color: colors.textPrimary, textTransform: "uppercase", fontStyle: "italic", lineHeight: 1, marginBottom: "8px", textAlign: "center" }}>
                {selectedEntry.title}
              </h2>

              <p style={{ ...typography.meta, marginBottom: "20px", textAlign: "center" }}>
                Statut : {selectedEntry.status}
              </p>

              {/* Note */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "24px" }}>
                <Star size={18} fill={tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold} color={tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold} />
                <span style={{ fontFamily: font, fontSize: "40px", fontWeight: 900, color: tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold, lineHeight: 1 }}>
                  {selectedEntry.note}
                </span>
                <span style={{ ...typography.meta, fontSize: "16px" }}>/10</span>
              </div>

              {/* Avis guilde */}
              {selectedEntry.avis_guilde && (
                <div style={{ marginBottom: "24px", padding: "20px", background: colors.goldLight, borderLeft: `4px solid ${colors.gold}`, borderRadius: "0 12px 12px 0" }}>
                  <p style={{ fontFamily: font, fontSize: "14px", color: colors.gold, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>L'Avis de la Guilde</p>
                  <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "16px" : "18px", fontWeight: 500, lineHeight: 1.7, color: "rgba(255,255,255,0.9)", fontStyle: "italic" }}>"{selectedEntry.avis_guilde}"</p>
                </div>
              )}

              {/* Synopsis */}
              <div style={{ marginBottom: "28px", padding: "20px", background: colors.bgCard, borderRadius: "12px", border: `1px solid ${colors.border}` }}>
                <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: isMobile ? "15px" : "16px", fontWeight: 400, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>
                  {selectedEntry.synopsis || "Aucun synopsis disponible pour cette œuvre."}
                </p>
              </div>

              {/* Trailer */}
              {selectedEntry.trailer_url && (
                <a href={selectedEntry.trailer_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "12px", fontFamily: font, fontSize: "16px", fontWeight: 900, color: colors.youtube, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", textDecoration: "none", marginBottom: "12px" }}>
                  <Youtube size={18} /> Voir le Trailer
                </a>
              )}

              {/* Éditer */}
              <Link href="/admin-biblio"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "14px", background: colors.goldLight, border: `1px solid ${colors.goldBorder}`, borderRadius: "12px", fontFamily: font, fontSize: "16px", fontWeight: 900, color: colors.gold, textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", textDecoration: "none", marginBottom: "12px" }}>
                <Pencil size={18} /> Éditer la Fiche
              </Link>

              {/* Fermer */}
              <button onClick={() => setSelectedEntry(null)}
                style={{ width: "100%", padding: "14px", background: tierConfig[selectedEntry.tier as Tier]?.color ?? colors.gold, border: "none", borderRadius: "12px", fontFamily: font, fontSize: "16px", fontWeight: 900, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer" }}>
                FERMER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}