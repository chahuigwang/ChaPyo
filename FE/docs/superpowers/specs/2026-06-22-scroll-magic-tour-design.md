# 시간을 달리는 지도 — 둘러보기(스크롤 매직) 설계

- 날짜: 2026-06-22
- 범위: 프론트엔드(Vue 3) 단독. 백엔드 신규 기능 없음. (BE 폴더 미접촉)
- 대상: 여행 상세 워크스페이스 — 좌측 일정 아코디언 스크롤 + 우측 sticky 카카오맵.

## 1. 목표
별도 "둘러보기 모드"에서 좌측 일정을 스크롤하면, 우측 지도가 현재 장소로 panTo + ping 하고
장소 사이 경로가 드로잉 애니메이션으로 누적 그려지는 시네마틱 연출. IntersectionObserver +
requestAnimationFrame 만으로 동작(서버/외부 라이브러리 없음).

## 2. 활성화 (확정: A — 별도 모드)
지도 우상단 토글 버튼(▶ 둘러보기 ↔ ■ 종료). 평소 개요/드래그 경험과 분리.

## 3. 상태 / 아키텍처
- `uiStore`: `tourMode(boolean)`, `tourActiveId(string|null)`.
  액션: `setTourMode(on)`, `setTourActive(id)`.
- 진입 시: 모든 날 펼침 + 리스트 맨 위 스크롤 + 첫 장소 active.
- 종료 시: 원복(드래그/개요 복귀).
- 여정 순서 평탄화 리스트는 기존 `allDayItems`(Day 순 → 그 날 순서, `_dayIdx`/`_dayIso`) 재사용.

## 4. 스크롤 감지 (좌측)
- IntersectionObserver 로 각 PlaceCard 관찰. `rootMargin` 을 화면 중앙 ~10% 밴드로
  설정해 중앙에 걸린 카드 1개를 active 로 → `ui.setTourActive(id)`.
- tour 모드 좌측: active 카드 강조(살짝 확대/선명), 나머지 디밍.
- 드래그 비활성(`vuedraggable :disabled="tourMode"`). Day 헤더의 토글/건수 등 컨트롤 숨김(읽기 전용).

## 5. 지도 연출 (우측, tour 모드)
- 개요 핀/경로 대신 여정 뷰:
  - 다른 날: 옅은 고스트 라인(맥락).
  - 현재 날: 첫 장소→active 까지 누적 트레일(진한 색). active 로 한 칸 넘어갈 때
    새 구간을 rAF 로 점→점 성장 드로잉(~400ms).
  - 핀: 지나온 곳 진하게 / active ping 펄스 / 다가올 곳 흐리게.
- 카메라: active 로 부드럽게 panTo. 날이 바뀌면 그 날 전체로 setBounds 리프레임 후 panTo 추종.
- tour 전용 고정 줌(level 5), 대한민국 범위 제한 유지.

## 6. 토글 / 엣지 / 스코프
- 버튼: 지도 우상단 absolute 오버레이.
- 좌표 없는 장소: 트레일 계산 제외(카드 스크롤엔 포함, 지도 포커스는 직전 좌표 유지).
- 장소 0~1개: tour 버튼 비활성(안내).
- tour 중 폴링 sync 그대로(읽기 전용).
- 기존 드래그/스마트 라우팅 코드는 건드리지 않음(모드로 분리).

## 7. 비범위 (YAGNI)
- 자동 재생(자동 스크롤), 내레이션 텍스트, 공유 캡처.
