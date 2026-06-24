package com.chapyo.trip.mapper;

import com.chapyo.trip.dto.response.MemberResponse;
import com.chapyo.trip.dto.response.TripPlanItemResponse;
import com.chapyo.trip.dto.response.TripPlanResponse;
import com.chapyo.trip.dto.response.TripRouteResponse;
import com.chapyo.trip.entity.TripPlan;
import com.chapyo.trip.entity.TripPlanItem;
import com.chapyo.trip.entity.TripPlanRoute;
import java.time.LocalDate;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TripMapper {
    void insertPlan(TripPlan tripPlan);
    void insertMember(@Param("planId") Long planId, @Param("userId") Long userId);
    List<TripPlanResponse> findPlansByUserId(Long userId);
    boolean existsMember(@Param("planId") Long planId, @Param("userId") Long userId);
    int countItemsByDayNumber(@Param("planId") Long planId, @Param("dayNumber") Integer dayNumber);
    void deleteItemsExceedingDays(@Param("planId") Long planId, @Param("totalDays") int totalDays);
    void insertItem(TripPlanItem item);
    void insertItems(@Param("items") List<TripPlanItem> items);
    TripPlan findPlanById(Long planId);
    List<MemberResponse> findMembersByPlanId(Long planId);
    List<TripPlanItemResponse> findItemsByPlanId(@Param("planId") Long planId, @Param("userId") Long userId);
    void updatePlan(TripPlan plan);
    void deletePlan(Long planId);
    boolean isOwner(@Param("planId") Long planId, @Param("userId") Long userId);
    TripPlanItem findItemById(Long itemId);
    void updateItem(TripPlanItem item);
    void deleteItem(Long itemId);
    void updateItemOrder(@Param("itemId") Long itemId, @Param("order") Integer order);
    void deleteMember(@Param("planId") Long planId, @Param("userId") Long userId);
    void shiftItemOrders(@Param("planId") Long planId, @Param("dayNumber") Integer dayNumber, @Param("itemOrder") int itemOrder);
    List<TripPlanItem> findItemsByPlanIdSimple(Long planId);
    void upsertRoute(TripPlanRoute route);
    void deleteRoutesByItemIds(@Param("itemIds") List<Long> itemIds);
    List<TripRouteResponse> findRoutesByPlanId(Long planId);
}
