-- ─── Table film_semaine ─────────────────────────────────────────────────────────
-- Films du week-end de la Guilde Otaku.
-- Chaque entrée = un film ajouté à une semaine donnée, enrichi via TMDB.

CREATE TABLE IF NOT EXISTS film_semaine (
  id             BIGSERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  tmdb_id        INTEGER,
  week_label     TEXT NOT NULL,            -- "Semaine du 18 Avril 2026"
  week_date      DATE NOT NULL,            -- date du lundi de la semaine (pour trier)
  poster_path    TEXT,                     -- chemin TMDB: /xxx.jpg
  backdrop_path  TEXT,                     -- chemin TMDB backdrop
  synopsis       TEXT,
  trailer_key    TEXT,                     -- clé YouTube du trailer
  vote_average   NUMERIC(3,1),            -- note TMDB (ex: 7.8)
  genres         TEXT,                     -- "Action, Thriller, Science-Fiction"
  year           INTEGER,
  runtime        INTEGER,                  -- durée en minutes
  director       TEXT,                     -- réalisateur
  watched        BOOLEAN DEFAULT FALSE,    -- film déjà vu en soirtée
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour trier par semaine
CREATE INDEX IF NOT EXISTS idx_film_semaine_week_date ON film_semaine (week_date DESC);

-- RLS désactivé (app publique, clé anon déjà limitée)
ALTER TABLE film_semaine ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read film_semaine" ON film_semaine FOR SELECT USING (true);
CREATE POLICY "Service role all film_semaine" ON film_semaine FOR ALL USING (true);
