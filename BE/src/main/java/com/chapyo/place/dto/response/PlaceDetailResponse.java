package com.chapyo.place.dto.response;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "관광지 상세 정보")
public class PlaceDetailResponse {

    @Schema(description = "관광지 ID", example = "1")
    private Long placeId;

    @Schema(description = "콘텐츠 ID", example = "126508")
    private String contentId;

    @Schema(description = "관광지명", example = "경복궁")
    private String title;

    @Schema(description = "주소", example = "서울특별시 종로구 사직로 161")
    private String addr1;

    @Schema(description = "상세 주소", example = "")
    private String addr2;

    @Schema(description = "위도", example = "37.5796212")
    private BigDecimal latitude;

    @Schema(description = "경도", example = "126.9770162")
    private BigDecimal longitude;

    @Schema(description = "대표 이미지 URL", example = "http://img.jpg")
    private String firstImage1;

    @Schema(description = "보조 이미지 URL", example = "http://img2.jpg")
    private String firstImage2;

    @Schema(description = "시도 코드", example = "1")
    private String areaCode;

    @Schema(description = "구군 코드", example = "1")
    private String districtCode;

    @Schema(description = "대분류 코드", example = "A01")
    private String categoryCode1;

    @Schema(description = "소분류 코드", example = "A0101")
    private String categoryCode2;

    @Schema(description = "우편번호", example = "03045")
    private String zipcode;

    @Schema(description = "전화번호", example = "02-3700-3900")
    private String tel;

    @Schema(description = "개요", example = "경복궁은 조선 왕조의 법궁입니다.")
    private String overview;

    @Schema(description = "좋아요 수", example = "5")
    private Long likeCount;

    @Schema(description = "좋아요 여부", example = "true")
    private boolean liked;

    @Schema(description = "평균 평점", example = "4.5")
    private Double avgRating;
}
