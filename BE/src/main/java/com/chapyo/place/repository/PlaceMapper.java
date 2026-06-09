package com.chapyo.place.repository;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.chapyo.place.dto.request.PlaceSearchRequest;
import com.chapyo.place.dto.response.PlaceDetailResponse;
import com.chapyo.place.dto.response.PlaceResponse;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PlaceMapper {

	List<PlaceResponse> findByLocationAndCategory(PlaceSearchRequest request);
	PlaceDetailResponse findById(Long placeId);
	boolean existsLike(@Param("placeId") Long placeId, @Param("userId") Long userId);
	void insertLike(@Param("placeId") Long placeId, @Param("userId") Long userId);
	void deleteLike(@Param("placeId") Long placeId, @Param("userId") Long userId);
}
