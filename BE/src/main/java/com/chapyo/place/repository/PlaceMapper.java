package com.chapyo.place.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.chapyo.place.dto.request.PlaceSearchRequest;
import com.chapyo.place.dto.response.PlaceDetailResponse;
import com.chapyo.place.dto.response.PlaceResponse;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PlaceMapper {

	List<PlaceResponse> findByLocationAndCategory(@Param("req") PlaceSearchRequest request, @Param("userId") Long userId);
	PlaceDetailResponse findById(@Param("placeId") Long placeId, @Param("userId") Long userId);
	boolean existsLike(@Param("placeId") Long placeId, @Param("userId") Long userId);
	void insertLike(@Param("placeId") Long placeId, @Param("userId") Long userId);
	void deleteLike(@Param("placeId") Long placeId, @Param("userId") Long userId);
	List<PlaceResponse> findLikedPlaces(@Param("userId") Long userId, @Param("limitSize") int limitSize, @Param("offset") int offset);
	long countLikes(Long placeId);
}
