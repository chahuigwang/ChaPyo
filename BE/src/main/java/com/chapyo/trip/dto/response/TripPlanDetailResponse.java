package com.chapyo.trip.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDate;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "여행 계획 상세 응답")
public class TripPlanDetailResponse {

    @Schema(description = "계획 ID", example = "1")
    private Long planId;

    @Schema(description = "제목", example = "새 여행")
    private String title;

    @Schema(description = "시작일", example = "2026-06-08")
    private LocalDate startDate;

    @Schema(description = "종료일", example = "2026-06-10")
    private LocalDate endDate;

    @Schema(description = "멤버 목록")
    private List<MemberResponse> members;

    @Schema(description = "일정 목록")
    private List<TripPlanItemResponse> items;
}
