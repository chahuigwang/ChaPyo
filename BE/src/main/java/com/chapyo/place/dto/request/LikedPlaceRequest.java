package com.chapyo.place.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "좋아요 목록 조회 요청")
public class LikedPlaceRequest {

    @Schema(description = "페이지 번호 (0부터 시작)", example = "0")
    private int page = 0;

    @Schema(description = "페이지 크기", example = "10")
    private int size = 10;

    public int getOffset() {
        return page * size;
    }

    public int getLimitSize() {
        return size + 1;
    }
}
