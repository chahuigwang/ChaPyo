package com.chapyo.place.batch;

import com.chapyo.place.dto.PlaceEmbeddingData;
import org.jspecify.annotations.NonNull;
import org.springframework.ai.document.Document;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PlaceEmbeddingProcessor implements ItemProcessor<PlaceEmbeddingData, Document> {

    private static final Map<String, String> CATEGORY_MAP = Map.ofEntries(
        Map.entry("AC", "숙박"),
        Map.entry("FD", "음식"),
        Map.entry("HS", "역사관광"),
        Map.entry("LS", "레저스포츠"),
        Map.entry("NA", "자연관광"),
        Map.entry("SH", "쇼핑"),
        Map.entry("VE", "문화관광"),
        Map.entry("EV", "축제/공연/행사"),
        Map.entry("EX", "체험관광"),
        Map.entry("C01", "추천코스"),
        Map.entry("FD01", "한식"),
        Map.entry("FD02", "외국식"),
        Map.entry("FD03", "간이음식"),
        Map.entry("FD04", "주점"),
        Map.entry("FD05", "카페/찻집"),
        Map.entry("HS01", "역사유적지"),
        Map.entry("HS02", "역사유물"),
        Map.entry("HS03", "종교성지"),
        Map.entry("HS04", "안보관광지"),
        Map.entry("VE01", "랜드마크관광"),
        Map.entry("VE02", "테마공원"),
        Map.entry("VE03", "도시공원"),
        Map.entry("VE04", "도시/지역문화관광"),
        Map.entry("VE05", "복합관광시설"),
        Map.entry("VE06", "공연시설"),
        Map.entry("VE07", "전시시설"),
        Map.entry("NA01", "자연경관(산)"),
        Map.entry("NA02", "자연경관(하천/해양)"),
        Map.entry("NA03", "자연생태"),
        Map.entry("NA04", "자연공원"),
        Map.entry("NA05", "기타자연관광"),
        Map.entry("SH01", "백화점"),
        Map.entry("SH02", "쇼핑몰"),
        Map.entry("SH03", "대형마트"),
        Map.entry("SH05", "전문매장/상가"),
        Map.entry("SH06", "시장"),
        Map.entry("AC01", "호텔"),
        Map.entry("AC02", "콘도미니엄"),
        Map.entry("AC03", "펜션/민박"),
        Map.entry("AC04", "모텔"),
        Map.entry("AC05", "캠핑"),
        Map.entry("LS01", "육상레저스포츠"),
        Map.entry("LS02", "수상레저스포츠"),
        Map.entry("LS03", "항공레저스포츠"),
        Map.entry("LS04", "복합레저스포츠"),
        Map.entry("EX01", "전통체험"),
        Map.entry("EX02", "공예체험"),
        Map.entry("EX03", "농.산.어촌 체험"),
        Map.entry("EX05", "웰니스관광"),
        Map.entry("EX06", "산업관광"),
        Map.entry("EX07", "기타체험")
    );

    @Override
    public Document process(@NonNull PlaceEmbeddingData place) {
        String text = buildEmbeddingText(place);

        return new Document(
            "place_" + place.placeId(),
            text,
            Map.of(
                "placeId", place.placeId(),
                "areaCode", place.areaCode(),
                "districtCode", place.districtCode()
            )
        );
    }

    private String buildEmbeddingText(PlaceEmbeddingData place) {
        StringBuilder sb = new StringBuilder();
        sb.append(place.title());
        if (place.addr1() != null) sb.append(" | ").append(place.addr1());
        if (place.categoryCode1() != null) {
            sb.append(" | ").append(CATEGORY_MAP.getOrDefault(place.categoryCode1(), place.categoryCode1()));
        }
        if (place.categoryCode2() != null) {
            sb.append(" | ").append(CATEGORY_MAP.getOrDefault(place.categoryCode2(), place.categoryCode2()));
        }
        if (place.overview() != null) sb.append(" | ").append(place.overview());
        return sb.toString();
    }
}