package com.chapyo.place.dto;

public record PlaceEmbeddingData(
        Long placeId,
        String title,
        String addr1,
        Integer areaCode,
        Integer districtCode,
        String categoryCode1,
        String categoryCode2,
        String overview
) {}

