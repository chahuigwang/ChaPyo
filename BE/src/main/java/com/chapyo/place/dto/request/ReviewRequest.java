package com.chapyo.place.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "리뷰 요청")
public class ReviewRequest {

    @Schema(description = "내용", example = "정말 좋았어요!")
    @NotBlank(message = "내용을 입력해주세요.")
    private String content;

    @Schema(description = "별점", example = "5")
    @NotNull(message = "별점을 입력해주세요.")
    @Min(value = 1, message = "별점은 1점 이상이어야 합니다.")
    @Max(value = 5, message = "별점은 5점 이하여야 합니다.")
    private Integer rating;
}
