package RaidTogether.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;

@Setter
@Getter
@AllArgsConstructor
@ToString
public class UserDto {
    private int id;
    private String email;
    private String name;
    private String lostarkApiKey;
    private String googleSub;
    private String role;
    private String status;
    private String portraitUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
