package com.chapyo.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
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
	public OpenAPI openAPI() {
		return new OpenAPI()
				.addSecurityItem(new SecurityRequirement().addList("JWT"))
				.components(new Components()
						.addSecuritySchemes("JWT", new SecurityScheme()
								.name("JWT")
								.type(SecurityScheme.Type.HTTP)
								.scheme("bearer")
								.bearerFormat("JWT")));
	}

	@Bean
	GroupedOpenApi placeOpenApi() {
		return GroupedOpenApi.builder()
				.group("Place 관련 API")
				.pathsToMatch("/api/v1/places/**")
				.build();
	}

	@Bean
	GroupedOpenApi authOpenApi() {
		return GroupedOpenApi.builder()
				.group("Auth 관련 API")
				.pathsToMatch("/api/v1/auth/**")
				.build();
	}

	@Bean
	GroupedOpenApi userOpenApi() {
		return GroupedOpenApi.builder()
				.group("User 관련 API")
				.pathsToMatch("/api/v1/users/**")
				.build();
	}

	@Bean
	GroupedOpenApi tripOpenApi() {
		return GroupedOpenApi.builder()
				.group("Trip 관련 API")
				.pathsToMatch("/api/v1/trips/**")
				.build();
	}
}