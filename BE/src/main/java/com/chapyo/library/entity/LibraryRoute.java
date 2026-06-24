package com.chapyo.library.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibraryRoute {
    private Long routeId;
    private Long libraryId;
    private Long fromItemId;
    private Long toItemId;
    private String transport;
    private Integer moveTime;
    private Integer cost;
}