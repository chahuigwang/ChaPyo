package com.chapyo.trip.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

@Getter
public class TripAiChatRequest {
    @NotBlank
    private String message;
}