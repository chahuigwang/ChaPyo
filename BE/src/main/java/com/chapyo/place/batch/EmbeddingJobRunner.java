package com.chapyo.place.batch;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParameters;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("embedding")  // embedding 프로필일 때만 실행
@RequiredArgsConstructor
public class EmbeddingJobRunner implements ApplicationRunner {

    private final JobLauncher jobLauncher;
    private final Job embeddingJob;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        JobParameters params = new JobParametersBuilder()
            .addLong("run.id", System.currentTimeMillis())
            .toJobParameters();

        log.info("임베딩 Job 시작");
        jobLauncher.run(embeddingJob, params);
        log.info("임베딩 Job 완료");
    }
}