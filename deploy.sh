#!/bin/bash
set -e

# 현재 active 판별
if docker compose ps app-blue | grep -q "Up"; then
    CURRENT=blue; NEXT=green
    CURRENT_PORT=8080; NEXT_PORT=8081
else
    CURRENT=green; NEXT=blue
    CURRENT_PORT=8081; NEXT_PORT=8080
fi

echo "[1/4] $CURRENT -> $NEXT 전환 시작"

# inactive 쪽 새 이미지로 기동
docker compose pull app-$NEXT
docker compose up -d app-$NEXT

# 헬스체크 (최대 60초)
echo "[2/4] 헬스체크 중..."
for i in $(seq 1 30); do
    STATUS=$(curl -sf http://localhost:$NEXT_PORT/actuator/health \
        | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "UNKNOWN")
    if [ "$STATUS" = "UP" ]; then
        echo "헬스체크 통과 (${i}회차)"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "헬스체크 실패 - 롤백"
        docker compose stop app-$NEXT
        exit 1
    fi
    sleep 2
done

# Nginx upstream 교체
echo "[3/4] Nginx upstream 교체: $CURRENT_PORT -> $NEXT_PORT"
echo "upstream chapyo_backend { server 127.0.0.1:$NEXT_PORT; }" \
    | sudo tee /etc/nginx/conf.d/chapyo-upstream.conf
sudo nginx -s reload

# 구 컨테이너 중지
echo "[4/4] $CURRENT 컨테이너 중지"
docker compose stop app-$CURRENT

echo "배포 완료: $CURRENT -> $NEXT (port $NEXT_PORT)"