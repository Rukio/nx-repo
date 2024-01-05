#!/bin/sh

path=/app/dist
npx prisma migrate deploy --schema "$path/prisma/schema.prisma"

exec node "$path/main"