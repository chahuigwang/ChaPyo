package com.chapyo.trip.service;

import com.chapyo.place.repository.PlaceMapper;
import com.chapyo.place.repository.AreaMapper;
import com.chapyo.place.repository.DistrictMapper;
import com.chapyo.trip.dto.request.TripAiChatRequest;
import com.chapyo.trip.dto.response.TripAiChatResponse;
import com.chapyo.trip.dto.response.TripPlanItemResponse;
import com.chapyo.trip.entity.TripPlan;
import com.chapyo.trip.mapper.TripMapper;
import jakarta.annotation.PostConstruct;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripAiService {

    private final ChatClient chatClient;
    private final TripMapper tripMapper;
    private final VectorStore vectorStore;
    private final TripService tripService;
    private final PlaceMapper placeMapper;
    private final AreaMapper areaMapper;
    private final DistrictMapper districtMapper;

    private Map<String, Integer> areaCodeMap;
    private Map<String, Integer> districtCodeMap;
    private final Map<String, ChatMemory> memoryMap = new ConcurrentHashMap<>();
    private final Map<String, String> personaMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        areaCodeMap = areaMapper.findAll().stream()
                .collect(Collectors.toMap(
                        m -> (String) m.get("name"),
                        m -> Integer.parseInt(m.get("area_code").toString())
                ));
        districtCodeMap = districtMapper.findAll().stream()
                .collect(Collectors.toMap(
                        m -> (String) m.get("name"),
                        m -> Integer.parseInt(m.get("district_code").toString()),
                        (a, b) -> a
                ));
        log.debug("지역 코드 맵 초기화 완료: 광역시도 {}개, 시군구 {}개",
                areaCodeMap.size(), districtCodeMap.size());
    }

    private ChatMemory getOrCreateMemory(Long planId, Long userId) {
        String key = planId + "_" + userId;
        return memoryMap.computeIfAbsent(key, k ->
                MessageWindowChatMemory.builder()
                        .chatMemoryRepository(new InMemoryChatMemoryRepository())
                        .maxMessages(20)
                        .build()
        );
    }

    public TripAiChatResponse chat(Long planId, Long userId, String message, String persona) {
        String conversationId = planId + "_" + userId;

        if (persona != null && !persona.isBlank()) {
            personaMap.put(conversationId, persona);
        }

        String savedPersona = personaMap.get(conversationId);
        String personaContext = savedPersona != null && !savedPersona.isBlank()
                ? "사용자 페르소나: " + savedPersona + "\n"
                : "";

        TripPlan plan = tripMapper.findPlanById(planId);
        List<TripPlanItemResponse> items = tripMapper.findItemsByPlanId(planId, userId);
        String context = buildPlanContext(plan, items);

        TripAiTools tools = new TripAiTools(vectorStore, tripService, tripMapper, placeMapper,
                chatClient, areaCodeMap, districtCodeMap, planId, userId);
        ChatMemory chatMemory = getOrCreateMemory(planId, userId);

        try {
            String reply = chatClient.prompt()
                    .system("""
                        당신은 여행 일정을 도와주는 AI 어시스턴트입니다.
                        """ + personaContext + """
                        사용자의 요청에 따라 장소를 검색하거나 일정을 관리할 수 있습니다.
                        장소를 추천할 때는 searchPlaces로 검색 후 결과를 사용자에게 보여주세요.
                        일정에 추가해달라는 요청이면 searchPlaces로 검색 후 addTripItem으로 추가하세요.
                        이전 대화에서 추천한 장소를 기억하고, 사용자가 그 중 하나를 선택하면 해당 placeId로 추가하세요.
                        전체 일정 생성 요청 시 여행 기간에 맞게 각 일차별로 searchPlaces와 addTripItem을 반복 호출해 일정을 채워주세요.
                        여행 일정 관리와 장소 검색 외의 요청은 정중하게 거절하고, 할 수 있는 기능을 안내해주세요.
                        응답할 때 마크다운 문법(**bold**, ### 헤더 등)을 절대 사용하지 마세요. 일반 텍스트로만 응답하세요.
                        장소를 사용자에게 보여줄 때 placeId, itemId 등 내부 ID는 표시하지 마세요. 장소명과 주소만 보여주세요.
                        
                        현재 여행 일정:
                        """ + context)
                    .user(message)
                    .tools(tools)
                    .advisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call()
                    .content();

            return new TripAiChatResponse(reply, tools.getLastSearchedPlaces());

        } catch (Exception e) {
            log.error("AI 챗봇 오류: {}", e.getMessage());
            return new TripAiChatResponse("죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.", List.of());
        }
    }

    private String buildPlanContext(TripPlan plan, List<TripPlanItemResponse> items) {
        long totalDays = ChronoUnit.DAYS.between(plan.getStartDate(), plan.getEndDate()) + 1;

        StringBuilder sb = new StringBuilder();
        sb.append("여행 기간: %s ~ %s (%d일)\n\n".formatted(
                plan.getStartDate(), plan.getEndDate(), totalDays));

        if (items.isEmpty()) {
            sb.append("현재 등록된 일정이 없습니다.");
            return sb.toString();
        }

        sb.append(items.stream()
                .collect(Collectors.groupingBy(TripPlanItemResponse::getDayNumber))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    String dayItems = entry.getValue().stream()
                            .sorted(Comparator.comparing(TripPlanItemResponse::getItemOrder))
                            .map(item -> "  %d번째: [itemId:%d] %s (%s)".formatted(
                                    item.getItemOrder(),
                                    item.getItemId(),
                                    item.getTitle(),
                                    item.getAddr1()))
                            .collect(Collectors.joining("\n"));
                    return "%d일차:\n%s".formatted(entry.getKey(), dayItems);
                })
                .collect(Collectors.joining("\n")));

        return sb.toString();
    }
}