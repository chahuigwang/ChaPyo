package com.chapyo.place.service;

import com.chapyo.place.dto.AiSelectionResult;
import com.chapyo.place.dto.QueryAnalysis;
import com.chapyo.place.dto.request.PlaceAiRequest;
import com.chapyo.place.dto.response.PlaceAiResponse;
import com.chapyo.place.dto.response.PlaceResponse;
import com.chapyo.place.repository.AreaMapper;
import com.chapyo.place.repository.DistrictMapper;
import com.chapyo.place.repository.PlaceMapper;
import jakarta.annotation.PostConstruct;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlaceAiService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final PlaceMapper placeMapper;
    private final AreaMapper areaMapper;
    private final DistrictMapper districtMapper;

    private Map<String, Integer> AREA_CODE_MAP;
    private Map<String, Integer> DISTRICT_CODE_MAP;

    @PostConstruct
    public void init() {
        AREA_CODE_MAP = areaMapper.findAll().stream()
                .collect(Collectors.toMap(
                        m -> (String) m.get("name"),
                        m -> ((Number) m.get("area_code")).intValue()
                ));
        DISTRICT_CODE_MAP = districtMapper.findAll().stream()
                .collect(Collectors.toMap(
                        m -> (String) m.get("name"),
                        m -> ((Number) m.get("district_code")).intValue(),
                        (a, b) -> a  // 동명 시군구 충돌 시 첫 번째 값 사용
                ));
        log.debug("지역 코드 맵 초기화 완료: 광역시도 {}개, 시군구 {}개",
                AREA_CODE_MAP.size(), DISTRICT_CODE_MAP.size());
    }

    public PlaceAiResponse recommend(Long userId, PlaceAiRequest request) {
        // 1. HyDE + 지역 추출
        QueryAnalysis analysis = chatClient.prompt()
            .system("""
                다음 세 가지를 JSON으로만 반환하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.
                1. hypotheticalDoc: 사용자가 좋아할 만한 장소 소개글 2~3문장 (장소명 지어내지 말 것)
                2. areaName: 요청에서 광역시도 정식 명칭 추출 (서울특별시, 부산광역시, 제주특별자치도 등. 없으면 null)
                3. districtName: 요청에서 시군구 추출 (강남구, 해운대구 등. 없으면 null)
                """)
            .user("페르소나: %s\n요청: %s".formatted(request.getPersona(), request.getText()))
            .call()
            .entity(QueryAnalysis.class);

        log.debug("QueryAnalysis: {}", analysis);

        // 2. 벡터 검색
        List<Document> docs = vectorStore.similaritySearch(buildSearchRequest(analysis));
        log.debug("벡터 검색 결과: {}건", docs.size());

        if (docs.isEmpty()) {
            return new PlaceAiResponse("조건에 맞는 장소를 찾지 못했습니다.", List.of());
        }

        // 3. LLM 후보 선정
        AiSelectionResult result = chatClient.prompt()
            .system("""
                사용자 페르소나에 맞는 장소를 후보 중에서 최대 5개 선정하고 추천 멘트를 작성하세요.
                JSON으로만 반환하세요. 형식: {"placeIds": [1, 2, 3], "recommendText": "추천 멘트"}
                적합한 장소가 없으면 placeIds를 빈 배열로 반환하세요.
                """)
            .user(buildSelectionPrompt(request.getPersona(), request.getText(), docs))
            .call()
            .entity(AiSelectionResult.class);

        log.debug("선정된 placeIds: {}", result.placeIds());

        if (result.placeIds() == null || result.placeIds().isEmpty()) {
            return new PlaceAiResponse(result.recommendText(), List.of());
        }

        // 4. MySQL 조회
        List<PlaceResponse> places = placeMapper.selectByIds(result.placeIds(), userId);

        // 5. LLM이 정한 순서대로 정렬
        return new PlaceAiResponse(result.recommendText(), sortByIds(places, result.placeIds()));
    }

    private SearchRequest buildSearchRequest(QueryAnalysis analysis) {
        Integer areaCode = analysis.areaName() != null ? AREA_CODE_MAP.get(analysis.areaName()) : null;
        Integer districtCode = analysis.districtName() != null ? DISTRICT_CODE_MAP.get(analysis.districtName()) : null;

        SearchRequest.Builder builder = SearchRequest.builder()
            .query(analysis.hypotheticalDoc())
            .topK(10);

        if (areaCode != null) {
            FilterExpressionBuilder b = new FilterExpressionBuilder();
            var exp = b.eq("areaCode", areaCode);
            if (districtCode != null) {
                exp = b.and(exp, b.eq("districtCode", districtCode));
            }
            builder.filterExpression(exp.build());
        }

        return builder.build();
    }

    private String buildSelectionPrompt(String persona, String text, List<Document> docs) {
        StringBuilder sb = new StringBuilder();
        sb.append("페르소나: ").append(persona).append("\n");
        sb.append("요청: ").append(text).append("\n\n");
        sb.append("후보 장소:\n");
        for (Document doc : docs) {
            Long placeId = ((Number) doc.getMetadata().get("placeId")).longValue();
            sb.append("- placeId: ").append(placeId)
              .append(", 내용: ").append(doc.getText()).append("\n");
        }
        return sb.toString();
    }

    private List<PlaceResponse> sortByIds(List<PlaceResponse> places, List<Long> orderedIds) {
        return orderedIds.stream()
            .map(id -> places.stream()
                .filter(p -> p.getPlaceId().equals(id))
                .findFirst()
                .orElse(null))
            .filter(Objects::nonNull)
            .toList();
    }
}