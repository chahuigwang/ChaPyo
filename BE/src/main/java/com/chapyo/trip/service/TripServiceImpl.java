package com.chapyo.trip.service;

import com.chapyo.trip.dto.response.TripPlanResponse;
import com.chapyo.trip.entity.TripPlan;
import com.chapyo.trip.mapper.TripMapper;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripMapper tripMapper;

    @Override
    @Transactional
    public TripPlanResponse createPlan(Long userId) {
        LocalDate today = LocalDate.now();

        TripPlan plan = TripPlan.builder()
                .title("새 여행")
                .startDate(today)
                .endDate(today.plusDays(2))
                .build();

        tripMapper.insertPlan(plan);
        tripMapper.insertMember(plan.getPlanId(), userId);

        return TripPlanResponse.builder()
                .planId(plan.getPlanId())
                .title(plan.getTitle())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .build();
    }

    @Override
    public List<TripPlanResponse> getPlans(Long userId) {
        return tripMapper.findPlansByUserId(userId).stream()
                .map(plan -> TripPlanResponse.builder()
                        .planId(plan.getPlanId())
                        .title(plan.getTitle())
                        .startDate(plan.getStartDate())
                        .endDate(plan.getEndDate())
                        .build())
                .toList();
    }
}
