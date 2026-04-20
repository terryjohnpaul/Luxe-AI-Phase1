#!/bin/bash
APP_ID="961336273536452"
APP_SECRET="3e4fbabc8ddc1b4ba2990955bea6e4a3"
ENV_FILE="/root/luxe-ai/.env"
CURRENT_TOKEN=$(grep AJIO_LUXE_META_ACCESS_TOKEN $ENV_FILE | cut -d= -f2)
if [ -z "$CURRENT_TOKEN" ]; then exit 1; fi
RESPONSE=$(curl -s "https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$APP_ID&client_secret=$APP_SECRET&fb_exchange_token=$CURRENT_TOKEN")
NEW_TOKEN=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
if [ -z "$NEW_TOKEN" ]; then echo "[AJIO TOKEN] Failed: $RESPONSE"; exit 1; fi
sed -i "s|AJIO_LUXE_META_ACCESS_TOKEN=.*|AJIO_LUXE_META_ACCESS_TOKEN=$NEW_TOKEN|" $ENV_FILE
cd /root/luxe-ai && pm2 restart luxe-ai --update-env > /dev/null 2>&1
echo "[AJIO TOKEN] Refreshed at $(date)"
