package com.chapyo.library.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "라이브러리 이동 정보 응답")
public class LibraryRouteResponse {

    @Schema(description = "출발 아이템 ID", example = "1")
    private Long fromItemId;

    @Schema(description = "도착 아이템 ID", example = "2")
    private Long toItemId;

    @Schema(description = "교통수단", example = "버스")
    private String transport;

    @Schema(description = "소요 시간 (분)", example = "30")
    private Integer moveTime;

    @Schema(description = "이동 비용", example = "1500")
    private Integer cost;
}