package com.chapyo.trip.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
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
@Schema(description = "여행 일정 응답")
public class TripPlanItemResponse {

    @Schema(description = "아이템 ID", example = "1")
    private Long itemId;

    @Schema(description = "장소 ID", example = "1")
    private Long placeId;

    @Schema(description = "장소명", example = "경복궁")
    private String title;

    @Schema(description = "주소", example = "서울특별시 종로구 사직로 161")
    private String addr1;

    @Schema(description = "대표 이미지 URL", example = "http://img.jpg")
    private String img;

    @Schema(description = "방문 날짜", example = "2026-06-08")
    private LocalDate visitDate;

    @Schema(description = "순서", example = "1")
    private Integer itemOrder;

    @Schema(description = "방문 시간", example = "10:00")
    private LocalTime visitTime;

    @Schema(description = "비용", example = "3000")
    private Integer cost;

    @Schema(description = "메모", example = "입장권 미리 예매")
    private String memo;

    @Schema(description = "추가한 사용자 ID", example = "1")
    private Long userId;

    @Schema(description = "추가한 사용자 닉네임", example = "chapyo")
    private String nickname;

    @Schema(description = "위도", example = "37.579617")
    private BigDecimal latitude;

    @Schema(description = "경도", example = "126.977041")
    private BigDecimal longitude;

    @Schema(description = "좋아요 여부", example = "true")
    private boolean liked;
}
