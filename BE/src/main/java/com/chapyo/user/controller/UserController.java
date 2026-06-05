package com.chapyo.user.controller;

import com.chapyo.common.response.BaseResponse;
import com.chapyo.user.dto.response.UserInfoResponse;
import com.chapyo.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "User", description = "유저 관련 API")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    public ResponseEntity<BaseResponse<UserInfoResponse>> getMe(
            @AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(BaseResponse.success(userService.getMyInfo(userId)));
    }
}
