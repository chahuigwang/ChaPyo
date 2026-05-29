package com.chapyo.place.dto.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;

@Getter
@Schema(description = "페이징 응답")
public class PageResponse<T> {

    @Schema(description = "조회 결과 목록")
    private List<T> content;

    @Schema(description = "다음 페이지 존재 여부", example = "true")
    private boolean hasNext;

    public PageResponse(List<T> content, int size) {
        this.hasNext = content.size() > size;
        this.content = hasNext ? content.subList(0, size) : content;
    }
}