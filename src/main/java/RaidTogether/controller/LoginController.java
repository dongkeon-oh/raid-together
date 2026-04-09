package RaidTogether.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {
    @GetMapping("/login")
    public String login() {
        return "login"; // templates/login.html을 리턴
    }

    @GetMapping("/register")
    public String register() {
        return "register"; // templates/login.html을 리턴
    }
}
