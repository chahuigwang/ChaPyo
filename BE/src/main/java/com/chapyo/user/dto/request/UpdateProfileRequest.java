package com.chapyo.user.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Schema(description = "내 정보 수정 요청")
public class UpdateProfileRequest {

    @NotBlank(message = "닉네임을 입력해주세요.")
    @Schema(description = "닉네임", example = "chapyo")
    private String nickname;

    @NotBlank(message = "이메일을 입력해주세요.")
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    @Schema(description = "이메일", example = "chapyo@email.com")
    private String email;
}
