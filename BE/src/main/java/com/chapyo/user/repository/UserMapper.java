package com.chapyo.user.repository;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;

import com.chapyo.user.entity.User;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

	Optional<User> findByEmail(String email);
	Optional<User> findByNicknameAndEmail(@Param("nickname") String nickname, @Param("email") String email);
	void insert(User user);
	void updatePassword(@Param("userId") Long userId, @Param("password") String password);
}
