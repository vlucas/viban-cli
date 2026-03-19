// This file runs before each test file via bunfig.toml [test] preload.
// It sets VIBAN_DB to an in-memory SQLite database so tests never touch
// the real database at ~/.viban/db.sqlite.
process.env.VIBAN_DB = ':memory:';
