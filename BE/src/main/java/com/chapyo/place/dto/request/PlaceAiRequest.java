package com.chapyo.place.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "AI 관광지 추천 요청")
public class PlaceAiRequest {

    @NotBlank
    @Schema(description = "사용자 페르소나", example = "20대 INTJ 남성")
    private String persona;

    @NotBlank
    @Schema(description = "요청 텍스트", example = "강남 맛집 추천해줘")
    private String text;
}