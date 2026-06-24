package com.chapyo.library.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "라이브러리 게시 요청")
public class LibraryPostRequest {

    @Schema(description = "여행 계획 ID", example = "1")
    @NotNull
    private Long planId;

    @Schema(description = "제목", example = "제주도 3박 4일")
    @NotBlank
    private String title;

    @Schema(description = "설명", example = "맛집 위주로 짠 제주도 여행")
    private String description;
}