INSERT INTO platforms (name)
VALUES
('Gamecube'),
('Playstation 2'),
('PC'),
('Wii'),
('Dreamcast'),
('Playstation 3'),
('Xbox 360');

INSERT INTO regions (name, code)
VALUES
('North America', 'NA'),
('Japan', 'JP'),
('PAL', 'PAL'),
('Worldwide', 'WW');

INSERT INTO games (title)
VALUES
('Resident Evil 4'),
('Sonic Adventure 2');

INSERT INTO releases
(game_id, platform_id, region_id, release_format, release_date)
VALUES
(1, 1, 1, 'PHYSICAL', '2005-01-11'),
(1, 1, 2, 'PHYSICAL', '2005-01-27'),
(2, 5, 1, 'PHYSICAL', '2001-06-19');

-- For SQL Join:

SELECT
    games.title,
    platforms.name AS platform,
    regions.name AS region,
    releases.release_format,
    releases.release_date
FROM releases
JOIN games
    ON releases.game_id = games.id
JOIN platforms
    ON releases.platform_id = platforms.id
JOIN regions
    ON releases.region_id = regions.id;