package com.chapyo.place.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlaceSearchRequest {

	private String areaCode;
    private String districtCode;
    private String category1;
    private String category2;

    private int page = 0;
    private int size = 10;

    public int getOffset() {
        return page * size;
    }
}
