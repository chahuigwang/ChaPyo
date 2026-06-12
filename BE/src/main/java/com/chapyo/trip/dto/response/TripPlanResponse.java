package com.chapyo.trip.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "여행 계획 응답")
public class TripPlanResponse {

    @Schema(description = "여행 계획 ID", example = "1")
    private Long planId;

    @Schema(description = "여행 계획 제목", example = "새 여행")
    private String title;

    @Schema(description = "시작일", example = "2026-06-08")
    private LocalDate startDate;

    @Schema(description = "종료일", example = "2026-06-10")
    private LocalDate endDate;

    @Schema(description = "일정 수", example = "3")
    private int itemCount;

    @Schema(description = "총 비용", example = "10000")
    private int totalCost;

    @Schema(description = "내가 만든 계획 여부")
    private boolean isOwner;
}
