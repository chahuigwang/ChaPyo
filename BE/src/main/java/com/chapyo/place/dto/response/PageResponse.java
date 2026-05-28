package com.chapyo.place.dto.response;

import java.util.List;

import lombok.Getter;

@Getter
public class PageResponse<T> {

    private List<T> content;
    private boolean hasNext;

    public PageResponse(List<T> content, int size) {
        this.hasNext = content.size() > size;
        this.content = hasNext ? content.subList(0, size) : content;
    }
}
