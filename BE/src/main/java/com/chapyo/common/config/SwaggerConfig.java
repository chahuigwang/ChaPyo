package com.chapyo.common.config;

import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.servers.Server;

@OpenAPIDefinition(
    info = @Info(
        title = "ChaPyo API",
        version = "v1",
        description = "ChaPyo REST API 명세서"
    ),
    servers = {
        @Server(url = "https://chapyo.duckdns.org", description = "Production Server"),
        @Server(url = "http://localhost:8080", description = "Local Server")
    }
)
@Configuration
public class SwaggerConfig {
	
	@Bean
	GroupedOpenApi placeOpenApi() {
		return GroupedOpenApi.builder()
				.group("Place 관련 API")
				.pathsToMatch("/api/v1/places/**")
				.build();
	}
}