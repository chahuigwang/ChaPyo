package com.chapyo.place.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
@Schema(description = "AI 관광지 추천 응답")
public class PlaceAiResponse {

    @Schema(description = "추천 멘트")
    private String text;

    @Schema(description = "추천 관광지 목록")
    private List<PlaceResponse> content;
}