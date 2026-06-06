package com.chapyo.user.controller;

import com.chapyo.auth.security.CustomUserDetails;
import com.chapyo.common.response.BaseResponse;
import com.chapyo.user.dto.request.UpdatePasswordRequest;
import com.chapyo.user.dto.request.UpdateProfileRequest;
import com.chapyo.user.dto.response.UserInfoResponse;
import com.chapyo.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User", description = "유저 관련 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final LogoutHandler logoutHandler;

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ResponseEntity<BaseResponse<UserInfoResponse>> getMyInfo(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(BaseResponse.success(userService.getMyInfo(userId)));
    }

    @Operation(summary = "내 정보 수정")
    @PatchMapping("/me/profile")
    public ResponseEntity<BaseResponse<Void>> updateProfile(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid UpdateProfileRequest request) {

        userService.updateProfile(userId, request);
        return ResponseEntity.ok(BaseResponse.success("정보 수정 성공"));
    }

    @Operation(summary = "비밀번호 변경")
    @PatchMapping("/me/password")
    public ResponseEntity<BaseResponse<Void>> updatePassword(
            @AuthenticationPrincipal Long userId,
            @RequestBody @Valid UpdatePasswordRequest request) {

        userService.updatePassword(userId, request);
        return ResponseEntity.ok(BaseResponse.success("비밀번호 변경 성공"));
    }

    @Operation(summary = "회원 탈퇴")
    @DeleteMapping("/me")
    public ResponseEntity<BaseResponse<Void>> deleteUser(
            @AuthenticationPrincipal Long userId,
            HttpServletRequest request,
            HttpServletResponse response) {

        // soft delete
        userService.deleteUser(userId);

        // 로그아웃 처리
        logoutHandler.logout(request, response, null);

        return ResponseEntity.ok(BaseResponse.success("회원 탈퇴 성공"));
    }
}
