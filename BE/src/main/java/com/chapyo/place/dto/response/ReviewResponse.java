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
@Schema(description = "리뷰 응답")
public class ReviewResponse {

    @Schema(description = "리뷰 ID", example = "1")
    private Long reviewId;

    @Schema(description = "장소 ID", example = "1")
    private Long placeId;

    @Schema(description = "작성자 ID", example = "1")
    private Long userId;

    @Schema(description = "작성자 닉네임", example = "번개최광")
    private String nickname;

    @Schema(description = "내용", example = "정말 좋았어요!")
    private String content;

    @Schema(description = "별점", example = "5")
    private Integer rating;

    @Schema(description = "작성일", example = "2026-06-08T10:00:00")
    private LocalDateTime createdAt;
}
