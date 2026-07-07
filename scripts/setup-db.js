const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://dlfnlihezsmbdpsmnker.supabase.co',
  process.env.SUPABASE_SECRET_KEY
)

async function setupSchema() {
  console.log('建立 schema...')

  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY,
        name_en TEXT NOT NULL,
        country TEXT,
        prefecture TEXT,
        region TEXT,
        status TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS travel_stories (
        id INTEGER PRIMARY KEY,
        property_id INTEGER REFERENCES properties(id),
        neighbor_id TEXT,
        author_email TEXT,
        title TEXT,
        description TEXT,
        zh_tw_title TEXT,
        zh_tw_description TEXT,
        locale TEXT,
        hafh_region TEXT,
        likes_count INTEGER DEFAULT 0,
        images_count INTEGER DEFAULT 0,
        cover_image_id TEXT,
        published_at TIMESTAMPTZ,
        hafh_url TEXT,
        claimed_by UUID REFERENCES auth.users(id),
        claimed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS story_tags (
        id SERIAL PRIMARY KEY,
        story_id INTEGER REFERENCES travel_stories(id) ON DELETE CASCADE,
        tag TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_story_tags_tag ON story_tags(tag);
      CREATE INDEX IF NOT EXISTS idx_story_tags_story ON story_tags(story_id);
      CREATE INDEX IF NOT EXISTS idx_stories_property ON travel_stories(property_id);
      CREATE INDEX IF NOT EXISTS idx_stories_region ON travel_stories(hafh_region);
    `
  })

  if (e1) {
    console.log('rpc 不可用，改用直接建表方式')
    await createTablesDirectly()
  } else {
    console.log('Schema 建立完成')
  }
}

async function createTablesDirectly() {
  // Test connection
  const { data, error } = await supabase.from('properties').select('count').limit(1)
  if (error && error.code === '42P01') {
    console.log('表不存在，請到 Supabase Dashboard → SQL Editor 執行以下 SQL：')
    console.log(`
CREATE TABLE properties (
  id INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  country TEXT,
  prefecture TEXT,
  region TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE travel_stories (
  id INTEGER PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id),
  neighbor_id TEXT,
  author_email TEXT,
  title TEXT,
  description TEXT,
  zh_tw_title TEXT,
  zh_tw_description TEXT,
  locale TEXT,
  hafh_region TEXT,
  likes_count INTEGER DEFAULT 0,
  images_count INTEGER DEFAULT 0,
  cover_image_id TEXT,
  published_at TIMESTAMPTZ,
  hafh_url TEXT,
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE story_tags (
  id SERIAL PRIMARY KEY,
  story_id INTEGER REFERENCES travel_stories(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

CREATE INDEX idx_story_tags_tag ON story_tags(tag);
CREATE INDEX idx_story_tags_story ON story_tags(story_id);
CREATE INDEX idx_stories_property ON travel_stories(property_id);
CREATE INDEX idx_stories_region ON travel_stories(hafh_region);
    `)
  } else {
    console.log('連線成功，表已存在')
  }
}

setupSchema()
