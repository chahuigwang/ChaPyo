package com.chapyo.trip.controller;

import com.chapyo.common.response.BaseResponse;
import com.chapyo.trip.dto.request.InviteMemberRequest;
import com.chapyo.trip.dto.response.TripPlanResponse;
import com.chapyo.trip.service.TripService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Trip", description = "여행 계획 관련 API")
@RestController
@RequestMapping("/api/v1/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @Operation(summary = "여행 계획 생성")
    @PostMapping
    public ResponseEntity<BaseResponse<TripPlanResponse>> createPlan(
            @AuthenticationPrincipal Long userId) {

        TripPlanResponse response = tripService.createPlan(userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.success(response));
    }

    @Operation(summary = "여행 계획 목록 조회")
    @GetMapping
    public ResponseEntity<BaseResponse<List<TripPlanResponse>>> getPlans(
            @AuthenticationPrincipal Long userId) {

        List<TripPlanResponse> response = tripService.getPlans(userId);
        return ResponseEntity.ok(BaseResponse.success(response));
    }

    @Operation(summary = "여행 계획 멤버 초대")
    @PostMapping("/{planId}/members")
    public ResponseEntity<BaseResponse<Void>> inviteMember(
            @PathVariable Long planId,
            @RequestBody @Valid InviteMemberRequest request,
            @AuthenticationPrincipal Long userId) {

        tripService.inviteMember(planId, request.getEmail(), userId);
        return ResponseEntity.ok(BaseResponse.success("멤버 초대 성공"));
    }
}
