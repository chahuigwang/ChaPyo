package com.chapyo.place.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(description = "좋아요 응답")
public class LikeResponse {

    @Schema(description = "좋아요 여부", example = "true")
    private boolean liked;
}
