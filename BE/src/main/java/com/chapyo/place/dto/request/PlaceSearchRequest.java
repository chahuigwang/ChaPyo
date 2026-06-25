package com.chapyo.place.dto.request;

import com.chapyo.place.enums.PlaceSortType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Schema(description = "관광지 검색 요청")
public class PlaceSearchRequest {

    @Schema(description = "검색어", example = "경복궁")
    private String keyword;

    @Schema(description = "시도 코드", example = "11")
    private String areaCode;

    @Schema(description = "구군 코드", example = "110")
    private String districtCode;

    @Schema(description = "대분류 코드", example = "HS")
    private String category1;

    @Schema(description = "소분류 코드", example = "HS01")
    private String category2;

    @Schema(description = "정렬 기준", example = "LIKES")
    private PlaceSortType sort = PlaceSortType.LIKES;

    @Schema(description = "페이지 번호 (0부터 시작)", example = "0")
    private int page = 0;

    @Schema(description = "페이지 크기", example = "10")
    private int size = 10;

    public int getOffset() {
        return page * size;
    }

    public int getLimitSize() {
        return size + 1;
    }
}