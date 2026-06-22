package com.chapyo.place.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.Map;
import java.util.List;

@Mapper
public interface DistrictMapper {
    @Select("SELECT name, district_code FROM districts")
    List<Map<String, Object>> findAll();
}