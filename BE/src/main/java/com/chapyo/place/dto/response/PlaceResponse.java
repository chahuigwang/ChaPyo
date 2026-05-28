package com.chapyo.place.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "관광지 목록")
public class PlaceResponse {
    
	@Schema(description = "관광지 ID", example = "1")
    private Long placeId;

    @Schema(description = "관광지명", example = "경복궁")
    private String title;

    @Schema(description = "주소", example = "서울특별시 종로구 사직로 161")
    private String addr1;

    @Schema(description = "대표 이미지 URL", example = "http://img.jpg")
    private String firstImage1;

    @Schema(description = "대분류 코드", example = "A01")
    private String categoryCode1;

    @Schema(description = "소분류 코드", example = "A0101")
    private String categoryCode2;
}
