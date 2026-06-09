package com.chapyo.place.service;

import com.chapyo.place.dto.request.LikedPlaceRequest;
import com.chapyo.place.dto.request.PlaceSearchRequest;
import com.chapyo.place.dto.response.LikeResponse;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.dto.response.PlaceDetailResponse;
import com.chapyo.place.dto.response.PlaceResponse;

public interface PlaceService {

	PageResponse<PlaceResponse> searchPlaces(PlaceSearchRequest request, Long userId);
	PlaceDetailResponse getPlaceDetails(Long placeId, Long userId);
	LikeResponse toggleLike(Long placeId, Long userId);
	PageResponse<PlaceResponse> getLikedPlaces(LikedPlaceRequest request, Long userId);
}
