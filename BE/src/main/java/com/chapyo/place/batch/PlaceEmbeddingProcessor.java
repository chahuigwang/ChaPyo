package com.chapyo.place.batch;

import com.chapyo.place.dto.PlaceEmbeddingData;
import org.jspecify.annotations.NonNull;
import org.springframework.ai.document.Document;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PlaceEmbeddingProcessor implements ItemProcessor<PlaceEmbeddingData, Document> {

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
        if (place.overview() != null) sb.append(" | ").append(place.overview());
        return sb.toString();
    }
}