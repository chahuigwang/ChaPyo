package com.chapyo.place.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "내 리뷰 응답")
public class MyReviewResponse {

    @Schema(description = "리뷰 ID", example = "1")
    private Long reviewId;

    @Schema(description = "장소 ID", example = "1")
    private Long placeId;

    @Schema(description = "장소명", example = "경복궁")
    private String placeTitle;

    @Schema(description = "장소 이미지 URL", example = "http://img.jpg")
    private String placeImage;

    @Schema(description = "내용", example = "정말 좋았어요!")
    private String content;

    @Schema(description = "별점", example = "5")
    private Integer rating;

    @Schema(description = "작성일", example = "2026-06-08T10:00:00")
    private LocalDateTime createdAt;
}