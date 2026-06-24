package com.chapyo.library.entity;

import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LibraryItem {
    private Long itemId;
    private Long libraryId;
    private Long placeId;
    private Integer dayNumber;
    private Integer itemOrder;
    private LocalTime visitTime;
    private Integer cost;
    private String memo;
}