package com.chapyo.place.controller;

import com.chapyo.common.response.BaseResponse;
import com.chapyo.place.dto.response.MyReviewResponse;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Review", description = "리뷰 관련 API")
@RestController
@RequestMapping("/api/v1/reviews")
@RequiredArgsConstructor
public class UserReviewController {

    private final ReviewService reviewService;

    @Operation(summary = "내 리뷰 목록 조회")
    @GetMapping("/me")
    public ResponseEntity<BaseResponse<PageResponse<MyReviewResponse>>> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal Long userId) {

        PageResponse<MyReviewResponse> response = reviewService.getMyReviews(userId, page, size);
        return ResponseEntity.ok(BaseResponse.success(response));
    }
}