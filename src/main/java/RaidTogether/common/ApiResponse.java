package RaidTogether.common;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ApiResponse<T> {
    private final boolean success;    // 성공 여부
    private final String message;     // 응답 메시지
    private final T data;            // 성공 시 전달할 데이터 (실패 시 null)
    private final String errorCode;   // 실패 시 전달할 우리만의 에러 코드
    private final LocalDateTime timestamp;

    @Builder
    private ApiResponse(boolean success, String message, T data, String errorCode) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errorCode = errorCode;
        this.timestamp = LocalDateTime.now();
    }

    // 성공 응답 정적 팩토리 메서드
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    // 실패 응답 정적 팩토리 메서드 (에러 시 데이터는 Void로 고정)
    public static ApiResponse<Void> fail(String errorCode, String message) {
        return ApiResponse.<Void>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .data(null)
                .build();
    }
}
