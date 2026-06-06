package com.chapyo.user.service;

import com.chapyo.common.exception.CustomException;
import com.chapyo.common.exception.ErrorCode;
import com.chapyo.user.dto.request.UpdatePasswordRequest;
import com.chapyo.user.dto.request.UpdateProfileRequest;
import com.chapyo.user.dto.response.UserInfoResponse;
import com.chapyo.user.entity.User;
import com.chapyo.user.exception.UserErrorCode;
import com.chapyo.user.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserInfoResponse getMyInfo(Long userId) {
        User user = userMapper.findById(userId)
                .orElseThrow(() -> new CustomException(UserErrorCode.USER_NOT_FOUND));

        return UserInfoResponse.builder()
                .nickname(user.getNickname())
                .email(user.getEmail())
                .build();
    }

    @Override
    @Transactional
    public void updateProfile(Long userId, UpdateProfileRequest request) {
        userMapper.updateProfile(userId, request.getNickname(), request.getEmail());
    }

    @Override
    public void updatePassword(Long userId, UpdatePasswordRequest request) {
        User user = userMapper.findById(userId)
                .orElseThrow(() -> new CustomException(UserErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new CustomException(UserErrorCode.INVALID_PASSWORD);
        }

        String encodedPassword = passwordEncoder.encode(request.getNewPassword());
        userMapper.updatePassword(userId, encodedPassword);
    }
}
