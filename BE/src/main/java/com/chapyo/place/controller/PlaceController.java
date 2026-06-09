package com.chapyo.place.controller;

import com.chapyo.place.dto.response.LikeResponse;
import com.chapyo.place.dto.response.PlaceDetailResponse;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chapyo.common.response.BaseResponse;
import com.chapyo.place.dto.request.PlaceSearchRequest;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.dto.response.PlaceResponse;
import com.chapyo.place.service.PlaceService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@Tag(name = "Place", description = "관광지 관련 API")
@RestController
@RequestMapping("/api/v1/places")
@RequiredArgsConstructor
public class PlaceController {
	
	private final PlaceService placeService;
	
    @Operation(summary = "관광지 목록 조회", description = "검색어/시도/구군/대분류/소분류로 관광지 목록을 조회합니다.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "조회 성공"),
        @ApiResponse(responseCode = "400", description = "잘못된 요청",
        		content = @Content)
    })
	@GetMapping
    public ResponseEntity<BaseResponse<PageResponse<PlaceResponse>>> searchPlaces(
    		@ParameterObject @ModelAttribute PlaceSearchRequest request) {
        PageResponse<PlaceResponse> result = placeService.searchPlaces(request);
        return ResponseEntity.ok(BaseResponse.success(result));
    }

    @Operation(summary = "장소 상세 조회")
    @GetMapping("/{placeId}")
    public ResponseEntity<BaseResponse<PlaceDetailResponse>> getPlaceDetail(
            @PathVariable Long placeId) {

        PlaceDetailResponse response = placeService.getPlaceDetails(placeId);
        return ResponseEntity.ok(BaseResponse.success(response));
    }

    @Operation(summary = "관광지 좋아요 기능")
    @PostMapping("/{placeId}/likes")
    public ResponseEntity<BaseResponse<LikeResponse>> toggleLike(
            @PathVariable Long placeId,
            @AuthenticationPrincipal Long userId) {

        LikeResponse response = placeService.toggleLike(placeId, userId);
        return ResponseEntity.ok(BaseResponse.success(response));
    }
}
