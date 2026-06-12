package com.chapyo.trip.service;

import com.chapyo.common.exception.CustomException;
import com.chapyo.trip.dto.request.TripItemOrderRequest;
import com.chapyo.trip.dto.request.TripPlanItemRequest;
import com.chapyo.trip.dto.request.TripPlanItemUpdateRequest;
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
                .ownerId(userId)
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
                .isOwner(true)
                .build();
    }

    @Override
    public List<TripPlanResponse> getPlans(Long userId) {
        return tripMapper.findPlansByUserId(userId);
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
        List<TripPlanItemResponse> items = tripMapper.findItemsByPlanId(planId, userId);

        return TripPlanDetailResponse.builder()
                .planId(plan.getPlanId())
                .title(plan.getTitle())
                .startDate(plan.getStartDate())
                .endDate(plan.getEndDate())
                .isOwner(plan.getOwnerId().equals(userId))
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

    @Override
    @Transactional
    public void deletePlan(Long planId, Long userId) {
        if (!tripMapper.isOwner(planId, userId)) {  // existsMember → isOwner
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }
        tripMapper.deletePlan(planId);
    }

    @Override
    @Transactional
    public void updateItem(Long planId, Long itemId, TripPlanItemUpdateRequest request, Long userId) {
        if (!tripMapper.existsMember(planId, userId)) {
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }

        TripPlanItem item = tripMapper.findItemById(itemId);
        if (item == null) {
            throw new CustomException(TripErrorCode.ITEM_NOT_FOUND);
        }

        TripPlanItem updated = TripPlanItem.builder()
                .itemId(itemId)
                .visitDate(request.getVisitDate())
                .visitTime(request.getVisitTime())
                .cost(request.getCost())
                .memo(request.getMemo())
                .build();

        tripMapper.updateItem(updated);
    }

    @Override
    @Transactional
    public void deleteItem(Long planId, Long itemId, Long userId) {
        if (!tripMapper.existsMember(planId, userId)) {
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }

        TripPlanItem item = tripMapper.findItemById(itemId);
        if (item == null) {
            throw new CustomException(TripErrorCode.ITEM_NOT_FOUND);
        }

        tripMapper.deleteItem(itemId);
    }

    @Override
    @Transactional
    public void updateItemOrders(Long planId, TripItemOrderRequest request, Long userId) {
        if (!tripMapper.existsMember(planId, userId)) {
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }

        for (TripItemOrderRequest.ItemOrder itemOrder : request.getItemOrders()) {
            tripMapper.updateItemOrder(itemOrder.getItemId(), itemOrder.getOrder());
        }
    }

    @Override
    @Transactional
    public void removeMember(Long planId, Long targetUserId, Long requesterId) {
        TripPlan plan = tripMapper.findPlanById(planId);
        if (plan == null) {
            throw new CustomException(TripErrorCode.TRIP_NOT_FOUND);
        }

        // 요청자가 멤버인지 확인
        if (!tripMapper.existsMember(planId, requesterId)) {
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }

        // 생성자는 나가기 불가
        if (tripMapper.isOwner(planId, targetUserId)) {
            throw new CustomException(TripErrorCode.OWNER_CANNOT_LEAVE);
        }

        // 본인 스스로 나가는 경우
        if (requesterId.equals(targetUserId)) {
            tripMapper.deleteMember(planId, requesterId);
            return;
        }

        // 생성자만 내보내기 가능
        if (!tripMapper.isOwner(planId, requesterId)) {
            throw new CustomException(TripErrorCode.FORBIDDEN);
        }

        if (!tripMapper.existsMember(planId, targetUserId)) {
            throw new CustomException(TripErrorCode.USER_NOT_FOUND);
        }

        tripMapper.deleteMember(planId, targetUserId);
    }
}
