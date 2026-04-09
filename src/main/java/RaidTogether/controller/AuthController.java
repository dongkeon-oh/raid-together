package RaidTogether.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    @RequestMapping("/register")
    public String test(){
        return "pipe line works => " + secret;
    }
}
