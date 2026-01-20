#!/bin/bash

# Claude Code 通知スクリプト (Linux/devcontainer環境用)
# 引数: $1 = イベントタイプ, $2 = メッセージ, $3 = 詳細（オプション）

# デバッグログ
DEBUG_LOG="$HOME/.claude/hook_debug.log"
mkdir -p "$(dirname "$DEBUG_LOG")"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] notify.sh called with: TYPE=$1 MSG=$2 DETAILS=$3" >> "$DEBUG_LOG"

EVENT_TYPE=${1:-"INFO"}
MESSAGE=${2:-"通知"}
DETAILS=${3:-""}

# 色設定
GREEN='\033[1;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
NC='\033[0m' # No Color

# アイコンと色の設定
case $EVENT_TYPE in
  "COMPLETE")
    ICON="✅"
    COLOR=$GREEN
    ;;
  "STOP")
    ICON="🏁"
    COLOR=$BLUE
    ;;
  "APPROVAL")
    ICON="⏸️"
    COLOR=$YELLOW
    ;;
  *)
    ICON="🔔"
    COLOR=$CYAN
    ;;
esac

# ターミナルベル（3回鳴らす）
echo -en "\a"
sleep 0.1
echo -en "\a"
sleep 0.1
echo -en "\a"

# カラー出力
echo ""
echo -e "${COLOR}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${COLOR}${ICON} [Claude Code] ${MESSAGE}${NC}"
if [ -n "$DETAILS" ]; then
  echo -e "   ${DETAILS}"
fi
echo -e "${COLOR}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ログファイルに記録
LOG_FILE="$HOME/.claude/notifications.log"
mkdir -p "$(dirname "$LOG_FILE")"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] [$EVENT_TYPE] $MESSAGE ${DETAILS:+- $DETAILS}" >> "$LOG_FILE"

# ログファイルのローテーション（1000行を超えたら古い500行を削除）
LINE_COUNT=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
if [ "$LINE_COUNT" -gt 1000 ]; then
  tail -n 500 "$LOG_FILE" > "$LOG_FILE.tmp"
  mv "$LOG_FILE.tmp" "$LOG_FILE"
fi
