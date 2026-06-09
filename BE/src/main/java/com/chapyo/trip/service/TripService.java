package com.chapyo.trip.service;

import com.chapyo.trip.dto.response.TripPlanResponse;
import java.util.List;

public interface TripService {
    TripPlanResponse createPlan(Long userId);
    List<TripPlanResponse> getPlans(Long userId);
    void inviteMember(Long planId, String email, Long requesterId);
}
