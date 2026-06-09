package com.chapyo.place.service;

import com.chapyo.common.exception.CustomException;
import com.chapyo.place.dto.response.LikeResponse;
import com.chapyo.place.exception.PlaceErrorCode;
import java.util.List;

import org.springframework.stereotype.Service;

import com.chapyo.place.dto.request.PlaceSearchRequest;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.dto.response.PlaceDetailResponse;
import com.chapyo.place.dto.response.PlaceResponse;
import com.chapyo.place.repository.PlaceMapper;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlaceServiceImpl implements PlaceService {

	private final PlaceMapper placeMapper;
	
	@Override
    public PageResponse<PlaceResponse> searchPlaces(PlaceSearchRequest request) {
        List<PlaceResponse> places = placeMapper.findByLocationAndCategory(request);
        return new PageResponse<>(places, request.getSize());
    }

	@Override
	public PlaceDetailResponse getPlaceDetails(Long placeId) {
		PlaceDetailResponse place = placeMapper.findById(placeId);
		if (place == null) {
			throw new CustomException(PlaceErrorCode.PLACE_NOT_FOUND);
		}
		return place;
	}

	@Override
	@Transactional
	public LikeResponse toggleLike(Long placeId, Long userId) {
		if (placeMapper.existsLike(placeId, userId)) {
			placeMapper.deleteLike(placeId, userId);
			return LikeResponse.builder().liked(false).build();
		}

		placeMapper.insertLike(placeId, userId);
		return LikeResponse.builder().liked(true).build();
	}

}
