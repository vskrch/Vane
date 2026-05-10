import path from 'path';

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const dbDir = path.join(DATA_DIR, 'data');

export default {
  dialect: 'sqlite',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: path.join(dbDir, 'db.sqlite'),
  },
};
