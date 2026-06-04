import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chatStore'
import { useTripStore } from '@/stores/tripStore'
import { formatDayLabel } from '@/types/itinerary'

// 사이드바 ↔ 워크스페이스 양방향 동기화 진입점.
// 컴포넌트는 이 composable만 알면 두 store를 직접 import 하지 않아도 된다.
export function useTripPlanner() {
  const chat = useChatStore()
  const trip = useTripStore()
  const { selectedDate, days } = storeToRefs(trip)

  function addSuggestionToTrip(messageId, suggestionIndex, suggestion) {
    if (!selectedDate.value) return
    trip.addItem(suggestion)
    chat.markSuggestionAdded(messageId, suggestionIndex)
  }

  return { selectedDate, addSuggestionToTrip }
}
