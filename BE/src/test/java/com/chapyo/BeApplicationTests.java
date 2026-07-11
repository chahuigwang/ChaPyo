package com.chapyo;

import com.chapyo.place.repository.AreaMapper;
import com.chapyo.place.repository.DistrictMapper;
import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {"spring.ai.google.genai.api-key=dummy-test-key-for-spring-context"})
@ActiveProfiles("test")
@EnableAutoConfiguration(exclude = {
        org.springframework.ai.vectorstore.chroma.autoconfigure.ChromaVectorStoreAutoConfiguration.class
})
class BeApplicationTests {

    @MockitoBean
    VectorStore vectorStore;

    @MockitoBean
    ChatClient chatClient;

    @MockitoBean
    AreaMapper areaMapper;

    @MockitoBean
    DistrictMapper districtMapper;

    @Test
    void contextLoads() {
    }
}