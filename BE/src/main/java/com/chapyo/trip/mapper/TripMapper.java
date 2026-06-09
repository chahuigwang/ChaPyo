package com.chapyo.trip.mapper;

import com.chapyo.trip.entity.TripPlan;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface TripMapper {
    void insertPlan(TripPlan tripPlan);
    void insertMember(@Param("planId") Long planId, @Param("userId") Long userId);
    List<TripPlan> findPlansByUserId(@Param("userId") Long userId);
    boolean existsMember(@Param("planId") Long planId, @Param("userId") Long userId);
}
