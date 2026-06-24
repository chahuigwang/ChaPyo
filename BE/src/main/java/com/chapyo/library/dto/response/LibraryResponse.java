package com.chapyo.library.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "라이브러리 목록 응답")
public class LibraryResponse {

    @Schema(description = "라이브러리 ID", example = "1")
    private Long libraryId;

    @Schema(description = "제목", example = "제주도 3박 4일")
    private String title;

    @Schema(description = "설명", example = "맛집 위주로 짠 제주도 여행")
    private String description;

    @Schema(description = "작성자 닉네임", example = "chapyo")
    private String nickname;

    @Schema(description = "조회수", example = "100")
    private int viewCount;

    @Schema(description = "불러오기 수", example = "30")
    private int importCount;

    @Schema(description = "게시일", example = "2026-06-08T10:00:00")
    private LocalDateTime createdAt;
}