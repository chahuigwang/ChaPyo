package com.chapyo.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@OpenAPIDefinition(
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
            .info(new Info()
                .title("ChaPyo API")
                .version("1.0.0")
                .description("ChaPyo REST API 명세"));
    }
}
