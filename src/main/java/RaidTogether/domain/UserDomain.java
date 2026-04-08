package RaidTogether.domain;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserDomain {
    private int id;
    private String email;
    private String name;
    private String lostarkApiKey;
    private String googleSub;
    private UserDomainRoleEnum role;
    private UserDomainStatusEnum status;
    private String portraitUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
