package com.chapyo.trip.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "이동 정보 요청")
public class TripRouteRequest {

    @Schema(description = "출발 아이템 ID", example = "1")
    @NotNull
    private Long fromItemId;

    @Schema(description = "도착 아이템 ID", example = "2")
    @NotNull
    private Long toItemId;

    @Schema(description = "소요 시간 (분)", example = "30")
    private Integer moveTime;

    @Schema(description = "이동 비용", example = "1500")
    private Integer cost;
}