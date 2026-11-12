-- dp-sk-metodika 0002: full-text configuration sk_unaccent (D142/D149): simple (lower-case tokens, no stemming) + the unaccent dictionary, so a query typed
-- without diacritics matches a word with diacritics and the other way round. PostgreSQL ships no Slovak configuration. The Host provides the unaccent
-- extension (allow-list of the dataset provisioner); names resolve through the search_path of the migration role (dataset schema, public).
-- The registry forbids DO, DROP and extension creation, and CREATE TEXT SEARCH CONFIGURATION has no IF NOT EXISTS: this migration is applied once.
CREATE TEXT SEARCH CONFIGURATION sk_unaccent (COPY = simple);
ALTER TEXT SEARCH CONFIGURATION sk_unaccent
    ALTER MAPPING FOR asciiword, word, hword, hword_asciipart, hword_part, asciihword
    WITH unaccent, simple;
