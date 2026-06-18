package com.chapyo.place.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {
    private Long reviewId;
    private Long placeId;
    private Long userId;
    private String content;
    private Integer rating;
}
