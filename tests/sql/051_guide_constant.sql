-- guide is one constant row that reads no table: the answer does not change when the tables are emptied or filled (the C# test compares both answers)
DELETE FROM passages;
DELETE FROM documents;
SELECT (SELECT count(*) FROM (SELECT $g$text$g$ AS text) g) = 1
   AND (SELECT count(*) FROM documents) = 0 AS ok
