package com.chapyo.place.controller;

import com.chapyo.common.response.BaseResponse;
import com.chapyo.place.dto.request.ReviewRequest;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.dto.response.ReviewResponse;
import com.chapyo.place.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Review", description = "리뷰 관련 API")
@RestController
@RequestMapping("/api/v1/places/{placeId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "리뷰 작성")
    @PostMapping
    public ResponseEntity<BaseResponse<Void>> createReview(
            @PathVariable Long placeId,
            @RequestBody @Valid ReviewRequest request,
            @AuthenticationPrincipal Long userId) {

        reviewService.createReview(placeId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.success("리뷰 작성 성공"));
    }

    @Operation(summary = "리뷰 목록 조회")
    @GetMapping
    public ResponseEntity<BaseResponse<PageResponse<ReviewResponse>>> getReviews(
            @PathVariable Long placeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<ReviewResponse> response = reviewService.getReviews(placeId, page, size);
        return ResponseEntity.ok(BaseResponse.success(response));
    }

    @Operation(summary = "리뷰 수정")
    @PutMapping("/{reviewId}")
    public ResponseEntity<BaseResponse<Void>> updateReview(
            @PathVariable Long placeId,
            @PathVariable Long reviewId,
            @RequestBody @Valid ReviewRequest request,
            @AuthenticationPrincipal Long userId) {

        reviewService.updateReview(placeId, reviewId, request, userId);
        return ResponseEntity.ok(BaseResponse.success("리뷰 수정 성공"));
    }

    @Operation(summary = "리뷰 삭제")
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<BaseResponse<Void>> deleteReview(
            @PathVariable Long placeId,
            @PathVariable Long reviewId,
            @AuthenticationPrincipal Long userId) {

        reviewService.deleteReview(placeId, reviewId, userId);
        return ResponseEntity.ok(BaseResponse.success("리뷰 삭제 성공"));
    }
}
