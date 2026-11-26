// Script de démarrage de la préférence de portrait (sans dépendance React : utilisable côté serveur).
export const FACE_KEY = "gk-face";
export const FACE_INIT_SCRIPT = `try{document.documentElement.dataset.face=localStorage.getItem("${FACE_KEY}")==="real"?"real":"anime"}catch(e){document.documentElement.dataset.face="anime"}`;
