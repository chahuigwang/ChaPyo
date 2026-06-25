package com.chapyo.trip.service;

import com.chapyo.trip.dto.AiSelectionResult;
import com.chapyo.place.dto.response.PlaceResponse;
import com.chapyo.place.repository.PlaceMapper;
import com.chapyo.trip.dto.request.TripItemOrderRequest;
import com.chapyo.trip.dto.request.TripItemOrderRequest.ItemOrder;
import com.chapyo.trip.dto.request.TripPlanItemRequest;
import com.chapyo.trip.dto.request.TripPlanItemUpdateRequest;
import com.chapyo.trip.dto.request.TripPlanUpdateRequest;
import com.chapyo.trip.mapper.TripMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
public class TripAiTools {

    private final VectorStore vectorStore;
    private final TripService tripService;
    private final TripMapper tripMapper;
    private final PlaceMapper placeMapper;
    private final ChatClient chatClient;
    private final Map<String, Integer> areaCodeMap;
    private final Map<String, Integer> districtCodeMap;
    private final Long planId;
    private final Long userId;

    private List<Long> lastSearchedPlaceIds = new ArrayList<>();
    private List<PlaceResponse> lastSearchedPlaces = new ArrayList<>();

    public TripAiTools(VectorStore vectorStore, TripService tripService, TripMapper tripMapper,
            PlaceMapper placeMapper, ChatClient chatClient,
            Map<String, Integer> areaCodeMap, Map<String, Integer> districtCodeMap,
            Long planId, Long userId) {
        this.vectorStore = vectorStore;
        this.tripService = tripService;
        this.tripMapper = tripMapper;
        this.placeMapper = placeMapper;
        this.chatClient = chatClient;
        this.areaCodeMap = areaCodeMap;
        this.districtCodeMap = districtCodeMap;
        this.planId = planId;
        this.userId = userId;
    }

    public List<PlaceResponse> getLastSearchedPlaces() {
        return lastSearchedPlaces;
    }

    @Tool(description = """
            여행지, 맛집, 카페 등 장소를 검색합니다.
            keyword: 검색할 내용 (예: 부산 해운대 맛집, 제주 카페, 경복궁 근처 한식)
            areaName: 도/광역시 단위 지역 정식 명칭 (서울특별시, 부산광역시, 제주특별자치도 등). 언급 없으면 null.
            districtName: 시/군/구 단위 지역 정식 명칭 (강남구, 마포구, 해운대구, 제주시 등). 언급 없으면 null.
            """)
    public List<Map<String, Object>> searchPlaces(String keyword, String areaName, String districtName) {
        Integer areaCode = areaName != null ? areaCodeMap.get(areaName) : null;
        Integer districtCode = districtName != null ? districtCodeMap.get(districtName) : null;

        log.debug("searchPlaces 호출: keyword={}, areaCode={}, districtCode={}", keyword, areaCode, districtCode);

        // HyDE
        String hypotheticalDoc = chatClient.prompt()
                .system("사용자 요청에 맞는 장소 소개글을 2~3문장으로 작성하세요. 장소명은 지어내지 마세요.")
                .user(keyword)
                .call()
                .content();

        log.debug("HyDE hypotheticalDoc: {}", hypotheticalDoc);

        SearchRequest.Builder builder = SearchRequest.builder()
                .query(hypotheticalDoc)
                .topK(10);

        if (areaCode != null) {
            FilterExpressionBuilder b = new FilterExpressionBuilder();
            var exp = b.eq("areaCode", areaCode);
            if (districtCode != null) {
                exp = b.and(exp, b.eq("districtCode", districtCode));
            }
            builder.filterExpression(exp.build());
        }

        List<Document> docs = vectorStore.similaritySearch(builder.build());
        log.debug("벡터 검색 결과: {}건", docs.size());

        if (docs.isEmpty()) {
            lastSearchedPlaceIds = List.of();
            lastSearchedPlaces = List.of();
            return List.of();
        }

        // LLM 후보 선정
        AiSelectionResult result = chatClient.prompt()
                .system("""
                        사용자 요청에 맞는 장소를 후보 중에서 최대 5개 선정하세요.
                        JSON으로만 반환하세요. 형식: {"placeIds": [1, 2, 3], "recommendText": "추천 멘트"}
                        적합한 장소가 없으면 placeIds를 빈 배열로 반환하세요.
                        """)
                .user(buildSelectionPrompt(keyword, docs))
                .call()
                .entity(AiSelectionResult.class);

        if (result == null || result.placeIds() == null || result.placeIds().isEmpty()) {
            lastSearchedPlaceIds = List.of();
            lastSearchedPlaces = List.of();
            return List.of();
        }

        // MySQL 조회
        lastSearchedPlaces = placeMapper.selectByIds(result.placeIds(), userId);
        lastSearchedPlaceIds = result.placeIds();

        log.debug("선정된 placeIds: {}", lastSearchedPlaceIds);

        return lastSearchedPlaces.stream()
                .map(p -> Map.<String, Object>of(
                        "placeId", p.getPlaceId(),
                        "title", p.getTitle(),
                        "addr1", p.getAddr1() != null ? p.getAddr1() : ""
                ))
                .collect(Collectors.toList());
    }

