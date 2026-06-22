# 인터랙티브 스마트 라우팅 가이드 — 설계

- 날짜: 2026-06-22
- 범위: 프론트엔드(Vue 3) 단독. 백엔드 신규 기능 없음. (BE 폴더 미접촉)
- 대상 화면: 여행 상세(`PlanDetail`)의 워크스페이스 — 좌측 날짜별 일정 아코디언 + 우측 전체 지도.

## 1. 목표

일정 카드를 드래그로 재정렬할 때, 지도 위 동선(polyline)이 **실시간으로** 재연결되고,
동선 품질에 따라 **초록(좋음)/빨강(나쁨)** 피드백이 즉시 나타나는 몰입형 인터랙션을 제공한다.
서버 왕복 없이 브라우저의 포인터 이벤트 + 좌표 계산만으로 동작한다.

핵심 개선점: 현재 native HTML5 DnD는 **drop 시점에만** 갱신된다. 이를 포인터 기반
드래그(SortableJS)로 교체해 **드래그 중 카드가 마우스를 따라다니고 경로가 라이브로 갱신**되게 한다.

## 2. 범위 (확정: C안 — 전체 통일)

모든 드래그를 단일 SortableJS 공유 그룹(`group: 'itinerary'`)으로 통일한다.

1. 같은 날 내 순서 변경
2. 다른 날로 이동
3. 검색/좋아요/AI챗 플라이아웃 → 타임라인으로 추가(clone)

native HTML5 DnD 핸들러는 전부 제거한다.

## 3. 아키텍처

### 3.1 의존성
- `vuedraggable@4` (Vue 3용 SortableJS 래퍼) 추가. FE 단독.

### 3.2 데이터 흐름 / SSOT
- `<draggable v-model>`을 **tripStore의 날짜별 배열**(`currentTrip.itemsByDay[date]`)에 직접 바인딩한다.
  드래그 시 store 배열이 실시간 재정렬 → `TripMap`이 이미 `positionedItems` 변화를 감지해
  polyline을 다시 그리므로 경로가 라이브로 갱신된다(별도 미리보기 상태 불필요).
- **BE 영속화는 drop(@end) 시 1회만** 수행한다. 드래그 중에는 서버 호출 없음.
  - 같은 날: `persistDayOrder(date)` (신규 액션) — 현재 순서를 1회 저장.
  - 다른 날 이동: 이동된 아이템의 `visitDate` 갱신 + 저장.
  - 플라이아웃 추가: 삽입된 원본을 정식 `TravelItem`으로 정규화 교체(`addItemToDate` 로직 재사용).

### 3.3 드래그 상태 플래그
- `ui.draggingDayIso` (transient): 현재 드래그 중인 날짜 ISO. 드래그 시작 시 set, 종료 시 clear.
  `TripMap`이 이 값으로 라이브 연출(색/디밍/오버레이) 대상 날을 식별한다.

### 3.4 품질 엔진 (`src/composables/useRouteQuality.js`, 신규)
- `routeDistance(orderedItems)`: 인접 구간 haversine 합. 좌표 없는 항목은 건너뜀.
- `optimalDistance(items)`: nearest-neighbor 근사. 각 시작점에서 NN 경로를 만들고 최소 총거리 선택
  (항목 수 ~15 이하 가정, 비용 저렴).
- `qualityRatio = current / optimal`.
- `status(ratio)`:
  - `ratio <= GOOD_MAX (1.10)` → `good`
  - `ratio >= BAD_MIN (1.40)` → `bad`
  - 그 외 → `neutral`
- 임계값은 모듈 상단 상수(`GOOD_MAX`, `BAD_MIN`)로 분리해 튜닝 가능.
- 좌표 있는 항목이 2개 미만이면 품질 계산 불가 → `neutral`.

### 3.5 컴포넌트 변경
- `DayTimeline.vue`: native DnD 핸들러(onCardDragStart/onCardDragOver/onTimelineDrop/onSlotDragOver 등)
  전부 제거 → `<draggable>` 리스트로. `@start`/`@end`/`@change` 핸들러로 상태/영속화 처리.
- `PlaceCard.vue`: `:draggable="true"` 및 dragstart/dragend emit 제거(SortableJS가 포인터 관리).
- `TripDetailPanel.vue`: 바깥 Day 카드의 native @dragover/@drop 가드/핸들러 제거(SortableJS group이 대체).
- `SearchFlyout.vue` / `StorageFlyout.vue` / `MessageBubble.vue`: 카드 목록을 `<draggable>` 소스로 전환
  (`group: { name: 'itinerary', pull: 'clone', put: false }`).
- `TripMap.vue`: `draggingDayIso` 기반 라이브 연출 추가(아래 4절).

## 4. 인터랙션 / 피드백 연출

- **라이브 카드 이동**: 카드가 포인터를 실시간 추종, 이웃과 즉시 자리바꿈.
- **라이브 경로**: 드래그 중 해당 날 polyline이 새 순서로 즉시 재연결. 핀 번호 실시간 갱신.
- **품질 색상**(드래그 중인 날 경로):
  - `good` → 초록 + 펄스 글로우 확산
  - `bad` → 빨강 + 점선 깜빡임(blink)
  - `neutral` → 원래 Day 색
- **오버레이**:
  - `bad`: 가장 먼 구간 근처에 ⚠️ 팝 애니메이션
  - `good`: 경로 중앙에 ✨ 초록 리플
- **포커스**: 드래그 중 다른 날 경로/핀은 투명도 디밍.
- **시점 고정**: 드래그 중 지도 자동 재맞춤(setBounds) 안 함(기존 `lastFitSig` 가드 활용).
- drop 시: 색/오버레이 정상 복귀, 순서 확정·저장.
- 애니메이션은 CSS + `requestAnimationFrame`(기존 `animateDash` 재활용). 렉 없는 60fps 목표.

## 5. 엣지 케이스

- 좌표 없는 항목: 경로/품질 계산에서 제외하되 번호·카드에는 포함.
- 항목 1개 이하 / 빈 날: 경로·품질 없음(중립), 드롭은 정상 허용.
- 다른 날로 이동 시 `visitDate` 갱신 누락 방지(@end에서 명시 처리).
- 플라이아웃 clone: 삽입된 원본(검색/좋아요/AI 카드 형태)을 정식 `TravelItem`으로 교체하여
  store에 raw 형태가 남지 않게 한다.
- 드래그 중 5초 폴링 sync가 순서를 덮어쓰지 않도록, 드래그 중에는 sync 무시 또는 지연.

## 6. 유지(변경 없음)

- 리뷰 2-스텝 삭제, 상세 모달, 이동거리(TransitItem), 날짜별 색/전역 연속 번호,
  경로 표시/숨김(눈 토글), 지도 대한민국 범위 제한.

## 7. 비범위 (YAGNI)

- 자동 최적화 "한 번에 정렬" 버튼(별도 기능, 이번 범위 아님).
- 자연어 편집 / 3D 플라이스루 / 스크롤 매직(후속 아이디어).
- 멀티유저 동시 드래그 충돌 해소(기존 polling 수준 유지).
