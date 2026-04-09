package RaidTogether.config.security;

import RaidTogether.service.CustomOAuth2UserService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
    private CustomOAuth2UserService customOAuth2UserService;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    @PostConstruct
    public void checkConfig() {
        System.out.println("========= OAuth 설정 확인 =========");
        System.out.println("ID: " + clientId);
        System.out.println("Secret: " + clientSecret);
        System.out.println("==================================");
    }


    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // 초기 개발 단계에서 편리함을 위해 비활성화
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login/**", "/error", "/css/**", "/js/**", "/register", "/").permitAll() // 누구나 접근 가능
                        .anyRequest().authenticated() // 그 외 모든 요청은 로그인 필요
                )
                .formLogin(form -> form
                        .loginPage("/login")   // 로그인 페이지 URL
                        .defaultSuccessUrl("/")
                        .permitAll()
                )
                .oauth2Login(oauth2 -> oauth2
                        .loginPage("/login")
                        .failureHandler((request, response, exception) -> {
                            // 여기서 에러 메시지를 출력해봅니다.
                            System.out.println("로그인 실패 원인: " + exception.getMessage());
                            response.sendRedirect("/login?error");
                        })
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService) // "여기서 내 서비스 써라!"라고 지정
                        )
                );

        return http.build();
    }
}