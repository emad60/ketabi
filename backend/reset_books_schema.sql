-- حذف الجداول القديمة للكتب
DROP TABLE IF EXISTS books_book CASCADE;
DROP TABLE IF EXISTS books_gradesubject CASCADE;
DROP TABLE IF EXISTS books_term CASCADE;
DROP TABLE IF EXISTS books_grade CASCADE;
DROP TABLE IF EXISTS books_subject CASCADE;

-- حذف السجل من django_migrations
DELETE FROM django_migrations WHERE app = 'books';
