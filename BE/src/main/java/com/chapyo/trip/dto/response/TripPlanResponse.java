package com.chapyo.trip.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
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
}
