package com.chapyo.library.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelLibrary {
    private Long libraryId;
    private Long userId;
    private String title;
    private String description;
    private int viewCount;
    private int importCount;
}