#!/bin/bash
set -e  # Exit immediately on first error

PG_VERSION=16.2
PG_DIR="$HOME/pgsql"
PG_DATA="$PG_DIR/data"
PG_LOG="$PG_DIR/logfile"
PG_URL="https://ftp.postgresql.org/pub/source/v${PG_VERSION}/postgresql-${PG_VERSION}.tar.gz"

echo "📦 Installing PostgreSQL $PG_VERSION in $PG_DIR..."

# 1. Download & extract source if needed
if [ ! -f "postgresql-${PG_VERSION}.tar.gz" ]; then
  echo "⬇️ Downloading PostgreSQL $PG_VERSION..."
  wget -q "$PG_URL"
fi

if [ ! -d "postgresql-${PG_VERSION}" ]; then
  echo "📂 Extracting sources..."
  tar -xzf "postgresql-${PG_VERSION}.tar.gz"
fi

cd "postgresql-${PG_VERSION}"

# 2. Configure, build, install
echo "⚙️ Configuring..."
./configure --prefix="$PG_DIR" --without-icu --without-readline

echo "🔨 Building..."
make -j"$(nproc)"

echo "📥 Installing..."
make install

# 3. Ensure PATH includes PostgreSQL bin
if ! grep -q "$PG_DIR/bin" "$HOME/.zshrc"; then
  echo "export PATH=$PG_DIR/bin:\$PATH" >> "$HOME/.zshrc"
  echo "🔧 PATH added to ~/.zshrc"
fi
export PATH="$PG_DIR/bin:$PATH"

# 4. Reset data directory if needed
if [ -d "$PG_DATA" ]; then
  if [ -f "$PG_DATA/postmaster.pid" ]; then
    echo "🛑 Stopping old server..."
    pg_ctl -D "$PG_DATA" stop || true
  fi
  echo "🧹 Cleaning old data directory..."
  rm -rf "$PG_DATA"
fi

# 5. Initialize fresh cluster
echo "🆕 Initializing database cluster..."
initdb -D "$PG_DATA"

# 6. Start PostgreSQL server
echo "🚀 Starting PostgreSQL server..."
pg_ctl -D "$PG_DATA" -l "$PG_LOG" start

# Wait until ready
echo "⏳ Waiting for server to start..."
for i in {1..10}; do
  if pg_ctl -D "$PG_DATA" status >/dev/null 2>&1; then
    echo "✅ PostgreSQL server is running!"
    break
  fi
  sleep 1
done

# 7. Create database (only if not exists)
if ! psql -U "$USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='blogdb';" | grep -q 1; then
  echo "📚 Creating database blogdb..."
  createdb -U "$USER" blogdb
else
  echo "ℹ️ Database blogdb already exists"
fi

# 8. Create user (only if not exists)
if ! psql -U "$USER" -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='bloguser';" | grep -q 1; then
  echo "👤 Creating user bloguser..."
  psql -U "$USER" -d postgres -c "CREATE USER bloguser WITH PASSWORD 'StrongPassword123!';"
else
  echo "ℹ️ User bloguser already exists"
fi

# 9. Grant privileges
psql -U "$USER" -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE blogdb TO bloguser;"
psql -U "$USER" -d blogdb -c "GRANT USAGE, CREATE ON SCHEMA public TO bloguser;"
psql -U "$USER" -d blogdb -c "ALTER SCHEMA public OWNER TO bloguser;"

echo "✅ PostgreSQL $PG_VERSION ready!"
echo "✅ Database 'blogdb' created and owned by $USER"
echo "✅ User 'bloguser' granted full privileges!"
echo "👉 Connect with: psql -U bloguser -d blogdb"
