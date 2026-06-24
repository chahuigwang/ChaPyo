package com.chapyo.library.controller;

import com.chapyo.common.response.BaseResponse;
import com.chapyo.library.dto.request.LibraryPostRequest;
import com.chapyo.library.dto.response.LibraryDetailResponse;
import com.chapyo.library.dto.response.LibraryResponse;
import com.chapyo.library.service.LibraryService;
import com.chapyo.place.dto.response.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Library", description = "여행 라이브러리 관련 API")
@RestController
@RequestMapping("/api/v1/library")
@RequiredArgsConstructor
public class LibraryController {

    private final LibraryService libraryService;

    @Operation(summary = "라이브러리 게시")
    @PostMapping
    public ResponseEntity<BaseResponse<Void>> postLibrary(
            @RequestBody @Valid LibraryPostRequest request,
            @AuthenticationPrincipal Long userId) {

        libraryService.postLibrary(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(BaseResponse.success("라이브러리에 게시되었습니다."));
    }

    @Operation(summary = "라이브러리 목록 조회")
    @GetMapping
    public ResponseEntity<BaseResponse<PageResponse<LibraryResponse>>> getLibraries(
            @Parameter(description = "페이지 번호", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기", example = "10") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "검색어", example = "제주도") @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal Long userId) {

        PageResponse<LibraryResponse> response = libraryService.getLibraries(userId, keyword, page, size);
        return ResponseEntity.ok(BaseResponse.success(response));
    }

    @Operation(summary = "내 라이브러리 목록 조회")
    @GetMapping("/me")
    public ResponseEntity<BaseResponse<PageResponse<LibraryResponse>>> getMyLibraries(
            @Parameter(description = "페이지 번호", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "페이지 크기", example = "10") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "검색어", example = "제주도") @RequestParam(required = false) String keyword,
            @AuthenticationPrincipal Long userId) {

        PageResponse<LibraryResponse> response = libraryService.getMyLibraries(userId, keyword, page, size);
        return ResponseEntity.ok(BaseResponse.success(response));
    }

    @Operation(summary = "라이브러리 삭제")
    @DeleteMapping("/{libraryId}")
    public ResponseEntity<BaseResponse<Void>> deleteLibrary(
            @PathVariable Long libraryId,
            @AuthenticationPrincipal Long userId) {

        libraryService.deleteLibrary(libraryId, userId);
        return ResponseEntity.ok(BaseResponse.success("라이브러리가 삭제되었습니다."));
    }

    @Operation(summary = "라이브러리 불러오기")
    @PostMapping("/{libraryId}/import")
    public ResponseEntity<BaseResponse<Void>> importLibrary(
            @PathVariable Long libraryId,
            @AuthenticationPrincipal Long userId) {

        libraryService.importLibrary(libraryId, userId);
        return ResponseEntity.ok(BaseResponse.success("여행 계획을 불러왔습니다."));
    }
}