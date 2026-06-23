package com.chapyo.trip.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripPlanRoute {
    private Long routeId;
    private Long fromItemId;
    private Long toItemId;
    private String transport;
    private Integer moveTime;
    private Integer cost;
}