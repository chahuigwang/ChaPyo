package com.chapyo.place.controller;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chapyo.common.response.ApiResponse;
import com.chapyo.place.dto.request.PlaceSearchRequest;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.place.dto.response.PlaceResponse;
import com.chapyo.place.service.PlaceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/places")
@RequiredArgsConstructor
public class PlaceController {
	
	private final PlaceService placeService;
	
	@GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PlaceResponse>>> searchPlaces(@ParameterObject @ModelAttribute PlaceSearchRequest request) {
        PageResponse<PlaceResponse> result = placeService.searchPlaces(request);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
