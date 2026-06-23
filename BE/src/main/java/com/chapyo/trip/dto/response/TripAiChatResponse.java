package com.chapyo.trip.dto.response;

import com.chapyo.place.dto.response.PlaceResponse;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class TripAiChatResponse {
    private String reply;
    private List<PlaceResponse> places;
}