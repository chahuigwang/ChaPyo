package com.chapyo.trip.service;

import com.chapyo.trip.dto.request.TripItemOrderRequest;
import com.chapyo.trip.dto.request.TripPlanItemRequest;
import com.chapyo.trip.dto.request.TripPlanItemUpdateRequest;
import com.chapyo.trip.dto.request.TripPlanUpdateRequest;
import com.chapyo.trip.dto.request.TripRouteRequest;
import com.chapyo.trip.dto.response.TripPlanDetailResponse;
import com.chapyo.trip.dto.response.TripPlanResponse;
import java.util.List;

public interface TripService {

    TripPlanResponse createPlan(Long userId);
    List<TripPlanResponse> getPlans(Long userId);
    void inviteMember(Long planId, String email, Long requesterId);
    void addItem(Long planId, TripPlanItemRequest request, Long userId);
    TripPlanDetailResponse getPlanDetail(Long planId, Long userId);
    void updatePlan(Long planId, TripPlanUpdateRequest request, Long userId);
    void deletePlan(Long planId, Long userId);
    void updateItem(Long planId, Long itemId, TripPlanItemUpdateRequest request, Long userId);
    void deleteItem(Long planId, Long itemId, Long userId);
    void updateItemOrders(Long planId, TripItemOrderRequest request, Long userId);
    void removeMember(Long planId, Long targetUserId, Long requesterId);
    void saveRoute(Long planId, TripRouteRequest request, Long userId);
}
