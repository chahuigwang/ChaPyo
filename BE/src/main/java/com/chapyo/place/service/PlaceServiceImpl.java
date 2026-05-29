package com.chapyo.place.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.chapyo.place.dto.request.PlaceSearchRequest;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.dto.response.PlaceDetailResponse;
import com.chapyo.place.dto.response.PlaceResponse;
import com.chapyo.place.repository.PlaceMapper;

import lombok.RequiredArgsConstructor;

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
		return placeMapper.findById(placeId);
	}

}
