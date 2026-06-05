package com.chapyo.user.service;

import com.chapyo.common.exception.CustomException;
import com.chapyo.user.dto.response.UserInfoResponse;
import com.chapyo.user.entity.User;
import com.chapyo.user.exception.UserErrorCode;
import com.chapyo.user.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;

    @Override
    public UserInfoResponse getMyInfo(Long userId) {
        User user = userMapper.findById(userId)
                .orElseThrow(() -> new CustomException(UserErrorCode.USER_NOT_FOUND));

        return UserInfoResponse.builder()
                .nickname(user.getNickname())
                .email(user.getEmail())
                .build();
    }
}
