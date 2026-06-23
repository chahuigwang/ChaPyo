package com.chapyo.trip.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TripPlanItemUpdateRequest {

    @Schema(description = "방문 일차", example = "1")
    @NotNull(message = "방문 일차를 입력해주세요.")
    private Integer dayNumber;

    @Schema(description = "방문 시간", example = "10:00")
    private LocalTime visitTime;

    @Schema(description = "비용", example = "3000")
    private Integer cost;

    @Schema(description = "메모", example = "입장권 미리 예매")
    private String memo;

    @Schema(description = "결제자 ID", example = "1")
    private Long payerId;
}
