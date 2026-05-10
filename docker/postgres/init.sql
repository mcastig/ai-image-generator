CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  color TEXT,
  resolution TEXT NOT NULL DEFAULT '1024x1024',
  guidance DECIMAL(4,2) NOT NULL DEFAULT 5.0,
  image_url TEXT NOT NULL,
  seed BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saved_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_images_prompt ON images USING gin(to_tsvector('english', prompt));
CREATE INDEX IF NOT EXISTS idx_saved_images_user_id ON saved_images(user_id);
