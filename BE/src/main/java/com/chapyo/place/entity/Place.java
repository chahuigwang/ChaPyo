package com.chapyo.place.entity;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class Place {
    private Long placeId;
    private String contentId;
    private String title;
    private String addr1;
    private String addr2;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String firstImage1;
    private String firstImage2;
    private String areaCode;
    private String districtCode;
    private String categoryCode1;
    private String categoryCode2;
    private String zipcode;
    private String tel;
    private String overview;
}
