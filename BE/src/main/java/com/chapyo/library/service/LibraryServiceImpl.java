package com.chapyo.library.service;

import com.chapyo.common.exception.CustomException;
import com.chapyo.library.dto.request.LibraryPostRequest;
import com.chapyo.library.dto.response.LibraryDetailResponse;
import com.chapyo.library.dto.response.LibraryItemResponse;
import com.chapyo.library.dto.response.LibraryResponse;
import com.chapyo.library.dto.response.LibraryRouteResponse;
import com.chapyo.library.entity.LibraryItem;
import com.chapyo.library.entity.LibraryRoute;
import com.chapyo.library.entity.TravelLibrary;
import com.chapyo.library.exception.LibraryErrorCode;
import com.chapyo.library.mapper.LibraryMapper;
import com.chapyo.place.dto.response.PageResponse;
import com.chapyo.trip.dto.response.TripRouteResponse;
import com.chapyo.trip.entity.TripPlan;
import com.chapyo.trip.entity.TripPlanItem;
import com.chapyo.trip.mapper.TripMapper;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LibraryServiceImpl implements LibraryService {

    private final LibraryMapper libraryMapper;
    private final TripMapper tripMapper;

    @Override
    @Transactional
    public void postLibrary(Long userId, LibraryPostRequest request) {
        // 멤버 확인
        if (!tripMapper.existsMember(request.getPlanId(), userId)) {
            throw new CustomException(LibraryErrorCode.FORBIDDEN);
        }

        // 아이템 스냅샷
        List<TripPlanItem> currentItems = tripMapper.findItemsByPlanIdSimple(request.getPlanId());

        // 일수 계산
        int dayCount = currentItems.stream()
                .mapToInt(TripPlanItem::getDayNumber)
                .max()
                .orElse(0);

        // 총 비용 계산
        int cost = currentItems.stream()
                .mapToInt(item -> item.getCost() != null ? item.getCost() : 0)
                .sum();

        // 멤버 수 조회
        int memberCount = tripMapper.findMembersByPlanId(request.getPlanId()).size();

        TravelLibrary library = TravelLibrary.builder()
                .userId(userId)
                .title(request.getTitle())
                .description(request.getDescription())
                .dayCount(dayCount)
                .cost(cost)
                .memberCount(memberCount)
                .build();

        libraryMapper.insertLibrary(library);

        List<LibraryItem> libraryItems = currentItems.stream()
                .map(item -> LibraryItem.builder()
                        .libraryId(library.getLibraryId())
                        .placeId(item.getPlaceId())
                        .dayNumber(item.getDayNumber())
                        .itemOrder(item.getItemOrder())
                        .visitTime(item.getVisitTime())
                        .cost(item.getCost())
                        .memo(item.getMemo())
                        .build())
                .toList();

        if (!libraryItems.isEmpty()) {
            libraryMapper.insertLibraryItems(libraryItems);
        }

        // route 스냅샷
        List<TripRouteResponse> currentRoutes = tripMapper.findRoutesByPlanId(request.getPlanId());

        if (!currentRoutes.isEmpty()) {
            Map<Long, Long> itemIdMap = new HashMap<>();
            for (int i = 0; i < currentItems.size(); i++) {
                itemIdMap.put(currentItems.get(i).getItemId(), libraryItems.get(i).getItemId());
            }

            List<LibraryRoute> libraryRoutes = currentRoutes.stream()
                    .filter(route -> itemIdMap.containsKey(route.getFromItemId())
                            && itemIdMap.containsKey(route.getToItemId()))
                    .map(route -> LibraryRoute.builder()
                            .libraryId(library.getLibraryId())
                            .fromItemId(itemIdMap.get(route.getFromItemId()))
                            .toItemId(itemIdMap.get(route.getToItemId()))
                            .transport(route.getTransport())
                            .moveTime(route.getMoveTime())
                            .cost(route.getCost())
                            .build())
                    .toList();

            if (!libraryRoutes.isEmpty()) {
                libraryMapper.insertLibraryRoutes(libraryRoutes);
            }
        }
    }

    @Override
    public PageResponse<LibraryResponse> getLibraries(Long userId, String keyword, int page, int size) {
        int limitSize = size + 1;
        int offset = page * size;
        List<LibraryResponse> libraries = libraryMapper.findLibraries(userId, keyword, limitSize, offset);
        return new PageResponse<>(libraries, size);
    }

    @Override
    public PageResponse<LibraryResponse> getMyLibraries(Long userId, String keyword, int page, int size) {
        int limitSize = size + 1;
        int offset = page * size;
        List<LibraryResponse> libraries = libraryMapper.findMyLibraries(userId, keyword, limitSize, offset);
        return new PageResponse<>(libraries, size);
    }

    @Override
    @Transactional
    public LibraryDetailResponse getLibraryDetail(Long libraryId, Long userId) {
        libraryMapper.incrementViewCount(libraryId);

        LibraryDetailResponse library = libraryMapper.findLibraryById(libraryId);
        if (library == null) {
            throw new CustomException(LibraryErrorCode.LIBRARY_NOT_FOUND);
        }

        List<LibraryItemResponse> items = libraryMapper.findItemsByLibraryId(libraryId, userId);
        List<LibraryRouteResponse> routes = libraryMapper.findRoutesByLibraryId(libraryId);

        return LibraryDetailResponse.builder()
                .libraryId(library.getLibraryId())
                .title(library.getTitle())
                .description(library.getDescription())
                .userId(library.getUserId())
                .nickname(library.getNickname())
                .viewCount(library.getViewCount())
                .importCount(library.getImportCount())
                .items(items)
                .routes(routes)
                .createdAt(library.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void deleteLibrary(Long libraryId, Long userId) {
        TravelLibrary library = libraryMapper.findLibraryEntityById(libraryId);
        if (library == null) {
            throw new CustomException(LibraryErrorCode.LIBRARY_NOT_FOUND);
        }
        if (!library.getUserId().equals(userId)) {
            throw new CustomException(LibraryErrorCode.FORBIDDEN);
        }
        libraryMapper.deleteLibrary(libraryId);
    }

    @Override
    @Transactional
    public void importLibrary(Long libraryId, Long userId) {
        TravelLibrary library = libraryMapper.findLibraryEntityById(libraryId);
        if (library == null) {
            throw new CustomException(LibraryErrorCode.LIBRARY_NOT_FOUND);
        }

        List<LibraryItemResponse> libraryItems = libraryMapper.findItemsByLibraryId(libraryId, userId);

        // 일수 계산
        int totalDays = libraryItems.stream()
                .mapToInt(LibraryItemResponse::getDayNumber)
                .max()
                .orElse(1);

        LocalDate today = LocalDate.now();

        // 새 여행 계획 생성
        TripPlan plan = TripPlan.builder()
                .ownerId(userId)
                .title(library.getTitle())
                .startDate(today)
                .endDate(today.plusDays(totalDays - 1))
                .build();

        tripMapper.insertPlan(plan);
        tripMapper.insertMember(plan.getPlanId(), userId);

        // 아이템 복사
        List<TripPlanItem> items = libraryItems.stream()
                .map(item -> TripPlanItem.builder()
                        .planId(plan.getPlanId())
                        .placeId(item.getPlaceId())
                        .adderId(userId)
                        .dayNumber(item.getDayNumber())
                        .itemOrder(item.getItemOrder())
                        .visitTime(item.getVisitTime())
                        .cost(item.getCost())
                        .memo(item.getMemo())
                        .build())
                .toList();

        if (!items.isEmpty()) {
            tripMapper.insertItems(items);
        }

        libraryMapper.incrementImportCount(libraryId);
    }
}