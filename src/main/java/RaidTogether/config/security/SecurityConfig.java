package RaidTogether.config.security;

import RaidTogether.service.CustomOAuth2UserService;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // 초기 개발 단계에서 편리함을 위해 비활성화
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/login/**", "/error").permitAll() // 누구나 접근 가능
                        .anyRequest().authenticated() // 그 외 모든 요청은 로그인 필요
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService) // "여기서 내 서비스 써라!"라고 지정
                        )
                );

        return http.build();
    }
}