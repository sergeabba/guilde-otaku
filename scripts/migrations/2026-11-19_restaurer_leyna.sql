-- Guilde Otaku : restauration de la fiche de Dr Leyna-Chloé (membre n°3).
-- À exécuter MANUELLEMENT dans l'éditeur SQL Supabase, après relecture.
-- Ne supprime rien. Trois cas, traités dans l'ordre :
--   1. sa fiche existe encore (masquée) : elle est réaffichée et mise à jour ;
--   2. le n°3 est libre : sa fiche est recréée avec ce numéro ;
--   3. le n°3 est pris par quelqu'un d'autre : sa fiche est créée sous un nouveau
--      numéro, sans toucher à l'autre membre.
-- Grade Monarque, statistiques au maximum (100), nouvelle attaque spéciale.
-- Portraits déjà présents sur le site : /photos/leyna.jpg et /anime/leyna_anime.jpg.
-- Placée juste après Jaïze Ben (même position, départagée par le numéro).

do $$
declare
  v_bio     text  := 'La Grande Dr Leyna-Chloé, également nommée la Mère du Peuple ; elle nous guidera tous à la Christmas Bowl. Charisme digne d''une reine.';
  v_stats   jsonb := '{"force": 100, "vitesse": 100, "technique": 100}';
  v_special jsonb := '{"name": "Ordonnance Souveraine", "effect": "Rédige une ordonnance que nul n''ose refuser : sa prestance fige l''adversaire sur place, et un remède de sa pharmacie lui rend 60 % de ses PV."}';
  v_pos     integer := (select position from public.fighters where id = 2);
  v_always  boolean := exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'fighters' and column_name = 'id' and identity_generation = 'ALWAYS');
begin
  if exists (select 1 from public.fighters where id = 3 and name ilike '%leyna%') then
    update public.fighters set
      name = 'Dr Leyna-Chloé', rank = 'Monarque', birthday = '22 octobre', bio = v_bio,
      photo = '/photos/leyna.jpg', animechar = '/anime/leyna_anime.jpg', color = '#FFD700',
      stats = v_stats, special = v_special, hidden = false
    where id = 3;
    raise notice 'Fiche n°3 réaffichée et mise à jour.';
  elsif not exists (select 1 from public.fighters where id = 3) then
    -- Numéro 3 imposé (colonne identité « always » : clause OVERRIDING nécessaire).
    execute format(
      'insert into public.fighters (id, name, rank, birthday, bio, photo, animechar, color, stats, special, hidden, position, extras) %s
       values (3, %L, %L, %L, %L, %L, %L, %L, %L::jsonb, %L::jsonb, false, %s, %L::jsonb)',
      case when v_always then 'overriding system value' else '' end,
      'Dr Leyna-Chloé', 'Monarque', '22 octobre', v_bio, '/photos/leyna.jpg', '/anime/leyna_anime.jpg', '#FFD700',
      v_stats, v_special, coalesce(v_pos::text, 'null'), '{}');
    raise notice 'Fiche recréée sous le n°3.';
  else
    insert into public.fighters (name, rank, birthday, bio, photo, animechar, color, stats, special, hidden, position, extras)
    values ('Dr Leyna-Chloé', 'Monarque', '22 octobre', v_bio, '/photos/leyna.jpg', '/anime/leyna_anime.jpg', '#FFD700',
            v_stats, v_special, false, v_pos, '{}');
    raise notice 'Le n°3 est pris : fiche créée sous un nouveau numéro.';
  end if;
end $$;

-- VÉRIFICATION
-- select id, name, rank, hidden, stats, special from public.fighters where name ilike '%leyna%';
--   -> une ligne, Monarque, hidden = false, statistiques à 100.

-- ANNULATION (si besoin)
-- delete from public.fighters where name ilike '%leyna%';
