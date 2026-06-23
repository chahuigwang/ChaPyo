package com.chapyo.trip.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripPlanUpdateRequest {

    @Schema(description = "제목", example = "새 여행")
    private String title;

    @Schema(description = "시작일", example = "2026-06-08")
    private LocalDate startDate;

    @Schema(description = "종료일", example = "2026-06-10")
    private LocalDate endDate;
}
