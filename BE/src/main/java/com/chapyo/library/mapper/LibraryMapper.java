package com.chapyo.library.mapper;

import com.chapyo.library.dto.response.LibraryDetailResponse;
import com.chapyo.library.dto.response.LibraryItemResponse;
import com.chapyo.library.dto.response.LibraryResponse;
import com.chapyo.library.dto.response.LibraryRouteResponse;
import com.chapyo.library.entity.LibraryItem;
import com.chapyo.library.entity.LibraryRoute;
import com.chapyo.library.entity.TravelLibrary;
import com.chapyo.trip.entity.TripPlanItem;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface LibraryMapper {
    void insertLibrary(TravelLibrary library);
    void insertLibraryItems(@Param("items") List<LibraryItem> items);
    void insertLibraryRoutes(@Param("routes") List<LibraryRoute> routes);
    List<LibraryResponse> findLibraries(@Param("userId") Long userId, @Param("keyword") String keyword, @Param("limitSize") int limitSize, @Param("offset") int offset);
    List<LibraryResponse> findMyLibraries(@Param("userId") Long userId, @Param("keyword") String keyword, @Param("limitSize") int limitSize, @Param("offset") int offset);
    LibraryDetailResponse findLibraryById(Long libraryId);
    List<LibraryItemResponse> findItemsByLibraryId(@Param("libraryId") Long libraryId, @Param("userId") Long userId);
    List<LibraryRouteResponse> findRoutesByLibraryId(Long libraryId);
    void deleteLibrary(Long libraryId);
    void incrementImportCount(Long libraryId);
    void incrementViewCount(Long libraryId);
    TravelLibrary findLibraryEntityById(Long libraryId);
}