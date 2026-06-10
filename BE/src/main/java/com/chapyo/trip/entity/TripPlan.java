package com.chapyo.trip.entity;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripPlan {
    private Long planId;
    private Long ownerId;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;
}
