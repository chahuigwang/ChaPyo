package com.chapyo.place.service;

import com.chapyo.place.dto.request.ReviewRequest;
import com.chapyo.place.dto.response.MyReviewResponse;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.dto.response.ReviewResponse;

public interface ReviewService {
    void createReview(Long placeId, ReviewRequest request, Long userId);
    PageResponse<ReviewResponse> getReviews(Long placeId, int page, int size);
    void updateReview(Long placeId, Long reviewId, ReviewRequest request, Long userId);
    void deleteReview(Long placeId, Long reviewId, Long userId);
    PageResponse<MyReviewResponse> getMyReviews(Long userId, int page, int size);
}
