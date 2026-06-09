package com.chapyo.place.service;

import com.chapyo.place.dto.request.PlaceSearchRequest;
import com.chapyo.place.dto.response.LikeResponse;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.dto.response.PlaceDetailResponse;
import com.chapyo.place.dto.response.PlaceResponse;

public interface PlaceService {
	
	PageResponse<PlaceResponse> searchPlaces(PlaceSearchRequest request);
	PlaceDetailResponse getPlaceDetails(Long placeId);
	LikeResponse toggleLike(Long placeId, Long userId);
}
