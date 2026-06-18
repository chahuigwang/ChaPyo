package com.chapyo.trip.entity;

import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripPlanItem {
    private Long itemId;
    private Long planId;
    private Long placeId;
    private Long userId;
    private Integer dayNumber;
    private Integer itemOrder;
    private LocalTime visitTime;
    private Integer cost;
    private String memo;
}
