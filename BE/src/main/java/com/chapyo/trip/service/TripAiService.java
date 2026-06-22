package com.chapyo.trip.service;

import com.chapyo.trip.dto.response.TripPlanItemResponse;
import com.chapyo.trip.mapper.TripMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripAiService {

    private final ChatClient chatClient;
    private final TripMapper tripMapper;
    private final VectorStore vectorStore;

    public String chat(Long planId, Long userId, String message) {
        List<TripPlanItemResponse> items = tripMapper.findItemsByPlanId(planId, userId);
        String context = buildPlanContext(items);

        TripAiTools tools = new TripAiTools(vectorStore, tripMapper, planId, userId);

        return chatClient.prompt()
                .system("""
                        당신은 여행 일정을 도와주는 AI 어시스턴트입니다.
                        사용자의 요청에 따라 장소를 검색하거나 일정에 추가할 수 있습니다.
                        장소를 추천할 때는 searchPlaces로 검색 후 결과를 사용자에게 보여주세요.
                        일정에 추가해달라는 요청이면 searchPlaces로 검색 후 addTripItem으로 추가하세요.
                        
                        현재 여행 일정:
                        """ + context)
                .user(message)
                .tools(tools)
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
                            .map(item -> "  %d번째: %s (%s)".formatted(
                                    item.getItemOrder(),
                                    item.getTitle(),
                                    item.getAddr1()))
                            .collect(Collectors.joining("\n"));
                    return "%d일차:\n%s".formatted(entry.getKey(), dayItems);
                })
                .collect(Collectors.joining("\n"));
    }
}