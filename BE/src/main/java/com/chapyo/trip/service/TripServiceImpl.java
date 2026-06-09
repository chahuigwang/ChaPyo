package com.chapyo.trip.service;

import com.chapyo.common.exception.CustomException;
import com.chapyo.trip.dto.request.TripPlanItemRequest;
import com.chapyo.trip.dto.request.TripPlanUpdateRequest;
import com.chapyo.trip.dto.response.MemberResponse;
import com.chapyo.trip.dto.response.TripPlanDetailResponse;
import com.chapyo.trip.dto.response.TripPlanItemResponse;
import com.chapyo.trip.dto.response.TripPlanResponse;
import com.chapyo.trip.entity.TripPlan;
import com.chapyo.trip.entity.TripPlanItem;
import com.chapyo.trip.exception.TripErrorCode;
import com.chapyo.trip.mapper.TripMapper;
import com.chapyo.user.entity.User;
import com.chapyo.user.repository.UserMapper;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripMapper tripMapper;
    private final UserMapper userMapper;

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

    @Override
    @Transactional
    public void inviteMember(Long planId, String email, Long requesterId) {
        // 요청자가 해당 plan 멤버인지 확인
        if (!tripMapper.existsMember(planId, requesterId)) {
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }

        // 이메일로 사용자 조회
        User invitee = userMapper.findByEmail(email)
                .orElseThrow(() -> new CustomException(TripErrorCode.USER_NOT_FOUND));

        // 이미 멤버인지 확인
        if (tripMapper.existsMember(planId, invitee.getUserId())) {
            throw new CustomException(TripErrorCode.ALREADY_MEMBER);
        }

        tripMapper.insertMember(planId, invitee.getUserId());
    }

    @Override
    @Transactional
    public void addItem(Long planId, TripPlanItemRequest request, Long userId) {
        if (!tripMapper.existsMember(planId, userId)) {
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }

        int order = tripMapper.countItemsByDate(planId, request.getVisitDate()) + 1;

        TripPlanItem item = TripPlanItem.builder()
                .planId(planId)
                .placeId(request.getPlaceId())
                .userId(userId)
                .visitDate(request.getVisitDate())
                .itemOrder(order)
                .visitTime(request.getVisitTime())
                .cost(request.getCost())
                .memo(request.getMemo())
                .build();

        tripMapper.insertItem(item);
    }

    @Override
    public TripPlanDetailResponse getPlanDetail(Long planId, Long userId) {
        if (!tripMapper.existsMember(planId, userId)) {
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }

        TripPlan plan = tripMapper.findPlanById(planId);
        if (plan == null) {
            throw new CustomException(TripErrorCode.TRIP_NOT_FOUND);
        }

        List<MemberResponse> members = tripMapper.findMembersByPlanId(planId);
        List<TripPlanItemResponse> items = tripMapper.findItemsByPlanId(planId);

        return TripPlanDetailResponse.builder()
                .planId(plan.getPlanId())
                .title(plan.getTitle())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .members(members)
                .items(items)
                .build();
    }

    @Override
    @Transactional
    public void updatePlan(Long planId, TripPlanUpdateRequest request, Long userId) {
        if (!tripMapper.existsMember(planId, userId)) {
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }

        TripPlan plan = TripPlan.builder()
                .planId(planId)
                .title(request.getTitle())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        tripMapper.updatePlan(plan);
    }
}