    private String buildSelectionPrompt(String keyword, List<Document> docs) {
        StringBuilder sb = new StringBuilder();
        sb.append("요청: ").append(keyword).append("\n\n");
        sb.append("후보 장소:\n");
        for (Document doc : docs) {
            Long placeId = Long.parseLong(doc.getMetadata().get("placeId").toString());
            sb.append("- placeId: ").append(placeId)
                    .append(", 내용: ").append(doc.getText()).append("\n");
        }
        return sb.toString();
    }

    @Tool(description = """
            여행 일정에 장소를 추가합니다.
            placeId: searchPlaces로 검색한 장소 ID
            dayNumber: 몇 일차인지 (1부터 시작)
            itemOrder: 해당 일차에서 몇 번째 순서인지 (1부터 시작). 기존 일정 사이에 끼워넣으면 뒤 일정이 자동으로 밀림.
            """)
    public String addTripItem(Long placeId, int dayNumber, int itemOrder) {
        log.debug("addTripItem 호출: planId={}, placeId={}, dayNumber={}, itemOrder={}", planId, placeId, dayNumber, itemOrder);

        TripPlanItemRequest request = TripPlanItemRequest.builder()
                .placeId(placeId)
                .dayNumber(dayNumber)
                .itemOrder(itemOrder)
                .cost(0)
                .build();

        tripService.addItem(planId, request, userId);
        return "%d일차 %d번째에 장소(placeId: %d)를 추가했습니다.".formatted(dayNumber, itemOrder, placeId);
    }

    @Tool(description = """
            여행 일정을 수정합니다. 같은 일차 내에서 메모, 비용 등을 수정할 때 사용합니다.
            itemId: 수정할 일정 ID (현재 일정 목록에서 확인 가능)
            dayNumber: 변경할 일차
            cost: 비용 (변경 없으면 null)
            memo: 메모 (변경 없으면 null)
            """)
    public String updateTripItem(Long itemId, Integer dayNumber, Integer cost, String memo) {
        log.debug("updateTripItem 호출: itemId={}", itemId);

        TripPlanItemUpdateRequest request = TripPlanItemUpdateRequest.builder()
                .dayNumber(dayNumber)
                .cost(cost)
                .memo(memo)
                .build();

        tripService.updateItem(planId, itemId, request, userId);
        return "일정(itemId: %d)을 수정했습니다.".formatted(itemId);
    }

    @Tool(description = """
            여행 일정을 다른 일차로 이동합니다.
            itemId: 이동할 일정 ID (현재 일정 목록에서 확인 가능)
            targetDayNumber: 이동할 일차 (1부터 시작)
            targetItemOrder: 이동할 일차에서의 순서 (1부터 시작)
            """)
    public String moveItem(Long itemId, int targetDayNumber, int targetItemOrder) {
        log.debug("moveItem 호출: itemId={}, targetDayNumber={}, targetItemOrder={}", itemId, targetDayNumber, targetItemOrder);

        tripMapper.shiftItemOrders(planId, targetDayNumber, targetItemOrder);

        TripPlanItemUpdateRequest request = TripPlanItemUpdateRequest.builder()
                .dayNumber(targetDayNumber)
                .build();
        tripService.updateItem(planId, itemId, request, userId);

        tripMapper.updateItemOrder(itemId, targetItemOrder);
        return "%d일차 %d번째로 일정(itemId: %d)을 이동했습니다.".formatted(targetDayNumber, targetItemOrder, itemId);
    }

    @Tool(description = """
            여행 일정을 삭제합니다.
            itemId: 삭제할 일정 ID (현재 일정 목록에서 확인 가능)
            """)
    public String deleteTripItem(Long itemId) {
        log.debug("deleteTripItem 호출: itemId={}", itemId);

        tripService.deleteItem(planId, itemId, userId);
        return "일정(itemId: %d)을 삭제했습니다.".formatted(itemId);
    }

    @Tool(description = """
            여행 일정 순서를 변경합니다. 같은 일차 내에서 순서를 바꿀 때 사용합니다.
            itemOrders: 변경할 일정 순서 목록.
            예: 1일차 1번째와 2번째를 바꾸려면 두 itemId의 order를 서로 교환해서 전달.
            """)
    public String updateItemOrders(List<ItemOrder> itemOrders) {
        log.debug("updateItemOrders 호출: itemOrders={}", itemOrders);

        TripItemOrderRequest request = TripItemOrderRequest.builder()
                .itemOrders(itemOrders)
                .build();

        tripService.updateItemOrders(planId, request, userId);
        return "일정 순서를 변경했습니다.";
    }

    @Tool(description = """
            여행 계획 제목, 날짜를 수정합니다.
            title: 변경할 제목 (변경 없으면 null)
            startDate: 변경할 시작일 yyyy-MM-dd 형식 (변경 없으면 null)
            endDate: 변경할 종료일 yyyy-MM-dd 형식 (변경 없으면 null)
            """)
    public String updateTripPlan(String title, String startDate, String endDate) {
        log.debug("updateTripPlan 호출: title={}, startDate={}, endDate={}", title, startDate, endDate);

        TripPlanUpdateRequest request = TripPlanUpdateRequest.builder()
                .title(title)
                .startDate(startDate != null ? LocalDate.parse(startDate) : null)
                .endDate(endDate != null ? LocalDate.parse(endDate) : null)
                .build();

        tripService.updatePlan(planId, request, userId);
        return "여행 계획을 수정했습니다.";
    }
}