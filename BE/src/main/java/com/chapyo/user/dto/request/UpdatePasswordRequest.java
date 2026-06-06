package com.chapyo.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "비밀 번호 요청")
public class UpdatePasswordRequest {

    @NotBlank(message = "현재 비밀번호를 입력해주세요.")
    @Schema(description = "현재 비밀번호", example = "1234")
    private String currentPassword;

    @NotBlank(message = "새 비밀번호를 입력해주세요.")
    @Schema(description = "현재 비밀번호", example = "2345")
    private String newPassword;
}
