package com.chapyo.trip.service;

import com.chapyo.trip.dto.request.TripPlanItemRequest;
import com.chapyo.trip.entity.TripPlanItem;
import com.chapyo.trip.mapper.TripMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TripItemService {

    private final TripMapper tripMapper;

    @Transactional
    public void addItemInternal(Long planId, TripPlanItemRequest request, Long userId) {
        int order;
        if (request.getItemOrder() != null) {
            tripMapper.shiftItemOrders(planId, request.getDayNumber(), request.getItemOrder());
            order = request.getItemOrder();
        } else {
            order = tripMapper.countItemsByDayNumber(planId, request.getDayNumber()) + 1;
        }

        TripPlanItem item = TripPlanItem.builder()
                .planId(planId)
                .placeId(request.getPlaceId())
                .adderId(userId)
                .dayNumber(request.getDayNumber())
                .itemOrder(order)
                .visitTime(request.getVisitTime())
                .cost(request.getCost())
                .memo(request.getMemo())
                .build();

        tripMapper.insertItem(item);
    }
}