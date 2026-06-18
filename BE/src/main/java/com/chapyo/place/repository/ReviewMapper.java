package com.chapyo.place.repository;

import com.chapyo.place.dto.response.ReviewResponse;
import com.chapyo.place.entity.Review;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ReviewMapper {
    void insertReview(Review review);
    boolean existsReview(@Param("placeId") Long placeId, @Param("userId") Long userId);
    List<ReviewResponse> findReviewsByPlaceId(@Param("placeId") Long placeId, @Param("limitSize") int limitSize, @Param("offset") int offset);
    ReviewResponse findReviewById(Long reviewId);
    boolean existsReviewByPlaceId(@Param("reviewId") Long reviewId, @Param("placeId") Long placeId);
    void updateReview(Review review);
    void deleteReview(Long reviewId);
}
