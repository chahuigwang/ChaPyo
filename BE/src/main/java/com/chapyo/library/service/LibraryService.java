package com.chapyo.library.service;

import com.chapyo.library.dto.request.LibraryPostRequest;
import com.chapyo.library.dto.response.LibraryDetailResponse;
import com.chapyo.library.dto.response.LibraryResponse;
import com.chapyo.place.dto.response.PageResponse;

public interface LibraryService {
    void postLibrary(Long userId, LibraryPostRequest request);
    PageResponse<LibraryResponse> getLibraries(Long userId, String keyword, int page, int size);
    PageResponse<LibraryResponse> getMyLibraries(Long userId, String keyword, int page, int size);
    LibraryDetailResponse getLibraryDetail(Long libraryId, Long userId);
    void deleteLibrary(Long libraryId, Long userId);
    void importLibrary(Long libraryId, Long userId);
}