#!/bin/bash
# Auto-refresh Meta Ads long-lived tokens
# Runs every 45 days via cron (tokens last 60 days, 15-day safety margin)

ENV_FILE="/root/luxe-ai/.env"
LOG_FILE="/root/luxe-ai/token-refresh.log"

APP_ID=$(grep META_APP_ID $ENV_FILE | cut -d= -f2)
APP_SECRET=$(grep META_APP_SECRET $ENV_FILE | cut -d= -f2)

if [ -z "$APP_ID" ] || [ -z "$APP_SECRET" ]; then
  echo "[$(date)] ERROR: META_APP_ID or META_APP_SECRET not found in .env" >> $LOG_FILE
  exit 1
fi

refresh_token() {
  local TOKEN_NAME=$1
  local CURRENT_TOKEN=$(grep "^${TOKEN_NAME}=" $ENV_FILE | cut -d= -f2)

  if [ -z "$CURRENT_TOKEN" ]; then
    echo "[$(date)] SKIP: $TOKEN_NAME not found in .env" >> $LOG_FILE
    return
  fi

  RESPONSE=$(curl -s "https://graph.facebook.com/v25.0/oauth/access_token?grant_type=fb_exchange_token&client_id=$APP_ID&client_secret=$APP_SECRET&fb_exchange_token=$CURRENT_TOKEN")

  NEW_TOKEN=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

  if [ -z "$NEW_TOKEN" ]; then
    echo "[$(date)] FAILED: $TOKEN_NAME refresh failed: $RESPONSE" >> $LOG_FILE
    return 1
  fi

  sed -i "s|${TOKEN_NAME}=.*|${TOKEN_NAME}=$NEW_TOKEN|" $ENV_FILE
  echo "[$(date)] SUCCESS: $TOKEN_NAME refreshed" >> $LOG_FILE
}

# Refresh both tokens
refresh_token "META_ADS_ACCESS_TOKEN"
refresh_token "AJIO_LUXE_META_ACCESS_TOKEN"

# Restart app to pick up new tokens
cd /root/luxe-ai && pm2 restart luxe-ai --update-env > /dev/null 2>&1
echo "[$(date)] App restarted" >> $LOG_FILE
