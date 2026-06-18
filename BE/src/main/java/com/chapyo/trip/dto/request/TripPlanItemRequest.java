package com.chapyo.trip.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TripPlanItemRequest {

    @Schema(description = "장소 ID", example = "1")
    @NotNull
    private Long placeId;

    @Schema(description = "방문 일차", example = "1")
    @NotNull
    private Integer dayNumber;

    @Schema(description = "방문 시간", example = "10:00")
    private LocalTime visitTime;

    @Schema(description = "비용", example = "3000")
    private Integer cost;

    @Schema(description = "메모", example = "입장권 미리 예매")
    private String memo;
}
