package com.chapyo.trip.mapper;

import com.chapyo.trip.dto.response.MemberResponse;
import com.chapyo.trip.dto.response.TripPlanItemResponse;
import com.chapyo.trip.entity.TripPlan;
import com.chapyo.trip.entity.TripPlanItem;
import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TripMapper {
    void insertPlan(TripPlan tripPlan);
    void insertMember(@Param("planId") Long planId, @Param("userId") Long userId);
    List<TripPlan> findPlansByUserId(@Param("userId") Long userId);
    boolean existsMember(@Param("planId") Long planId, @Param("userId") Long userId);
    int countItemsByDate(@Param("planId") Long planId, @Param("visitDate") LocalDate visitDate);
    void insertItem(TripPlanItem item);
    TripPlan findPlanById(Long planId);
    List<MemberResponse> findMembersByPlanId(Long planId);
    List<TripPlanItemResponse> findItemsByPlanId(@Param("planId") Long planId, @Param("userId") Long userId);
    void updatePlan(TripPlan plan);
    void deletePlan(Long planId);
    TripPlanItem findItemById(Long itemId);
    void updateItem(TripPlanItem item);
    void deleteItem(Long itemId);
    void updateItemOrder(@Param("itemId") Long itemId, @Param("order") Integer order);
}
