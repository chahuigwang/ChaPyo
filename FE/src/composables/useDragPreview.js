import { useUiStore } from '@/stores/uiStore'

// vuedraggable 의 :move 는 "드래그를 시작한 소스" 컴포넌트에서만 호출된다.
// (onDragMove 가 source 의 this.context 를 사용 → 타겟의 move 핸들러는 안 불림)
// 따라서 드래그 소스(검색·좋아요·AI 플라이아웃, 그리고 다른 날 이동 시 DayTimeline)에
// 이 핸들러를 달고, 떨어질 대상 Day 는 evt.to 의 data-day-iso 로 식별한다.
export function useDragPreview() {
  const ui = useUiStore()

  function onMove(evt) {
    const el = evt?.draggedContext?.element
    const to = evt?.to
    const iso = to?.dataset?.dayIso ?? to?.getAttribute?.('data-day-iso') ?? null
    if (el && iso) {
      ui.setDragPreview({
        id: el.id ?? el.placeId,
        name: el.name ?? el.title,
        dayIso: iso,
        lat: el.lat ?? el.latitude ?? null,
        lng: el.lng ?? el.longitude ?? null,
        address: el.address ?? el.addr1 ?? null,
      })
    } else {
      // 어떤 Day 위에도 없으면(플라이아웃 위로 돌아옴 등) 미리보기 숨김
      ui.clearDragPreview()
    }
    return true
  }

  function onDragPreviewEnd() {
    ui.clearDragPreview()
  }

  return { onMove, onDragPreviewEnd }
}
