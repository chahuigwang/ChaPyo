package com.chapyo.place.service;

import com.chapyo.common.exception.CustomException;
import com.chapyo.place.dto.request.ReviewRequest;
import com.chapyo.place.dto.response.MyReviewResponse;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.dto.response.ReviewResponse;
import com.chapyo.place.entity.Review;
import com.chapyo.place.exception.ReviewErrorCode;
import com.chapyo.place.repository.ReviewMapper;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewMapper reviewMapper;

    @Override
    @Transactional
    public void createReview(Long placeId, ReviewRequest request, Long userId) {
        if (reviewMapper.existsReview(placeId, userId)) {
            throw new CustomException(ReviewErrorCode.ALREADY_REVIEWED);
        }

        Review review = Review.builder()
                .placeId(placeId)
                .userId(userId)
                .content(request.getContent())
                .rating(request.getRating())
                .build();

        reviewMapper.insertReview(review);
    }

    @Override
    public PageResponse<ReviewResponse> getReviews(Long placeId, int page, int size) {
        int limitSize = size + 1;
        int offset = page * size;
        List<ReviewResponse> reviews = reviewMapper.findReviewsByPlaceId(placeId, limitSize, offset);
        return new PageResponse<>(reviews, size);
    }

    @Override
    @Transactional
    public void updateReview(Long placeId, Long reviewId, ReviewRequest request, Long userId) {
        if (!reviewMapper.existsReviewByPlaceId(reviewId, placeId)) {
            throw new CustomException(ReviewErrorCode.REVIEW_NOT_FOUND);
        }

        ReviewResponse review = reviewMapper.findReviewById(reviewId);
        if (!review.getUserId().equals(userId)) {
            throw new CustomException(ReviewErrorCode.FORBIDDEN);
        }

        Review updated = Review.builder()
                .reviewId(reviewId)
                .content(request.getContent())
                .rating(request.getRating())
                .build();

        reviewMapper.updateReview(updated);
    }

    @Override
    @Transactional
    public void deleteReview(Long placeId, Long reviewId, Long userId) {
        if (!reviewMapper.existsReviewByPlaceId(reviewId, placeId)) {
            throw new CustomException(ReviewErrorCode.REVIEW_NOT_FOUND);
        }

        ReviewResponse review = reviewMapper.findReviewById(reviewId);
        if (!review.getUserId().equals(userId)) {
            throw new CustomException(ReviewErrorCode.FORBIDDEN);
        }

        reviewMapper.deleteReview(reviewId);
    }

    @Override
    public PageResponse<MyReviewResponse> getMyReviews(Long userId, int page, int size) {
        int limitSize = size + 1;
        int offset = page * size;
        List<MyReviewResponse> reviews = reviewMapper.findReviewsByUserId(userId, limitSize, offset);
        return new PageResponse<>(reviews, size);
    }
}
