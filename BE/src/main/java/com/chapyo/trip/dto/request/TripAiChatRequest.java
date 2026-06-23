package com.chapyo.trip.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TripAiChatRequest {

    @NotBlank
    private String message;

    private String persona;
}