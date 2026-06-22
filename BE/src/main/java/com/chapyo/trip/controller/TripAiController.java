package com.chapyo.trip.controller;


import com.chapyo.common.response.BaseResponse;
import com.chapyo.trip.dto.request.TripAiChatRequest;
import com.chapyo.trip.dto.response.TripAiChatResponse;
import com.chapyo.trip.service.TripAiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Trip AI")
@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripAiController {

    private final TripAiService tripAiService;

    @Operation(summary = "여행 일정 AI 챗봇")
    @PostMapping("/{planId}/ai/chat")
    public BaseResponse<TripAiChatResponse> chat(
            @PathVariable Long planId,
            @RequestBody @Valid TripAiChatRequest request,
            @AuthenticationPrincipal Long userId) {

        String reply = tripAiService.chat(planId, userId, request.getMessage());
        return BaseResponse.success(new TripAiChatResponse(reply));
    }
}