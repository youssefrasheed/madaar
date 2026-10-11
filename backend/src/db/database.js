/**
 * Native macOS SQLite Driver Adapter
 * Provides identical API to better-sqlite3 using macOS native /usr/bin/sqlite3
 * Zero external C++ dependencies, zero build issues on any Node.js version.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/database.sqlite');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Dynamic sqlite3 executable (works on macOS, Alpine, Ubuntu, Docker)
const SQLITE_BIN = process.env.SQLITE_PATH || (fs.existsSync('/usr/bin/sqlite3') ? '/usr/bin/sqlite3' : 'sqlite3');

class SQLiteDatabase {
  constructor(filePath) {
    this.filePath = filePath;
  }

  // Format a JS value into safe SQL literal
  _formatParam(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return isFinite(val) ? String(val) : 'NULL';
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
  }

  // Bind positional ? parameters into SQL statement
  _bind(sql, params) {
    if (!params || params.length === 0) return sql;
    let idx = 0;
    return sql.replace(/\?/g, () => {
      if (idx < params.length) {
        return this._formatParam(params[idx++]);
      }
      return 'NULL';
    });
  }

  // Execute raw SQL command directly
  exec(sql) {
    try {
      execFileSync(SQLITE_BIN, [this.filePath], {
        input: sql,
        encoding: 'utf8',
        maxBuffer: 50 * 1024 * 1024
      });
    } catch (err) {
      console.error('SQL exec error:', err.message);
      throw err;
    }
  }

  pragma(statement) {
    try {
      this.exec(`PRAGMA ${statement};`);
    } catch (e) {}
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        // Flatten params in case passed as single array
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const boundSql = self._bind(sql, flatParams);
        const queryWithMeta = `
          BEGIN TRANSACTION;
          ${boundSql};
          SELECT changes() as changes, last_insert_rowid() as lastInsertRowid;
          COMMIT;
        `;
        try {
          const out = execFileSync(SQLITE_BIN, ['-json', self.filePath], {
            input: queryWithMeta,
            encoding: 'utf8'
          });
          const rows = out.trim() ? JSON.parse(out) : [];
          const last = rows[rows.length - 1] || { changes: 0, lastInsertRowid: 0 };
          return {
            changes: Number(last.changes || 0),
            lastInsertRowid: Number(last.lastInsertRowid || 0)
          };
        } catch (err) {
          console.error('SQL run error on:', boundSql, err.message);
          throw err;
        }
      },

      get(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const boundSql = self._bind(sql, flatParams);
        try {
          const out = execFileSync(SQLITE_BIN, ['-json', self.filePath], {
            input: boundSql,
            encoding: 'utf8'
          });
          const trimmed = out.trim();
          if (!trimmed) return undefined;
          const rows = JSON.parse(trimmed);
          return rows.length > 0 ? rows[0] : undefined;
        } catch (err) {
          console.error('SQL get error on:', boundSql, err.message);
          throw err;
        }
      },

      all(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const boundSql = self._bind(sql, flatParams);
        try {
          const out = execFileSync(SQLITE_BIN, ['-json', self.filePath], {
            input: boundSql,
            encoding: 'utf8'
          });
          const trimmed = out.trim();
          if (!trimmed) return [];
          return JSON.parse(trimmed);
        } catch (err) {
          console.error('SQL all error on:', boundSql, err.message);
          throw err;
        }
      }
    };
  }

  close() {}
}

const db = new SQLiteDatabase(dbPath);

// Enable pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  seedInitialData();
}

// Seed initial mock data (disabled)
function seedInitialData() {}

initSchema();

module.exports = db;
