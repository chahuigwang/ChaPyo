package com.chapyo.trip.service;

import com.chapyo.place.repository.AreaMapper;
import com.chapyo.place.repository.DistrictMapper;
import com.chapyo.trip.dto.response.TripPlanItemResponse;
import com.chapyo.trip.mapper.TripMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.memory.InMemoryChatMemoryRepository;
import org.springframework.ai.chat.memory.MessageWindowChatMemory;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
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
    private final AreaMapper areaMapper;
    private final DistrictMapper districtMapper;

    private Map<String, Integer> areaCodeMap;
    private Map<String, Integer> districtCodeMap;
    private final Map<String, ChatMemory> memoryMap = new ConcurrentHashMap<>();

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

    public String chat(Long planId, Long userId, String message) {
        List<TripPlanItemResponse> items = tripMapper.findItemsByPlanId(planId, userId);
        String context = buildPlanContext(items);
        String conversationId = planId + "_" + userId;

        TripAiTools tools = new TripAiTools(vectorStore, tripService, tripMapper, chatClient, areaCodeMap, districtCodeMap, planId, userId);
        ChatMemory chatMemory = getOrCreateMemory(planId, userId);

        return chatClient.prompt()
                .system("""
                        당신은 여행 일정을 도와주는 AI 어시스턴트입니다.
                        사용자의 요청에 따라 장소를 검색하거나 일정을 관리할 수 있습니다.
                        장소를 추천할 때는 searchPlaces로 검색 후 결과를 사용자에게 보여주세요.
                        일정에 추가해달라는 요청이면 searchPlaces로 검색 후 addTripItem으로 추가하세요.
                        이전 대화에서 추천한 장소를 기억하고, 사용자가 그 중 하나를 선택하면 해당 placeId로 추가하세요.
                        
                        현재 여행 일정:
                        """ + context)
                .user(message)
                .tools(tools)
                .advisors(MessageChatMemoryAdvisor.builder(chatMemory).build())
                .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                .call()
                .content();
    }

    private String buildPlanContext(List<TripPlanItemResponse> items) {
        if (items.isEmpty()) {
            return "현재 등록된 일정이 없습니다.";
        }

        return items.stream()
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
                .collect(Collectors.joining("\n"));
    }
}