package com.chapyo.place.repository;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.List;

@Mapper
public interface AreaMapper {
    @Select("SELECT name, area_code FROM areas")
    List<Map<String, Object>> findAll();
}