#!/bin/sh
# Substitute environment variables in the served files
if [ ! -z "$VITE_API_URL" ]; then
  find /app/apps/web/dist -name "*.js" -type f -exec sed -i "s|http://localhost:4000|${VITE_API_URL}|g" {} \;
fi
# Start serve
exec serve -s apps/web/dist -l 5173
