package com.chapyo.trip.service;

import com.chapyo.trip.entity.TripPlanItem;
import com.chapyo.trip.mapper.TripMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
public class TripAiTools {

    private final VectorStore vectorStore;
    private final TripMapper tripMapper;
    private final Long planId;
    private final Long userId;

    public TripAiTools(VectorStore vectorStore, TripMapper tripMapper, Long planId, Long userId) {
        this.vectorStore = vectorStore;
        this.tripMapper = tripMapper;
        this.planId = planId;
        this.userId = userId;
    }

    @Tool(description = """
            여행지, 맛집, 카페 등 장소를 검색합니다.
            keyword: 검색할 키워드 (예: 해운대 맛집, 제주 카페)
            areaCode: 광역시도 코드 (서울=11, 부산=26, 대구=27, 인천=28, 광주=29, 대전=30, 울산=31, 경기=41, 충북=43, 충남=44, 전남=46, 경북=47, 경남=48, 제주=50, 강원=51, 전북=52, 세종=36110). 지역 언급 없으면 null.
            """)
    public List<Map<String, Object>> searchPlaces(String keyword, Integer areaCode) {
        log.debug("searchPlaces 호출: keyword={}, areaCode={}", keyword, areaCode);

        SearchRequest.Builder builder = SearchRequest.builder()
                .query(keyword)
                .topK(10);

        if (areaCode != null) {
            FilterExpressionBuilder b = new FilterExpressionBuilder();
            builder.filterExpression(b.eq("areaCode", areaCode).build());
        }

        List<Document> docs = vectorStore.similaritySearch(builder.build());

        return docs.stream()
                .map(doc -> Map.<String, Object>of(
                        "placeId", Long.parseLong(doc.getMetadata().get("placeId").toString()),
                        "description", doc.getText()
                ))
                .collect(Collectors.toList());
    }

    @Tool(description = """
            여행 일정에 장소를 추가합니다.
            placeId: 추가할 장소 ID (searchPlaces로 검색한 결과의 placeId)
            dayNumber: 몇 일차인지 (1부터 시작)
            itemOrder: 해당 일차에서 몇 번째 순서인지 (1부터 시작). 기존 일정 사이에 끼워넣으면 뒤 일정이 자동으로 밀림.
            """)
    public String addTripItem(Long placeId, int dayNumber, int itemOrder) {
        log.debug("addTripItem 호출: planId={}, placeId={}, dayNumber={}, itemOrder={}", planId, placeId, dayNumber, itemOrder);

        tripMapper.shiftItemOrders(planId, dayNumber, itemOrder);

        TripPlanItem item = TripPlanItem.builder()
                .planId(planId)
                .placeId(placeId)
                .adderId(userId)
                .dayNumber(dayNumber)
                .itemOrder(itemOrder)
                .cost(0)
                .build();

        tripMapper.insertItem(item);
        return "일정에 추가 완료했습니다. (placeId: " + placeId + ", " + dayNumber + "일차 " + itemOrder + "번째)";
    }
}