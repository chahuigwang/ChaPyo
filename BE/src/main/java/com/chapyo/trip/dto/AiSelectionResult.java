package com.chapyo.trip.dto;

import java.util.List;

public record AiSelectionResult(
    List<Long> placeIds,
    String recommendText
) {}